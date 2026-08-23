-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
