-- CreateTable
CREATE TABLE "ProductItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "cost" REAL,
    "profitMargin" REAL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'C',
    "decision" TEXT NOT NULL DEFAULT 'WATCH',
    "reason" TEXT,
    "recommendedPrice" REAL,
    "expectedProfit" REAL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "shopifyId" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "supplierPrice" REAL,
    "shippingCost" REAL,
    "salesVolume" INTEGER,
    "rating" REAL,
    "reviewCount" INTEGER,
    "source" TEXT,
    "sourceUrl" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "message" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Log_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "productId" INTEGER,
    "supplierPrice" REAL NOT NULL,
    "moq" INTEGER,
    "leadTime" INTEGER,
    "quality" TEXT,
    "reliability" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SelectionTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "listed" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
