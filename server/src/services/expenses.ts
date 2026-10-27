import type { PrismaClient, Prisma } from '../generated/prisma/client.js';
import { categoryName, DEFAULT_CATEGORIES } from '../domain/categories.js';
import { dateValue, monthRange } from '../domain/dates.js';
import { isUniqueViolation, UserInputError } from '../domain/errors.js';
import { currencyCode, type Currency, validateAmount } from '../domain/money.js';
import { descriptionText } from '../domain/parser.js';

export type ExpenseWithCategory = Prisma.ExpenseGetPayload<{ include: { category: true } }>;
export interface NewExpense {
  description: string;
  amountMinor: bigint;
  currency: string;
  expenseDate: string;
  categoryId: string;
  sourceKey: string;
}

// This layer takes an authenticated internal user ID, never Telegram context or a username.
// A future HTTP adapter must resolve its own verified identity to that user ID.
export class ExpenseService {
  constructor(private readonly db: PrismaClient, private readonly defaultCurrency: Currency) {}

  async ensureUser(telegramId: bigint) {
    if (telegramId <= 0n) throw new UserInputError('Неправильний Telegram ID.');
    try {
      return await this.db.user.upsert({
        where: { telegramId }, update: {},
        create: {
          telegramId, defaultCurrency: this.defaultCurrency,
          categories: { create: DEFAULT_CATEGORIES.map(({ key, name }) => ({ ...categoryName(name), defaultKey: key })) },
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return this.db.user.findUniqueOrThrow({ where: { telegramId } });
    }
  }

  categories(userId: string, includeArchived = false) {
    return this.db.category.findMany({
      where: { userId, ...(includeArchived ? {} : { archivedAt: null }) },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async getCategory(userId: string, id: string) {
    const category = await this.db.category.findFirst({ where: { id, userId, archivedAt: null } });
    if (!category) throw new UserInputError('Категорія недоступна. Відкрийте /categories.');
    return category;
  }

  async addCategory(userId: string, text: string) {
    const data = categoryName(text);
    try {
      return await this.db.$transaction(async (tx) => {
        // Serialize category edits for one owner, including future HTTP requests.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
        if (await tx.category.count({ where: { userId, archivedAt: null } }) >= 30) {
          throw new UserInputError('Можна мати до 30 активних категорій. Спочатку архівуйте зайву.');
        }
        return tx.category.upsert({
          where: { userId_nameKey: { userId, nameKey: data.nameKey } },
          create: { userId, ...data },
          update: { archivedAt: null },
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserInputError('Така категорія вже існує.');
      throw error;
    }
  }

  async renameCategory(userId: string, id: string, text: string) {
    try {
      const result = await this.db.category.updateMany({
        where: { id, userId, archivedAt: null }, data: categoryName(text),
      });
      if (!result.count) throw new UserInputError('Категорія недоступна. Відкрийте /categories.');
    } catch (error) {
      if (isUniqueViolation(error)) throw new UserInputError('Категорія з такою назвою вже існує, можливо в архіві.');
      throw error;
    }
  }

  async archiveCategory(userId: string, id: string) {
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      if (await tx.category.count({ where: { userId, archivedAt: null } }) <= 1) {
        throw new UserInputError('Залиште хоча б одну активну категорію.');
      }
      const result = await tx.category.updateMany({ where: { id, userId, archivedAt: null }, data: { archivedAt: new Date() } });
      if (!result.count) throw new UserInputError('Категорія недоступна. Відкрийте /categories.');
    });
  }

  setCurrency(userId: string, currency: string) {
    return this.db.user.update({ where: { id: userId }, data: { defaultCurrency: currencyCode(currency) } });
  }

  async addExpense(userId: string, input: NewExpense): Promise<ExpenseWithCategory> {
    const data = {
      userId, categoryId: input.categoryId,
      description: descriptionText(input.description), amountMinor: validateAmount(input.amountMinor),
      currency: currencyCode(input.currency), expenseDate: dateValue(input.expenseDate), sourceKey: input.sourceKey,
    };
    if (!/^[\w:-]{1,100}$/.test(data.sourceKey)) throw new UserInputError('Неправильний ідентифікатор операції.');
    return this.db.$transaction(async (tx) => {
      // Also serialize against deletion: replaying an old update must never resurrect a removed expense.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:${data.sourceKey}`}))`;
      const where = { userId_sourceKey: { userId, sourceKey: data.sourceKey } };
      if (await tx.deletedExpense.findUnique({ where })) {
        throw new UserInputError('Цю операцію вже оброблено, а витрату видалено. Для нової витрати надішліть нове повідомлення.');
      }
      const existing = await tx.expense.findUnique({ where, include: { category: true } });
      if (existing) return existing;
      const category = await tx.category.findFirst({ where: { id: input.categoryId, userId, archivedAt: null } });
      if (!category) throw new UserInputError('Категорія недоступна. Відкрийте /categories.');
      return tx.expense.create({ data, include: { category: true } });
    });
  }

  list(userId: string, options: { from?: Date; to?: Date; take?: number; skip?: number } = {}) {
    const { take = 10, skip = 0, from, to } = options;
    if (!Number.isInteger(take) || take < 1 || take > 100 || !Number.isSafeInteger(skip) || skip < 0) {
      throw new UserInputError('Неправильна сторінка.');
    }
    return this.db.expense.findMany({
      where: { userId, expenseDate: { gte: from, lt: to } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take, skip, include: { category: true },
    });
  }

  async summary(userId: string, from: Date, to: Date) {
    const groups = await this.db.expense.groupBy({
      by: ['currency', 'categoryId'], where: { userId, expenseDate: { gte: from, lt: to } },
      _sum: { amountMinor: true }, _count: { _all: true }, orderBy: [{ currency: 'asc' }, { categoryId: 'asc' }],
    });
    const categories = await this.categories(userId, true);
    return groups.map((group) => ({
      currency: group.currency,
      category: categories.find((category) => category.id === group.categoryId)!.name,
      amountMinor: group._sum.amountMinor ?? 0n, count: group._count._all,
    }));
  }

  async categorySummary(userId: string, categoryId: string, from: Date, to: Date) {
    // Archived categories remain readable, but ownership is still mandatory.
    const category = await this.db.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) throw new UserInputError('Категорія недоступна. Відкрийте /checkcategory.');
    const { month, allTime } = await this.db.$transaction(async (tx) => {
      const month = await tx.expense.groupBy({
        by: ['currency'], where: { userId, categoryId, expenseDate: { gte: from, lt: to } },
        _sum: { amountMinor: true }, _count: { _all: true }, orderBy: { currency: 'asc' },
      });
      const allTime = await tx.expense.groupBy({
        by: ['currency'], where: { userId, categoryId },
        _sum: { amountMinor: true }, _count: { _all: true }, orderBy: { currency: 'asc' },
      });
      return { month, allTime };
    }, { isolationLevel: 'RepeatableRead' });
    const totals = (groups: typeof month) => groups.map((group) => ({
      currency: group.currency, amountMinor: group._sum.amountMinor ?? 0n, count: group._count._all,
    }));
    return { category, month: totals(month), allTime: totals(allTime) };
  }

  async deleteExpense(userId: string, id: string): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({ where: { id, userId } });
      if (!expense) return false;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:${expense.sourceKey}`}))`;
      const result = await tx.expense.deleteMany({ where: { id, userId } });
      if (!result.count) return false;
      await tx.deletedExpense.create({ data: { userId, sourceKey: expense.sourceKey } });
      return true;
    });
  }

  async monthExpenses(userId: string, month: string) {
    const { from, to } = monthRange(month);
    const rows = await this.db.expense.findMany({
      where: { userId, expenseDate: { gte: from, lt: to } },
      orderBy: [{ expenseDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      include: { category: true }, take: 50_001,
    });
    if (rows.length > 50_000) throw new UserInputError('У місяці понад 50 000 записів. Такий експорт перевищує ліміт першої версії.');
    return rows;
  }
}
