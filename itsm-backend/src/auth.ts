import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'itsm-desk-pro-dev-secret-key-2026';
const JWT_EXPIRES_IN = '12h';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string | null;
  role: string;
  isActive: boolean;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

interface TokenPayload {
  userId: string;
  role: string;
}

export const signAuthToken = (user: Pick<AuthUser, 'id' | 'role'>): string => {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

export const hashPassword = async (plainPassword: string): Promise<string> => {
  return bcrypt.hash(plainPassword, 10);
};

export const verifyPassword = async (plainPassword: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hash);
};

export const createAuthMiddleware = (prisma: PrismaClient) => {
  const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Brak tokenu autoryzacyjnego. Zaloguj się ponownie.' });
        return;
      }

      const token = authHeader.slice(7).trim();
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        res.status(401).json({ error: 'Sesja wygasła lub konto zostało dezaktywowane.' });
        return;
      }

      if (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN') {
        res.status(403).json({ error: 'Brak uprawnień do panelu serwisowego ITSM.' });
        return;
      }

      req.authUser = user;
      next();
    } catch {
      res.status(401).json({ error: 'Nieprawidłowy lub wygasły token logowania.' });
    }
  };

  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser || req.authUser.role !== 'ADMIN') {
      res.status(403).json({ error: 'Ta operacja wymaga uprawnień Administratora.' });
      return;
    }
    next();
  };

  return { requireAuth, requireAdmin };
};

export const ensureDefaultAccounts = async (prisma: PrismaClient) => {
  try {
    const existingWithPassword = await prisma.user.count({
      where: { passwordHash: { not: null } }
    });

    if (existingWithPassword > 0) return;

    const adminHash = await hashPassword('Admin123!');
    await prisma.user.upsert({
      where: { email: 'admin@itsm.local' },
      update: {
        passwordHash: adminHash,
        role: 'ADMIN',
        isActive: true
      },
      create: {
        firstName: 'Hubert',
        lastName: 'Woźniak',
        email: 'admin@itsm.local',
        department: 'IT',
        position: 'Administrator IT',
        role: 'ADMIN',
        passwordHash: adminHash,
        isActive: true
      }
    });

    const techHash = await hashPassword('Tech123!');
    await prisma.user.upsert({
      where: { email: 'technik@itsm.local' },
      update: {
        passwordHash: techHash,
        role: 'TECHNICIAN',
        isActive: true
      },
      create: {
        firstName: 'Jan',
        lastName: 'Nowak',
        email: 'technik@itsm.local',
        department: 'IT',
        position: 'Technik Helpdesk',
        role: 'TECHNICIAN',
        passwordHash: techHash,
        isActive: true
      }
    });

    console.log('🔐 Utworzono konta startowe: admin@itsm.local (Admin123!) oraz technik@itsm.local (Tech123!)');
  } catch (error) {
    console.error('Błąd inicjalizacji kont startowych:', error);
  }
};