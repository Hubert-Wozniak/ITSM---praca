import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- SPRZĘT (EQUIPMENT) ---

app.get('/api/equipment', async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipment);
  } catch (error) {
    console.error('Błąd pobierania sprzętu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania sprzętu.' });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const { name, serialNumber, status } = req.body;
    const newEquipment = await prisma.equipment.create({
      data: {
        name,
        serialNumber,
        status: status || 'IN_STORAGE'
      }
    });
    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Błąd zapisu sprzętu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas zapisywania sprzętu.' });
  }
});

// --- ZGŁOSZENIA (TICKETS) ---

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Błąd pobierania zgłoszeń:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania zgłoszeń.' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title, category, priority, requester } = req.body;
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        category,
        priority: priority || 'Średni',
        status: 'NEW',
        requester
      }
    });
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Błąd zapisu zgłoszenia:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas zapisywania zgłoszenia.' });
  }
});

// Aktualizacja statusu, priorytetu lub przypisanego technika
app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID zgłoszenia.' });
      return;
    }

    const { status, assignee, priority } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(assignee !== undefined && { assignee }),
        ...(priority !== undefined && { priority })
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Błąd aktualizacji zgłoszenia:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować zgłoszenia.' });
  }
});

// Usuwanie zgłoszenia
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID zgłoszenia.' });
      return;
    }

    await prisma.ticket.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Błąd usuwania zgłoszenia:', error);
    res.status(500).json({ error: 'Nie udało się usunąć zgłoszenia.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serwer działa na porcie http://localhost:${port}`);
});