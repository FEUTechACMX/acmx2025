-- CreateEnum
CREATE TYPE "MerchCategory" AS ENUM ('APPAREL', 'ACCESSORIES', 'STICKERS', 'STATIONERY');

-- CreateEnum
CREATE TYPE "MerchStatus" AS ENUM ('AVAILABLE', 'SOLD_OUT', 'HIDDEN');

-- CreateEnum
CREATE TYPE "MerchOrderStatus" AS ENUM ('PENDING', 'READY', 'COLLECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "MerchItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MerchCategory" NOT NULL DEFAULT 'APPAREL',
    "blurb" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MerchStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isNewDrop" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "pickupNote" TEXT,
    "paymentNote" TEXT,
    "restockNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchVariant" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "soldOut" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MerchVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchCartLine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchCartLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MerchOrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchOrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    "itemName" TEXT NOT NULL,
    "variantLabel" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MerchOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchRestockRequest" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchRestockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchItem_slug_key" ON "MerchItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MerchVariant_itemId_label_key" ON "MerchVariant"("itemId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "MerchCartLine_userId_variantId_key" ON "MerchCartLine"("userId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchOrder_reference_key" ON "MerchOrder"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "MerchRestockRequest_itemId_userId_key" ON "MerchRestockRequest"("itemId", "userId");

-- AddForeignKey
ALTER TABLE "MerchVariant" ADD CONSTRAINT "MerchVariant_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MerchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchCartLine" ADD CONSTRAINT "MerchCartLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchCartLine" ADD CONSTRAINT "MerchCartLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MerchVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchOrder" ADD CONSTRAINT "MerchOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchOrderLine" ADD CONSTRAINT "MerchOrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MerchOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchOrderLine" ADD CONSTRAINT "MerchOrderLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "MerchVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchRestockRequest" ADD CONSTRAINT "MerchRestockRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MerchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchRestockRequest" ADD CONSTRAINT "MerchRestockRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

