import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth.js';

dotenv.config();

const prisma = new PrismaClient();
const app = createApp(prisma);

let adminToken = '';
let techToken = '';
let adminId = '';
let employeeId = '';
let equipmentId = '';
let ticketId = 0;

describe('ITSM Desk Pro — Testy integracyjne REST API', () => {
  beforeAll(async () => {
    // Czyszczenie bazy testowej przed uruchomieniem scenariusza
    await prisma.comment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.equipmentHistory.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.user.deleteMany();

    const adminHash = await hashPassword('Admin123!');
    const techHash = await hashPassword('Tech123!');

    const admin = await prisma.user.create({
      data: {
        firstName: 'Adam',
        lastName: 'Adminowski',
        email: 'test.admin@itsm.local',
        department: 'IT',
        role: 'ADMIN',
        passwordHash: adminHash,
        isActive: true
      }
    });
    adminId = admin.id;

    await prisma.user.create({
      data: {
        firstName: 'Jan',
        lastName: 'Technik',
        email: 'test.tech@itsm.local',
        department: 'IT',
        role: 'TECHNICIAN',
        passwordHash: techHash,
        isActive: true
      }
    });

    await prisma.user.create({
      data: {
        firstName: 'Były',
        lastName: 'Pracownik',
        email: 'offboarded@itsm.local',
        department: 'IT',
        role: 'TECHNICIAN',
        passwordHash: techHash,
        isActive: false
      }
    });

    const employee = await prisma.user.create({
      data: {
        firstName: 'Ewa',
        lastName: 'Testowa',
        email: 'ewa.testowa@firma.pl',
        department: 'Finanse',
        role: 'EMPLOYEE',
        isActive: true
      }
    });
    employeeId = employee.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Uwierzytelnianie JWT i ochrona tras', () => {
    it('odrzuca nieautoryzowane zapytanie do chronionego endpointu kodem 401', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.status).toBe(401);
    });

    it('odrzuca logowanie przy błędnym haśle kodem 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test.admin@itsm.local', password: 'ZleHaslo999!' });

      expect(res.status).toBe(401);
    });

    it('blokuje logowanie konta dezaktywowanego w procedurze offboardingu kodem 403', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'offboarded@itsm.local', password: 'Tech123!' });

      expect(res.status).toBe(403);
    });

    it('loguje Administratora i Technika IT, zwracając podpisane tokeny JWT bez wycieku passwordHash', async () => {
      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test.admin@itsm.local', password: 'Admin123!' });

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.token).toBeTruthy();
      expect(adminRes.body.user.role).toBe('ADMIN');
      expect(adminRes.body.user.passwordHash).toBeUndefined();
      adminToken = adminRes.body.token;

      const techRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test.tech@itsm.local', password: 'Tech123!' });

      expect(techRes.status).toBe(200);
      expect(techRes.body.token).toBeTruthy();
      expect(techRes.body.user.role).toBe('TECHNICIAN');
      techToken = techRes.body.token;
    });

    it('zwraca dane bieżącej sesji z endpointu GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test.admin@itsm.local');
    });
  });

  describe('2. Cykl życia zasobu CMDB i ślad audytowy (EquipmentHistory)', () => {
    it('rejestruje urządzenie na magazynie i zapisuje pierwszy wpis historii CREATED', async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          name: 'Dell Latitude 7440 Test',
          serialNumber: 'TEST-SN-2026-01',
          status: 'IN_STORAGE',
          location: 'Magazyn IT'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('IN_STORAGE');
      equipmentId = res.body.id;
    });

    it('przeprowadza wydanie, odbiór z checklistą oraz powrót na magazyn z zapisem wykonawcy', async () => {
      // Wydanie pracownikowi
      const assignRes = await request(app)
        .patch(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          assignedUserId: employeeId,
          status: 'IN_USE',
          location: 'Pokój 302'
        });
      expect(assignRes.status).toBe(200);
      expect(assignRes.body.status).toBe('IN_USE');

      // Odbiór od pracownika z protokołem
      const returnRes = await request(app)
        .patch(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          assignedUserId: null,
          status: 'RETURNED',
          lastReturnedAt: new Date().toISOString(),
          lastReturnChecklist: {
            returnedFrom: 'Ewa Testowa',
            notes: 'Zwrot kompletny',
            items: [{ key: 'physical_check', label: 'Brak uszkodzeń', checked: true }]
          }
        });
      expect(returnRes.status).toBe(200);
      expect(returnRes.body.status).toBe('RETURNED');

      // Zatwierdzenie na magazyn po przygotowaniu
      const storageRes = await request(app)
        .patch(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'IN_STORAGE' });
      expect(storageRes.status).toBe(200);

      // Weryfikacja osi czasu historii urządzenia
      const detailsRes = await request(app)
        .get(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.history).toHaveLength(4);
      const actions = detailsRes.body.history.map((h: any) => h.action);
      expect(actions).toEqual(['IN_STORAGE', 'RETURNED', 'ASSIGNED', 'CREATED']);
      expect(detailsRes.body.history[0].performedByName).toBe('Jan Technik');
    });
  });

  describe('3. Kontrola dostępu RBAC i spójność danych przy usuwaniu użytkownika', () => {
    it('blokuje trwałe usunięcie użytkownika i sprzętu dla roli TECHNICIAN kodem 403', async () => {
      const delUserRes = await request(app)
        .delete(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${techToken}`);
      expect(delUserRes.status).toBe(403);

      const delEqRes = await request(app)
        .delete(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`);
      expect(delEqRes.status).toBe(403);
    });

    it('uniemożliwia administratorowi usunięcie własnego aktywnego konta (kod 400)', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('chroni spójność danych (409 Conflict) i zachowuje snapshot nazwiska po zamknięciu spraw', async () => {
      // Ponowne przypisanie urządzenia do Ewy Testowej
      await request(app)
        .patch(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ assignedUserId: employeeId, status: 'IN_USE' });

      // Utworzenie zgłoszenia serwisowego powiązanego ze sprzętem
      const ticketRes = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          title: 'Testowa awaria matrycy',
          description: 'Migotanie ekranu po wybudzeniu',
          category: 'Sprzęt',
          priority: 'Krytyczny',
          requesterId: employeeId,
          equipmentId
        });

      expect(ticketRes.status).toBe(201);
      ticketId = ticketRes.body.id;

      // Dodanie wpisu do dziennika prac
      const commentRes = await request(app)
        .post(`/api/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ content: 'Zaktualizowano sterowniki karty graficznej.' });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.author).toBe('Jan Technik');

      // Próba usunięcia pracownika z przypisanym sprzętem -> 409 Conflict
      const blockedByEq = await request(app)
        .delete(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(blockedByEq.status).toBe(409);

      // Odpięcie sprzętu, ale zgłoszenie nadal pozostaje otwarte -> 409 Conflict
      await request(app)
        .patch(`/api/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ assignedUserId: null, status: 'IN_STORAGE' });

      const blockedByTicket = await request(app)
        .delete(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(blockedByTicket.status).toBe(409);

      // Zamknięcie zgłoszenia i trwałe usunięcie konta pracownika -> 204 No Content
      await request(app)
        .patch(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'RESOLVED' });

      const deleteOk = await request(app)
        .delete(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteOk.status).toBe(204);

      // Weryfikacja zachowania snapshotu requesterName na historycznym zgłoszeniu
      const archivedTicket = await request(app)
        .get(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(archivedTicket.status).toBe(200);
      expect(archivedTicket.body.requesterId).toBeNull();
      expect(archivedTicket.body.requesterName).toBe('Ewa Testowa');
    });
  });

  describe('4. Statystyki zarządcze Dashboardu', () => {
    it('zwraca zagregowane liczniki zgłoszeń i zasobów CMDB', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets.total).toBeGreaterThanOrEqual(1);
      expect(res.body.tickets.resolved).toBeGreaterThanOrEqual(1);
      expect(res.body.equipment.total).toBeGreaterThanOrEqual(1);
    });
  });
});