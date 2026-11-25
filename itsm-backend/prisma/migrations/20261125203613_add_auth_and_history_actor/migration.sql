-- AlterTable
ALTER TABLE "EquipmentHistory" ADD COLUMN     "performedByName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;
