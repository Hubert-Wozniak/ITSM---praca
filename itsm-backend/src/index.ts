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

const userSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  department: true,
  role: true,
  isActive: true
};

// --- UŻYTKOWNICY (USERS) ---

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      include: {
        _count: {
          select: {
            equipment: true,
            requestedTickets: true,
            assignedTickets: true
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Błąd pobierania użytkowników:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania użytkowników.' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        equipment: {
          orderBy: { name: 'asc' }
        },
        requestedTickets: {
          orderBy: { createdAt: 'desc' },
          take: 15
        },
        assignedTickets: {
          orderBy: { createdAt: 'desc' },
          take: 15
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika.' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Błąd pobierania szczegółów użytkownika:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania szczegółów użytkownika.' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, department, position, role } = req.body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !department?.trim()) {
      res.status(400).json({ error: 'Imię, nazwisko, e-mail oraz dział są wymagane.' });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        department: department.trim(),
        position: position?.trim() || null,
        role: role || 'EMPLOYEE',
        isActive: true
      },
      include: {
        _count: {
          select: {
            equipment: true,
            requestedTickets: true,
            assignedTickets: true
          }
        }
      }
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Użytkownik o podanym adresie e-mail już istnieje.' });
      return;
    }
    console.error('Błąd tworzenia użytkownika:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas zapisywania użytkownika.' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      role,
      isActive,
      offboardedAt,
      offboardingChecklist
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(department !== undefined && { department: department.trim() }),
        ...(position !== undefined && { position: position?.trim() || null }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(offboardedAt !== undefined && { offboardedAt: offboardedAt ? new Date(offboardedAt) : null }),
        ...(offboardingChecklist !== undefined && { offboardingChecklist })
      },
      include: {
        _count: {
          select: {
            equipment: true,
            requestedTickets: true,
            assignedTickets: true
          }
        }
      }
    });

    res.json(updatedUser);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Podany adres e-mail jest już przypisany do innego konta.' });
      return;
    }
    console.error('Błąd aktualizacji użytkownika:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować danych użytkownika.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Nie znaleziono użytkownika.' });
      return;
    }

    const [equipmentCount, openRequestedCount, openAssignedCount] = await Promise.all([
      prisma.equipment.count({ where: { assignedUserId: id } }),
      prisma.ticket.count({
        where: {
          requesterId: id,
          status: { not: 'RESOLVED' }
        }
      }),
      prisma.ticket.count({
        where: {
          assigneeId: id,
          status: { not: 'RESOLVED' }
        }
      })
    ]);

    if (equipmentCount > 0) {
      res.status(409).json({
        error: `Nie można usunąć użytkownika — nadal posiada przypisany sprzęt (${equipmentCount} szt.). Odbierz urządzenia w Ewidencji Sprzętu.`
      });
      return;
    }

    if (openRequestedCount > 0 || openAssignedCount > 0) {
      res.status(409).json({
        error: 'Nie można usunąć użytkownika powiązanego z otwartymi zgłoszeniami. Zamknij lub przepisz aktywne zgłoszenia.'
      });
      return;
    }

    const fullNameSnapshot = `${user.firstName} ${user.lastName}`;

    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { requesterId: id },
        data: { requesterName: fullNameSnapshot }
      }),
      prisma.ticket.updateMany({
        where: { assigneeId: id },
        data: { assigneeName: fullNameSnapshot }
      }),
      prisma.equipmentHistory.updateMany({
        where: { userId: id },
        data: { userName: fullNameSnapshot }
      }),
      prisma.user.delete({
        where: { id }
      })
    ]);

    res.status(204).send();
  } catch (error) {
    console.error('Błąd usuwania użytkownika:', error);
    res.status(500).json({ error: 'Nie udało się usunąć użytkownika.' });
  }
});

// --- SPRZĘT (EQUIPMENT) ---

app.get('/api/equipment', async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: userSummarySelect
        },
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

app.get('/api/equipment/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const item = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: userSummarySelect
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            requester: {
              select: userSummarySelect
            }
          }
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: userSummarySelect
            }
          }
        }
      }
    });

    if (!item) {
      res.status(404).json({ error: 'Nie znaleziono urządzenia.' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Błąd pobierania szczegółów urządzenia:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas pobierania szczegółów urządzenia.' });
  }
});

app.post('/api/equipment', async (req, res) => {
  try {
    const { name, serialNumber, status, assignedUserId, location } = req.body;
    const initialStatus = status || 'IN_STORAGE';

    const newEquipment = await prisma.equipment.create({
      data: {
        name,
        serialNumber,
        status: initialStatus,
        assignedUserId: assignedUserId || null,
        location: location || null
      },
      include: {
        assignedUser: {
          select: userSummarySelect
        }
      }
    });

    await prisma.equipmentHistory.create({
      data: {
        equipmentId: newEquipment.id,
        action: 'CREATED',
        notes: initialStatus === 'NEEDS_REPLACEMENT' ? 'Dodano z oznaczeniem: Do wymiany / naprawy' : 'Przyjęto do ewidencji CMDB'
      }
    });

    if (newEquipment.assignedUserId && newEquipment.assignedUser) {
      await prisma.equipmentHistory.create({
        data: {
          equipmentId: newEquipment.id,
          userId: newEquipment.assignedUserId,
          userName: `${newEquipment.assignedUser.firstName} ${newEquipment.assignedUser.lastName}`,
          action: 'ASSIGNED',
          createdAt: new Date(Date.now() + 1)
        }
      });
    }

    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Błąd zapisu sprzętu:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas zapisywania sprzętu.' });
  }
});

app.patch('/api/equipment/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const {
      name,
      serialNumber,
      status,
      assignedUserId,
      location,
      lastReturnedAt,
      lastReturnChecklist
    } = req.body;

    const existing = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    if (!existing) {
      res.status(404).json({ error: 'Nie znaleziono urządzenia.' });
      return;
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(status !== undefined && { status }),
        ...(assignedUserId !== undefined && { assignedUserId: assignedUserId || null }),
        ...(location !== undefined && { location }),
        ...(lastReturnedAt !== undefined && { lastReturnedAt: lastReturnedAt ? new Date(lastReturnedAt) : null }),
        ...(lastReturnChecklist !== undefined && { lastReturnChecklist })
      },
      include: {
        assignedUser: {
          select: userSummarySelect
        }
      }
    });

    const prevUserName = existing.assignedUser
      ? `${existing.assignedUser.firstName} ${existing.assignedUser.lastName}`
      : null;
    const nextUserName = updatedEquipment.assignedUser
      ? `${updatedEquipment.assignedUser.firstName} ${updatedEquipment.assignedUser.lastName}`
      : null;

    const userChanged =
      assignedUserId !== undefined && existing.assignedUserId !== updatedEquipment.assignedUserId;
    const statusChanged = status !== undefined && existing.status !== updatedEquipment.status;

    const historyEntries: Array<{
      equipmentId: string;
      userId?: string | null;
      userName?: string | null;
      action: string;
      notes?: string | null;
      createdAt?: Date;
    }> = [];

    if (userChanged) {
      if (!existing.assignedUserId && updatedEquipment.assignedUserId) {
        historyEntries.push({
          equipmentId: id,
          userId: updatedEquipment.assignedUserId,
          userName: nextUserName,
          action: 'ASSIGNED'
        });
      } else if (existing.assignedUserId && updatedEquipment.assignedUserId) {
        historyEntries.push({
          equipmentId: id,
          userId: updatedEquipment.assignedUserId,
          userName: nextUserName,
          action: 'TRANSFERRED',
          notes: prevUserName ? `Poprzedni użytkownik: ${prevUserName}` : null
        });
      } else if (existing.assignedUserId && !updatedEquipment.assignedUserId) {
        historyEntries.push({
          equipmentId: id,
          userId: existing.assignedUserId,
          userName: prevUserName,
          action: 'RETURNED',
          notes: lastReturnChecklist?.notes || null
        });
      }
    }

    if (statusChanged) {
      if (updatedEquipment.status === 'NEEDS_REPLACEMENT') {
        historyEntries.push({
          equipmentId: id,
          userId: updatedEquipment.assignedUserId,
          userName: nextUserName,
          action: 'NEEDS_REPLACEMENT',
          createdAt: new Date(Date.now() + 1)
        });
      } else if (updatedEquipment.status === 'IN_STORAGE') {
        let storageNote: string | null = null;
        if (existing.status === 'NEEDS_REPLACEMENT') {
          storageNote = 'Powrót z serwisu / naprawy na magazyn';
        } else if (existing.status === 'RETURNED') {
          storageNote = 'Zakończono przygotowanie po zwrocie od pracownika';
        }
        historyEntries.push({
          equipmentId: id,
          userId: updatedEquipment.assignedUserId,
          userName: nextUserName,
          action: 'IN_STORAGE',
          notes: storageNote,
          createdAt: new Date(Date.now() + 1)
        });
      } else if (updatedEquipment.status === 'RETURNED' && !userChanged) {
        historyEntries.push({
          equipmentId: id,
          userId: existing.assignedUserId,
          userName: prevUserName,
          action: 'RETURNED',
          notes: lastReturnChecklist?.notes || null,
          createdAt: new Date(Date.now() + 1)
        });
      } else if (updatedEquipment.status === 'IN_USE' && !userChanged) {
        historyEntries.push({
          equipmentId: id,
          userId: updatedEquipment.assignedUserId,
          userName: nextUserName,
          action: 'ASSIGNED',
          notes: existing.status === 'NEEDS_REPLACEMENT' ? 'Powrót do użytku po naprawie' : null,
          createdAt: new Date(Date.now() + 1)
        });
      }
    }

    for (const entry of historyEntries) {
      await prisma.equipmentHistory.create({ data: entry });
    }

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
        requester: {
          select: userSummarySelect
        },
        assignee: {
          select: userSummarySelect
        },
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
        requester: {
          select: userSummarySelect
        },
        assignee: {
          select: userSummarySelect
        },
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
    const { title, description, category, priority, requesterId, assigneeId, equipmentId } = req.body;

    if (!title?.trim() || !requesterId) {
      res.status(400).json({ error: 'Temat zgłoszenia oraz osoba zgłaszająca są wymagane.' });
      return;
    }

    const requesterUser = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { firstName: true, lastName: true }
    });

    if (!requesterUser) {
      res.status(404).json({ error: 'Wybrana osoba zgłaszająca nie istnieje.' });
      return;
    }

    let assigneeName: string | null = null;
    if (assigneeId) {
      const assigneeUser = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { firstName: true, lastName: true }
      });
      if (assigneeUser) {
        assigneeName = `${assigneeUser.firstName} ${assigneeUser.lastName}`;
      }
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title: title.trim(),
        description: description || null,
        category,
        priority: priority || 'Średni',
        status: 'NEW',
        requesterId,
        requesterName: `${requesterUser.firstName} ${requesterUser.lastName}`,
        assigneeId: assigneeId || null,
        assigneeName,
        equipmentId: equipmentId || null
      },
      include: {
        requester: {
          select: userSummarySelect
        },
        assignee: {
          select: userSummarySelect
        },
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

    const { title, description, status, requesterId, assigneeId, priority, equipmentId } = req.body;

    let requesterNameUpdate: string | undefined;
    if (requesterId !== undefined && requesterId) {
      const reqUser = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { firstName: true, lastName: true }
      });
      if (reqUser) {
        requesterNameUpdate = `${reqUser.firstName} ${reqUser.lastName}`;
      }
    }

    let assigneeNameUpdate: string | null | undefined;
    if (assigneeId !== undefined) {
      if (assigneeId) {
        const assUser = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { firstName: true, lastName: true }
        });
        assigneeNameUpdate = assUser ? `${assUser.firstName} ${assUser.lastName}` : null;
      } else {
        assigneeNameUpdate = null;
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(status !== undefined && { status }),
        ...(requesterId !== undefined && { requesterId }),
        ...(requesterNameUpdate !== undefined && { requesterName: requesterNameUpdate }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(assigneeNameUpdate !== undefined && { assigneeName: assigneeNameUpdate }),
        ...(priority !== undefined && { priority }),
        ...(equipmentId !== undefined && { equipmentId: equipmentId || null })
      },
      include: {
        requester: {
          select: userSummarySelect
        },
        assignee: {
          select: userSummarySelect
        },
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
      returnedEquipment,
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
      prisma.equipment.count({ where: { status: 'RETURNED' } }),
      prisma.equipment.count({ where: { status: 'NEEDS_REPLACEMENT' } }),
      prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }),
      prisma.equipment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
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
        returned: returnedEquipment,
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