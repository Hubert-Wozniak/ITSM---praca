import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { ensureDefaultAccounts } from './auth.js';

dotenv.config();

const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
const app = createApp(prisma);

ensureDefaultAccounts(prisma).then(() => {
  app.listen(port, () => {
    console.log(`🚀 Serwer działa na porcie http://localhost:${port}`);
  });
});