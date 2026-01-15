-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('PROVIDER', 'WALKING_CUSTOMER');

-- DropForeignKey
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_providerId_fkey";

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "sellerInfo" TEXT,
ADD COLUMN     "type" "PurchaseType" NOT NULL DEFAULT 'PROVIDER',
ALTER COLUMN "providerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
