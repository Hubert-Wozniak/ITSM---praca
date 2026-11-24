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

// --- SPRZĘT (EQUIPMENT) ---

app.get('/api/equipment', async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tickets: true }
        }
      }
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

app.patch('/api/equipment/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, serialNumber, status, assignedUser, location } = req.body;

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(status !== undefined && { status }),
        ...(assignedUser !== undefined && { assignedUser }),
        ...(location !== undefined && { location })
      }
    });

    res.json(updatedEquipment);
  } catch (error) {
    console.error('Błąd aktualizacji sprzętu:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować sprzętu.' });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const id = String(req.params.id);

    await prisma.equipment.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Błąd usuwania sprzętu:', error);
    res.status(500).json({ error: 'Nie udało się usunąć sprzętu.' });
  }
});

// --- ZGŁOSZENIA (TICKETS) ---

app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            serialNumber: true
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Błąd pobierania zgłoszeń:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania zgłoszeń.' });
  }
});

// Szczegóły pojedynczego zgłoszenia wraz z dziennikiem prac
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID zgłoszenia.' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
            location: true
          }
        },
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Nie znaleziono zgłoszenia.' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Błąd pobierania szczegółów zgłoszenia:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania szczegółów.' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, category, priority, requester, equipmentId } = req.body;
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description: description || null,
        category,
        priority: priority || 'Średni',
        status: 'NEW',
        requester,
        equipmentId: equipmentId || null
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            serialNumber: true
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    });
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Błąd zapisu zgłoszenia:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas zapisywania zgłoszenia.' });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID zgłoszenia.' });
      return;
    }

    const { title, description, status, assignee, priority, equipmentId } = req.body;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status !== undefined && { status }),
        ...(assignee !== undefined && { assignee }),
        ...(priority !== undefined && { priority }),
        ...(equipmentId !== undefined && { equipmentId: equipmentId || null })
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            serialNumber: true
          }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Błąd aktualizacji zgłoszenia:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować zgłoszenia.' });
  }
});

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

// Dodanie wpisu do dziennika prac / komentarza
app.post('/api/tickets/:id/comments', async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Nieprawidłowe ID zgłoszenia.' });
      return;
    }

    const { author, content } = req.body;
    if (!author?.trim() || !content?.trim()) {
      res.status(400).json({ error: 'Autor i treść wpisu są wymagane.' });
      return;
    }

    const newComment = await prisma.comment.create({
      data: {
        ticketId,
        author: author.trim(),
        content: content.trim()
      }
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Błąd dodawania komentarza:', error);
    res.status(500).json({ error: 'Nie udało się dodać wpisu do dziennika.' });
  }
});

// Usunięcie pojedynczego wpisu z dziennika prac
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Nieprawidłowe ID komentarza.' });
      return;
    }

    await prisma.comment.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Błąd usuwania komentarza:', error);
    res.status(500).json({ error: 'Nie udało się usunąć komentarza.' });
  }
});

// --- DASHBOARD (STATYSTYKI) ---

app.get('/api/dashboard', async (req, res) => {
  try {
    const [
      totalTickets,
      newTickets,
      inProgressTickets,
      resolvedTickets,
      criticalOpenTickets,
      totalEquipment,
      inStorageEquipment,
      inUseEquipment,
      needsReplacementEquipment,
      recentTickets,
      recentEquipment
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'NEW' } }),
      prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.ticket.count({
        where: {
          priority: 'Krytyczny',
          status: { not: 'RESOLVED' }
        }
      }),
      prisma.equipment.count(),
      prisma.equipment.count({ where: { status: 'IN_STORAGE' } }),
      prisma.equipment.count({ where: { status: 'IN_USE' } }),
      prisma.equipment.count({ where: { status: 'NEEDS_REPLACEMENT' } }),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.equipment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      tickets: {
        total: totalTickets,
        new: newTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        criticalOpen: criticalOpenTickets
      },
      equipment: {
        total: totalEquipment,
        inStorage: inStorageEquipment,
        inUse: inUseEquipment,
        needsReplacement: needsReplacementEquipment
      },
      recentTickets,
      recentEquipment
    });
  } catch (error) {
    console.error('Błąd pobierania danych dashboardu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania statystyk.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serwer działa na porcie http://localhost:${port}`);
});