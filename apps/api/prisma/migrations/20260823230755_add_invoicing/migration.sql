-- CreateEnum
CREATE TYPE "InvoiceDocType" AS ENUM ('BOLETA', 'FACTURA');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'ISSUED', 'ERROR');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "docType" "InvoiceDocType" NOT NULL DEFAULT 'BOLETA',
    "series" TEXT NOT NULL,
    "correlative" INTEGER NOT NULL,
    "buyerDocType" TEXT NOT NULL DEFAULT 'DNI',
    "buyerDocNumber" TEXT NOT NULL DEFAULT '00000000',
    "buyerName" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "pdfUrl" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "docType" "InvoiceDocType" NOT NULL,
    "series" TEXT NOT NULL,
    "correlative" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("docType")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_docType_series_correlative_key" ON "Invoice"("docType", "series", "correlative");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
