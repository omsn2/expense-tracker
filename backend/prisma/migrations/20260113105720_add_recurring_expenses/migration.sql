-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'uncategorized',
    "frequency" TEXT NOT NULL,
    "dayOfMonth" INTEGER,
    "dayOfWeek" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "lastGenerated" DATETIME,
    "nextOccurrence" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
