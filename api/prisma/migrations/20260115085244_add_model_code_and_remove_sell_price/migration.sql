/*
  Warnings:

  - You are about to drop the column `sellPrice` on the `product_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "sellPrice";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "modelCode" TEXT;
