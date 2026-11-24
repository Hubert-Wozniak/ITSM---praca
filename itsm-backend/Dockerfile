FROM node:20-slim

# Biblioteka OpenSSL wymagana przez silnik zapytań Prisma w środowisku Linux
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

EXPOSE 3000

# Przy starcie kontenera aplikujemy migracje na bazie, a następnie uruchamiamy serwer
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]