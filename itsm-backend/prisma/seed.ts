import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth.js';

const prisma = new PrismaClient();

const daysAgo = (days: number, hoursOffset = 0) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000 + hoursOffset * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Rozpoczynanie zasilania bazy danych ITSM Desk Pro...');

  // 1. Czyszczenie dotychczasowych danych w kolejności zależności
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.equipmentHistory.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await hashPassword('Admin123!');
  const techPass = await hashPassword('Tech123!');

  // 2. Użytkownicy (Zespół IT + Pracownicy + Offboarding)
  const admin = await prisma.user.create({
    data: {
      firstName: 'Hubert',
      lastName: 'Woźniak',
      email: 'admin@itsm.local',
      phone: '+48 501 100 200',
      department: 'IT',
      position: 'Administrator Systemów IT',
      role: 'ADMIN',
      passwordHash: adminPass,
      isActive: true
    }
  });

  const tech1 = await prisma.user.create({
    data: {
      firstName: 'Jan',
      lastName: 'Nowak',
      email: 'technik@itsm.local',
      phone: '+48 501 100 201',
      department: 'IT',
      position: 'Starszy Technik Helpdesk',
      role: 'TECHNICIAN',
      passwordHash: techPass,
      isActive: true
    }
  });

  const tech2 = await prisma.user.create({
    data: {
      firstName: 'Katarzyna',
      lastName: 'Zielińska',
      email: 'katarzyna.zielinska@itsm.local',
      phone: '+48 501 100 202',
      department: 'IT',
      position: 'Specjalista Wsparcia IT',
      role: 'TECHNICIAN',
      passwordHash: techPass,
      isActive: true
    }
  });

  const emp1 = await prisma.user.create({
    data: {
      firstName: 'Anna',
      lastName: 'Kowalska',
      email: 'anna.kowalska@firma.pl',
      phone: '+48 602 310 410',
      department: 'Księgowość',
      position: 'Główna Księgowa',
      role: 'EMPLOYEE',
      isActive: true
    }
  });

  const emp2 = await prisma.user.create({
    data: {
      firstName: 'Marek',
      lastName: 'Wiśniewski',
      email: 'marek.wisniewski@firma.pl',
      phone: '+48 602 310 411',
      department: 'Sprzedaż',
      position: 'Key Account Manager',
      role: 'EMPLOYEE',
      isActive: true
    }
  });

  const emp3 = await prisma.user.create({
    data: {
      firstName: 'Karolina',
      lastName: 'Lewandowska',
      email: 'karolina.lewandowska@firma.pl',
      phone: '+48 602 310 412',
      department: 'Kadry i Płace',
      position: 'HR Business Partner',
      role: 'EMPLOYEE',
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      firstName: 'Piotr',
      lastName: 'Dąbrowski',
      email: 'piotr.dabrowski@firma.pl',
      phone: '+48 602 310 499',
      department: 'Logistyka',
      position: 'Koordynator Magazynu',
      role: 'EMPLOYEE',
      isActive: false,
      offboardedAt: daysAgo(3),
      offboardingChecklist: {
        completedAt: daysAgo(3).toISOString(),
        items: [
          { key: 'ad_disable', label: 'Zablokowano konto domenowe Active Directory / Entra ID', checked: true },
          { key: 'm365_revoke', label: 'Cofnięto sesje poczty e-mail i licencje Microsoft 365', checked: true },
          { key: 'vpn_revoke', label: 'Unieważniono certyfikaty dostępu zdalnego VPN', checked: true },
          { key: 'equipment_verified', label: 'Zweryfikowano zwrot wszystkich zasobów sprzętowych CMDB', checked: true }
        ]
      }
    }
  });

  // 3. Ewidencja sprzętu CMDB z pełną historią cyklu życia
  const eq1 = await prisma.equipment.create({
    data: {
      name: 'Dell Latitude 5540',
      serialNumber: 'DL5540-PL-001',
      status: 'IN_USE',
      assignedUserId: emp1.id,
      location: 'Pokój 104 (Księgowość)',
      createdAt: daysAgo(60),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB (faktura FV/2026/018)',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(60)
          },
          {
            action: 'ASSIGNED',
            userId: emp1.id,
            userName: 'Anna Kowalska',
            performedByName: 'Jan Nowak',
            notes: 'Wydano wraz ze stacją dokującą USB-C',
            createdAt: daysAgo(58)
          }
        ]
      }
    }
  });

  const eq2 = await prisma.equipment.create({
    data: {
      name: 'Lenovo ThinkPad T14 Gen 4',
      serialNumber: 'LNV-T14-002',
      status: 'IN_USE',
      assignedUserId: emp2.id,
      location: 'Praca hybrydowa / Sprzedaż',
      createdAt: daysAgo(45),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(45)
          },
          {
            action: 'ASSIGNED',
            userId: emp2.id,
            userName: 'Marek Wiśniewski',
            performedByName: 'Katarzyna Zielińska',
            createdAt: daysAgo(42)
          }
        ]
      }
    }
  });

  await prisma.equipment.create({
    data: {
      name: 'Apple MacBook Pro 14 M3',
      serialNumber: 'APL-MBP14-003',
      status: 'IN_USE',
      assignedUserId: emp3.id,
      location: 'Pokój 210 (HR)',
      createdAt: daysAgo(30),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(30)
          },
          {
            action: 'ASSIGNED',
            userId: emp3.id,
            userName: 'Karolina Lewandowska',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(29)
          }
        ]
      }
    }
  });

  // Laptop odebrany po offboardingu Piotra Dąbrowskiego — oczekuje na przygotowanie (RETURNED)
  await prisma.equipment.create({
    data: {
      name: 'Dell Latitude 5440',
      serialNumber: 'DL5440-PL-004',
      status: 'RETURNED',
      assignedUserId: null,
      location: 'Serwis IT — stanowisko przygotowania',
      lastReturnedAt: daysAgo(3),
      lastReturnChecklist: {
        returnedFrom: 'Piotr Dąbrowski',
        returnedAt: daysAgo(3).toISOString(),
        notes: 'Zwrot w ramach procedury offboardingu. Obudowa w stanie bardzo dobrym, zasilacz w komplecie.',
        items: [
          { key: 'physical_check', label: 'Brak uszkodzeń mechanicznych obudowy i matrycy', checked: true },
          { key: 'accessories', label: 'Zwrócono zasilacz sieciowy oraz akcesoria', checked: true },
          { key: 'data_backup', label: 'Zabezpieczono dane lokalne i odpięto profil użytkownika', checked: true },
          { key: 'wipe_scheduled', label: 'Skierowano do reinstalacji systemu przed ponownym wydaniem', checked: true }
        ]
      },
      createdAt: daysAgo(90),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(90)
          },
          {
            action: 'ASSIGNED',
            userName: 'Piotr Dąbrowski',
            performedByName: 'Jan Nowak',
            createdAt: daysAgo(85)
          },
          {
            action: 'RETURNED',
            userName: 'Piotr Dąbrowski',
            performedByName: 'Jan Nowak',
            notes: 'Zwrot w ramach procedury offboardingu. Obudowa w stanie bardzo dobrym.',
            createdAt: daysAgo(3)
          }
        ]
      }
    }
  });

  // Urządzenie po naprawie gwarancyjnej gotowe na magazynie (IN_STORAGE)
  await prisma.equipment.create({
    data: {
      name: 'HP EliteBook 840 G10',
      serialNumber: 'HP840-G10-005',
      status: 'IN_STORAGE',
      assignedUserId: null,
      location: 'Magazyn IT — Szafa A2',
      createdAt: daysAgo(120),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(120)
          },
          {
            action: 'ASSIGNED',
            userId: emp2.id,
            userName: 'Marek Wiśniewski',
            performedByName: 'Jan Nowak',
            createdAt: daysAgo(110)
          },
          {
            action: 'NEEDS_REPLACEMENT',
            userId: emp2.id,
            userName: 'Marek Wiśniewski',
            performedByName: 'Jan Nowak',
            notes: 'Zgłoszono usterkę baterii — przekazano do serwisu producenta',
            createdAt: daysAgo(50)
          },
          {
            action: 'IN_STORAGE',
            performedByName: 'Hubert Woźniak',
            notes: 'Powrót z serwisu / naprawy na magazyn (wymieniona bateria)',
            createdAt: daysAgo(43)
          }
        ]
      }
    }
  });

  await prisma.equipment.create({
    data: {
      name: 'Monitor Dell UltraSharp U2723QE',
      serialNumber: 'DL-MON-006',
      status: 'IN_STORAGE',
      assignedUserId: null,
      location: 'Magazyn IT — Regał B1',
      createdAt: daysAgo(20),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB',
            performedByName: 'Katarzyna Zielińska',
            createdAt: daysAgo(20)
          }
        ]
      }
    }
  });

  // Sprzęt uszkodzony / zakwalifikowany do wymiany (NEEDS_REPLACEMENT)
  const eq7 = await prisma.equipment.create({
    data: {
      name: 'Lenovo ThinkPad L15 Gen 2',
      serialNumber: 'LNV-L15-007',
      status: 'NEEDS_REPLACEMENT',
      assignedUserId: null,
      location: 'Serwis zewnętrzny — zgłoszenie gwarancyjne',
      createdAt: daysAgo(200),
      history: {
        create: [
          {
            action: 'CREATED',
            notes: 'Przyjęto do ewidencji CMDB',
            performedByName: 'Hubert Woźniak',
            createdAt: daysAgo(200)
          },
          {
            action: 'ASSIGNED',
            userId: emp3.id,
            userName: 'Karolina Lewandowska',
            performedByName: 'Jan Nowak',
            createdAt: daysAgo(180)
          },
          {
            action: 'NEEDS_REPLACEMENT',
            performedByName: 'Jan Nowak',
            notes: 'Uszkodzone gniazdo ładowania USB-C na płycie głównej',
            createdAt: daysAgo(2)
          }
        ]
      }
    }
  });

  // 4. Zgłoszenia serwisowe (Tickets) i Dziennik prac (Comments)
  await prisma.ticket.create({
    data: {
      title: 'Brak dostępu do modułu rozliczeń VAT w systemie ERP',
      description:
        'Po porannej aktualizacji certyfikatów podczas próby zatwierdzenia deklaracji pojawia się komunikat o braku uprawnień sesji.',
      category: 'Oprogramowanie',
      priority: 'Krytyczny',
      status: 'IN_PROGRESS',
      requesterId: emp1.id,
      requesterName: 'Anna Kowalska',
      assigneeId: tech1.id,
      assigneeName: 'Jan Nowak',
      equipmentId: eq1.id,
      createdAt: daysAgo(0, -4),
      comments: {
        create: [
          {
            author: 'Jan Nowak',
            content: 'Zweryfikowano profil domenowy użytkowniczki — wymagane odświeżenie tokenu w bazie ERP.',
            createdAt: daysAgo(0, -3)
          },
          {
            author: 'Hubert Woźniak',
            content: 'Nadano brakującą rolę w grupie AD_ERP_KSIEGOWOSC, oczekujemy na potwierdzenie po przelogowaniu.',
            createdAt: daysAgo(0, -1)
          }
        ]
      }
    }
  });

  await prisma.ticket.create({
    data: {
      title: 'Przerywające połączenie VPN podczas pracy zdalnej',
      description: 'Klient FortiClient rozłącza tunel co około 15 minut przy pracy na łączu domowym.',
      category: 'Sieć / VPN',
      priority: 'Wysoki',
      status: 'NEW',
      requesterId: emp2.id,
      requesterName: 'Marek Wiśniewski',
      equipmentId: eq2.id,
      createdAt: daysAgo(0, -2)
    }
  });

  await prisma.ticket.create({
    data: {
      title: 'Uszkodzone gniazdo ładowania USB-C — przekazano laptop zastępczy',
      description: 'Laptop nie ładuje baterii na żadnym z portów USB-C. Urządzenie przekazano do serwisu.',
      category: 'Sprzęt',
      priority: 'Wysoki',
      status: 'IN_PROGRESS',
      requesterId: emp3.id,
      requesterName: 'Karolina Lewandowska',
      assigneeId: tech2.id,
      assigneeName: 'Katarzyna Zielińska',
      equipmentId: eq7.id,
      createdAt: daysAgo(2),
      comments: {
        create: [
          {
            author: 'Katarzyna Zielińska',
            content: 'Potwierdzono usterkę sprzętową portu zasilania. Wydano pracownicy MacBooka Pro jako sprzęt docelowy.',
            createdAt: daysAgo(2, 2)
          }
        ]
      }
    }
  });

  await prisma.ticket.create({
    data: {
      title: 'Konfiguracja podpisu kwalifikowanego i czytnika kart',
      description: 'Prośba o instalację oprogramowania Szafir oraz konfigurację w Adobe Acrobat.',
      category: 'Oprogramowanie',
      priority: 'Średni',
      status: 'RESOLVED',
      requesterId: emp1.id,
      requesterName: 'Anna Kowalska',
      assigneeId: tech2.id,
      assigneeName: 'Katarzyna Zielińska',
      equipmentId: eq1.id,
      createdAt: daysAgo(12),
      comments: {
        create: [
          {
            author: 'Katarzyna Zielińska',
            content: 'Zainstalowano sterowniki czytnika oraz przetestowano złożenie podpisu na dokumencie testowym.',
            createdAt: daysAgo(11)
          }
        ]
      }
    }
  });

  // Zamknięte zgłoszenie byłego pracownika po trwałym usunięciu konta (demonstracja snapshotu requesterName)
  await prisma.ticket.create({
    data: {
      title: 'Nadanie dostępu do folderu sieciowego Działu Handlowego',
      description: 'Prośba o dopisanie do grupy udziałów sieciowych \\\\fileserver\\Oferty.',
      category: 'Dostępy i konta',
      priority: 'Niski',
      status: 'RESOLVED',
      requesterId: null,
      requesterName: 'Tomasz Kaczmarek (konto usunięte)',
      assigneeId: tech1.id,
      assigneeName: 'Jan Nowak',
      createdAt: daysAgo(35),
      comments: {
        create: [
          {
            author: 'Jan Nowak',
            content: 'Uprawnienia nadane zgodnie z akceptacją kierownika działu.',
            createdAt: daysAgo(34)
          }
        ]
      }
    }
  });

  console.log('✅ Baza danych została pomyślnie zasilona danymi demonstracyjnymi.');
}

main()
  .catch((error) => {
    console.error('❌ Błąd podczas wykonywania seeda:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });