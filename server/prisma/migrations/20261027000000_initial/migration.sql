CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "telegramId" BIGINT NOT NULL,
  "defaultCurrency" VARCHAR(3) NOT NULL DEFAULT 'UAH',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_telegramId_positive" CHECK ("telegramId" > 0),
  CONSTRAINT "User_currency_supported" CHECK ("defaultCurrency" IN ('UAH','USD','EUR','PLN','GBP','CZK','CAD','CHF'))
);
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" VARCHAR(40) NOT NULL,
  "nameKey" VARCHAR(80) NOT NULL,
  "defaultKey" VARCHAR(20),
  "archivedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Expense" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "description" VARCHAR(300) NOT NULL,
  "expenseDate" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceKey" VARCHAR(100) NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Expense_amount_range" CHECK ("amountMinor" > 0 AND "amountMinor" <= 99999999999),
  CONSTRAINT "Expense_currency_supported" CHECK ("currency" IN ('UAH','USD','EUR','PLN','GBP','CZK','CAD','CHF'))
);
CREATE TABLE "BotSession" (
  "userId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "BotSession_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE "DeletedExpense" (
  "userId" TEXT NOT NULL,
  "sourceKey" VARCHAR(100) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeletedExpense_pkey" PRIMARY KEY ("userId", "sourceKey")
);
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "Category_userId_nameKey_key" ON "Category"("userId", "nameKey");
CREATE UNIQUE INDEX "Category_userId_defaultKey_key" ON "Category"("userId", "defaultKey");
CREATE UNIQUE INDEX "Category_id_userId_key" ON "Category"("id", "userId");
CREATE INDEX "Category_userId_archivedAt_idx" ON "Category"("userId", "archivedAt");
CREATE UNIQUE INDEX "Expense_userId_sourceKey_key" ON "Expense"("userId", "sourceKey");
CREATE INDEX "Expense_userId_expenseDate_createdAt_idx" ON "Expense"("userId", "expenseDate", "createdAt");
CREATE INDEX "Expense_userId_createdAt_id_idx" ON "Expense"("userId", "createdAt", "id");
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_userId_fkey" FOREIGN KEY ("categoryId", "userId") REFERENCES "Category"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BotSession" ADD CONSTRAINT "BotSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeletedExpense" ADD CONSTRAINT "DeletedExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
