import type { StorageAdapter } from 'grammy';
import { z } from 'zod';
import type { PrismaClient, Prisma } from '../generated/prisma/client.js';
import { CURRENCIES } from '../domain/money.js';

const draftSchema = z.object({
  description: z.string().min(1).max(300),
  amountMinor: z.string().regex(/^\d{1,11}$/),
  currency: z.enum(CURRENCIES),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceKey: z.string().max(100),
});
const nonce = z.string().regex(/^[a-f0-9]{12}$/);
const schema = z.object({
  flow: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('description') }),
    z.object({ kind: z.literal('amount'), description: z.string().max(300) }),
    z.object({ kind: z.literal('category'), draft: draftSchema, nonce }),
    z.object({ kind: z.literal('category-create'), draft: draftSchema.optional() }),
    z.object({ kind: z.literal('category-rename'), categoryId: z.string() }),
    z.object({ kind: z.literal('category-archive'), categoryId: z.string(), nonce }),
    z.object({ kind: z.literal('undo'), expenseId: z.string(), nonce }),
  ]).optional(),
});

export type SessionData = z.infer<typeof schema>;
export type Draft = z.infer<typeof draftSchema>;

export class PrismaSessionStorage implements StorageAdapter<SessionData> {
  constructor(private readonly db: PrismaClient) {}

  async read(userId: string): Promise<SessionData | undefined> {
    const record = await this.db.botSession.findUnique({ where: { userId } });
    if (!record || record.expiresAt.getTime() <= Date.now()) return undefined;
    const result = schema.safeParse(record.data);
    return result.success ? result.data : undefined;
  }

  async write(userId: string, value: SessionData): Promise<void> {
    if (!value.flow) return this.delete(userId);
    const data = schema.parse(value) as Prisma.InputJsonValue;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.db.botSession.upsert({ where: { userId }, create: { userId, data, expiresAt }, update: { data, expiresAt } });
  }

  async delete(userId: string): Promise<void> {
    await this.db.botSession.deleteMany({ where: { userId } });
  }
}
