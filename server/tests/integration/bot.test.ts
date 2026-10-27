import { randomInt, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { HttpError } from 'grammy';
import type { InlineKeyboardMarkup, Update } from 'grammy/types';
import { createDatabase } from '../../src/db/client.js';
import { ExpenseService } from '../../src/services/expenses.js';
import { PrismaSessionStorage } from '../../src/bot/session.js';
import { createBot } from '../../src/bot/create-bot.js';
import { monthRange } from '../../src/domain/dates.js';
import { currencyCode } from '../../src/domain/money.js';

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) {
  throw new Error('Вкажіть TEST_DATABASE_URL для окремої PostgreSQL-бази з назвою, що закінчується на _test. Спочатку застосуйте до неї db:deploy.');
}
const db = createDatabase(url);
const service = new ExpenseService(db, 'UAH');
const storage = new PrismaSessionStorage(db);
const telegramIds = [BigInt(randomInt(2_000_000_000, 2_100_000_000)), BigInt(randomInt(2_100_000_001, 2_200_000_000))];
let nextUpdateId = randomInt(1_000_000, 10_000_000);

function harness(telegramId: bigint) {
  const calls: { method: string; payload: Record<string, unknown> }[] = [];
  let failNextMessage = false;
  const bot = createBot({
    botToken: 'offline', databaseUrl: url!, defaultCurrency: 'UAH', timeZone: 'Europe/Kyiv', nodeEnv: 'test',
  }, service, storage, {
    now: () => new Date('2026-10-27T12:00:00Z'),
    botInfo: { id: 1, is_bot: true, first_name: 'Offline bot', username: 'offline_bot', can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false, has_topics_enabled: false, allows_users_to_create_topics: false, can_manage_bots: false, supports_join_request_queries: false },
  });
  // Every Bot API request is intercepted. These tests never connect to Telegram.
  bot.api.config.use(async (_previous, method, payload) => {
    if (method === 'sendMessage' && failNextMessage) {
      failNextMessage = false;
      throw new HttpError('offline failure', new Error('private-token-in-request'));
    }
    calls.push({ method, payload: payload as Record<string, unknown> });
    return { ok: true, result: true } as never;
  });
  const from = { id: Number(telegramId), is_bot: false as const, first_name: 'Offline user' };
  const message = (text: string, type: 'private' | 'group' = 'private'): Update => ({
    update_id: nextUpdateId++,
    message: {
      message_id: nextUpdateId, date: 1793102400, from,
      chat: type === 'private' ? { id: from.id, type: 'private', first_name: from.first_name } : { id: -1234, type: 'group', title: 'Offline group' },
      text,
      ...(text.startsWith('/') ? { entities: [{ type: 'bot_command' as const, offset: 0, length: text.split(' ')[0]!.length }] } : {}),
    },
  });
  return {
    bot, calls, message,
    failNextReply: () => { failNextMessage = true; },
    send: async (text: string, type: 'private' | 'group' = 'private') => bot.handleUpdate(message(text, type)),
    click: async (data: string) => bot.handleUpdate({
      update_id: nextUpdateId++, callback_query: {
        id: randomUUID(), from, chat_instance: 'offline', data,
        message: { message_id: 1, date: 1793102400, chat: { id: from.id, type: 'private', first_name: from.first_name } },
      },
    }),
    lastText: () => String(calls.findLast((call) => call.method === 'sendMessage')?.payload.text),
    button: (label: string) => {
      for (const call of [...calls].reverse()) {
        const keyboard = call.payload.reply_markup as InlineKeyboardMarkup | undefined;
        const button = keyboard?.inline_keyboard?.flat().find((button) => button.text === label);
        if (button && 'callback_data' in button) return button.callback_data;
      }
      throw new Error(`Missing button: ${label}`);
    },
  };
}

beforeAll(async () => { await db.$connect(); });
afterAll(async () => {
  // Remove only the random users this suite created, never reset a shared database.
  const users = await db.user.findMany({ where: { telegramId: { in: telegramIds } } });
  const userId = { in: users.map((user) => user.id) };
  await db.expense.deleteMany({ where: { userId } });
  await db.category.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe('Telegram handlers + PostgreSQL', () => {
  const alice = harness(telegramIds[0]!);
  const bob = harness(telegramIds[1]!);

  it('/start створює профіль із 7 категоріями один раз; групи не створюють профілі', async () => {
    await bob.send('/start', 'group');
    expect(bob.lastText()).toContain('приватний чат');
    expect(await db.user.findUnique({ where: { telegramId: telegramIds[1]! } })).toBeNull();
    await alice.send('/start');
    await alice.send('/start');
    expect(alice.lastText()).toContain('Вітаю');
    const profile = await service.ensureUser(telegramIds[0]!);
    expect(await service.categories(profile.id)).toHaveLength(7);
    await bob.send('/start');
  });

  it('зберігає точні суми, не дублює update, відхиляє неоднозначний ввід і чужі записи', async () => {
    const update = alice.message('кава 85,50');
    await alice.bot.handleUpdate(update);
    await alice.bot.handleUpdate(update);
    await alice.send('ігри 500');
    await alice.send('2 кави 100');
    expect(alice.lastText()).toContain('Не можу однозначно');
    const profile = await service.ensureUser(telegramIds[0]!);
    const other = await service.ensureUser(telegramIds[1]!);
    const rows = await service.list(profile.id);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.description === 'кава')?.amountMinor).toBe(8550n);
    expect(await service.list(other.id)).toHaveLength(0);
    expect(await service.deleteExpense(other.id, rows[0]!.id)).toBe(false);
    await expect(service.addExpense(other.id, {
      description: 'чужа категорія', amountMinor: 10n, currency: 'UAH', categoryId: rows[0]!.categoryId,
      expenseDate: '2026-10-27', sourceKey: `test:${randomUUID()}`,
    })).rejects.toThrow('Категорія недоступна');
    await expect(db.expense.create({ data: {
      userId: other.id, categoryId: rows[0]!.categoryId, amountMinor: 10n, currency: 'UAH',
      description: 'foreign key check', expenseDate: new Date('2026-10-27'), sourceKey: randomUUID(),
    } })).rejects.toThrow();
    await bob.send('/last');
    expect(bob.lastText()).toContain('Витрат ще немає');
  });

  it('/add продовжується після нового екземпляра бота; неправильна сума не змінює крок', async () => {
    await alice.send('/add');
    await alice.send('2 кави');
    const restarted = harness(telegramIds[0]!);
    await restarted.send('-50');
    expect(restarted.lastText()).toContain('додатну суму');
    await restarted.send('100,25');
    expect(restarted.lastText()).toContain('Збережено');
    const profile = await service.ensureUser(telegramIds[0]!);
    const [expense] = await service.list(profile.id, { take: 1 });
    expect(expense?.description).toBe('2 кави');
    expect(expense?.amountMinor).toBe(10025n);
    expect(expense?.expenseDate.toISOString()).toBe('2026-10-27T00:00:00.000Z');
  });

  it('невідома категорія вимагає вибору; підроблені та повторні кнопки не додають витрат', async () => {
    const profile = await service.ensureUser(telegramIds[0]!);
    const other = await service.ensureUser(telegramIds[1]!);
    const before = await db.expense.count({ where: { userId: profile.id } });
    await alice.send('подарунок 300');
    expect(await db.expense.count({ where: { userId: profile.id } })).toBe(before);
    const choice = alice.button('Інше');
    const foreign = (await service.categories(other.id))[0]!;
    await alice.click(choice.replace(/:[^:]+$/, `:${foreign.id}`));
    expect(alice.lastText()).toContain('Категорія недоступна');
    await alice.click(choice);
    await alice.click(choice);
    expect(alice.lastText()).toContain('неактуальний');
    expect(await db.expense.count({ where: { userId: profile.id } })).toBe(before + 1);
  });

  it('/undo просить підтвердження; старі кнопки не видаляють нові витрати', async () => {
    const profile = await service.ensureUser(telegramIds[0]!);
    await alice.send('/undo');
    const stale = alice.button('Так, видалити');
    const before = await db.expense.count({ where: { userId: profile.id } });
    await alice.click(alice.button('Скасувати'));
    await alice.send('кава 10');
    await alice.click(stale);
    expect(await db.expense.count({ where: { userId: profile.id } })).toBe(before + 1);
    await alice.send('/undo');
    const confirm = alice.button('Так, видалити');
    const [selected] = await service.list(profile.id, { take: 1 });
    await service.addExpense(profile.id, {
      description: 'новіша витрата', categoryId: selected!.categoryId, amountMinor: 50n,
      expenseDate: '2026-10-27', currency: 'UAH', sourceKey: `test:${randomUUID()}`,
    });
    await alice.click(confirm);
    expect(await db.expense.findUnique({ where: { id: selected!.id } })).toBeNull();
    expect((await service.list(profile.id))[0]!.description).toBe('новіша витрата');
    await alice.click(confirm);
    expect(await db.expense.count({ where: { userId: profile.id } })).toBe(before + 1);
  });

  it('створює, перейменовує, архівує та відновлює власні категорії, зберігаючи історію', async () => {
    await alice.send('малювання 70');
    await alice.click(alice.button('＋ Власна категорія'));
    await alice.send('Хобі');
    const profile = await service.ensureUser(telegramIds[0]!);
    let category = (await service.categories(profile.id)).find((item) => item.name === 'Хобі')!;
    expect((await service.list(profile.id))[0]!.categoryId).toBe(category.id);
    await alice.send('/categories');
    await alice.click(alice.button('Хобі'));
    await alice.click(alice.button('Перейменувати'));
    await alice.send('Творчість');
    category = await service.getCategory(profile.id, category.id);
    expect(category.name).toBe('Творчість');
    await alice.send('/categories');
    await alice.click(alice.button('Творчість'));
    await alice.click(alice.button('Архівувати'));
    await alice.click(alice.button('Архівувати'));
    expect((await service.categories(profile.id)).some((item) => item.id === category.id)).toBe(false);
    expect((await service.list(profile.id))[0]!.category.name).toBe('Творчість');
    await service.addCategory(profile.id, 'Творчість');
    expect((await service.categories(profile.id)).some((item) => item.id === category.id)).toBe(true);
  });

  it('/today і /month підсумовують окремі валюти, /export надсилає файл або пояснює відсутність даних', async () => {
    await alice.send('/currency USD');
    await alice.send('ігри 0.10');
    await alice.send('ігри 0.20');
    await alice.send('/today');
    expect(alice.lastText()).toContain('0,30 USD');
    expect(alice.lastText()).toContain('UAH');
    await alice.send('/month');
    expect(alice.lastText()).toContain('0,30 USD');
    await alice.send('/export 2026-13');
    expect(alice.lastText()).toContain('YYYY-MM');
    await alice.send('/export 2026-09');
    expect(alice.lastText()).toContain('експортувати нічого');
    await alice.send('/export 2026-10');
    const document = alice.calls.findLast((call) => call.method === 'sendDocument');
    expect(document).toBeDefined();
    expect(document!.payload.caption).toContain('2026-10');
  });

  it('відсікає сусідні місяці та зберігає дані після перепідключення до PostgreSQL', async () => {
    const profile = await service.ensureUser(telegramIds[0]!);
    const [category] = await service.categories(profile.id);
    for (const expenseDate of ['2026-09-30', '2026-11-01']) {
      await service.addExpense(profile.id, { categoryId: category!.id, expenseDate, amountMinor: 99999n, currency: 'USD', description: 'межа місяця', sourceKey: `test:${randomUUID()}` });
    }
    const { from, to } = monthRange('2026-10');
    const groups = await service.summary(profile.id, from, to);
    expect(groups.filter((group) => group.currency === 'USD').reduce((sum, group) => sum + group.amountMinor, 0n)).toBe(30n);
    const anotherDb = createDatabase(url!);
    try {
      const afterRestart = new ExpenseService(anotherDb, 'UAH');
      expect((await afterRestart.monthExpenses(profile.id, '2026-10')).length).toBeGreaterThan(0);
      expect(currencyCode((await afterRestart.ensureUser(telegramIds[0]!)).defaultCurrency)).toBe('USD');
    } finally { await anotherDb.$disconnect(); }
  });

  it('обробляє помилку бази та наступну дію без падіння і витоку секретів', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const original = service.list.bind(service);
    const failure = vi.spyOn(service, 'list').mockRejectedValueOnce(new Error('postgres://private-secret@host/db')).mockImplementation(original);
    try {
      await alice.send('/last');
      expect(alice.lastText()).toContain('тимчасово недоступна');
      expect(JSON.stringify(log.mock.calls)).not.toContain('private-secret');
      await alice.send('/last');
      expect(alice.lastText()).toContain('Останні');
      await alice.send('/unknown');
      expect(alice.lastText()).toContain('Невідома команда');
    } finally { failure.mockRestore(); log.mockRestore(); }
  });

  it('пагінація /today показує повний підсумок, а /last обмежено 10 записами', async () => {
    const profile = await service.ensureUser(telegramIds[1]!);
    const [category] = await service.categories(profile.id);
    for (let index = 0; index < 12; index++) {
      await service.addExpense(profile.id, {
        categoryId: category!.id, expenseDate: '2026-10-27', amountMinor: 1n, currency: 'UAH',
        description: `запис ${index}`, sourceKey: `test:${randomUUID()}`,
      });
    }
    await bob.send('/today');
    expect(bob.lastText()).toContain('0,12 UAH');
    expect(bob.lastText().match(/— 0,01 UAH/g)).toHaveLength(10);
    await bob.click(bob.button('Далі →'));
    expect(bob.lastText()).toContain('сторінка 2');
    expect(bob.lastText().match(/— 0,01 UAH/g)).toHaveLength(2);
    expect(bob.lastText()).toContain('0,12 UAH');
    await bob.send('/last');
    expect(bob.lastText().match(/— 0,01 UAH/g)).toHaveLength(10);
  });

  it('помилка Telegram після запису не зупиняє бота, replay update не дублює витрату', async () => {
    const profile = await service.ensureUser(telegramIds[1]!);
    const before = await db.expense.count({ where: { userId: profile.id } });
    const update = bob.message('кава 20');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      bob.failNextReply();
      await bob.bot.handleUpdate(update);
      expect(bob.lastText()).toContain('через Telegram');
      expect(bob.lastText()).toContain('/last');
      await bob.bot.handleUpdate(update);
      expect(bob.lastText()).toContain('Збережено');
      expect(await db.expense.count({ where: { userId: profile.id } })).toBe(before + 1);
      expect(JSON.stringify(log.mock.calls)).not.toContain('private-token-in-request');
    } finally { log.mockRestore(); }
  });

  it('одночасні запити з одним ключем не дублюють витрату; БД забороняє від’ємну суму', async () => {
    const profile = await service.ensureUser(telegramIds[1]!);
    const [category] = await service.categories(profile.id);
    const input = {
      categoryId: category!.id, expenseDate: '2026-10-27', amountMinor: 1n, currency: 'UAH',
      description: 'повторна доставка', sourceKey: `test:${randomUUID()}`,
    };
    const [one, two] = await Promise.all([service.addExpense(profile.id, input), service.addExpense(profile.id, input)]);
    expect(one.id).toBe(two.id);
    await expect(db.expense.create({ data: {
      ...input, userId: profile.id, expenseDate: new Date('2026-10-27'), amountMinor: -1n, sourceKey: randomUUID(),
    } })).rejects.toThrow();
  });

  it('повторна доставка початкового повідомлення після /undo не відновлює видалену витрату', async () => {
    const update = bob.message('кава 43.21');
    await bob.bot.handleUpdate(update);
    const profile = await service.ensureUser(telegramIds[1]!);
    const [expense] = await service.list(profile.id, { take: 1 });
    await bob.send('/undo');
    await bob.click(bob.button('Так, видалити'));
    await bob.bot.handleUpdate(update);
    expect(bob.lastText()).toContain('витрату видалено');
    expect(await db.expense.findUnique({ where: { id: expense!.id } })).toBeNull();
    expect(await db.expense.findUnique({ where: { userId_sourceKey: { userId: profile.id, sourceKey: `telegram:${update.update_id}` } } })).toBeNull();
    await bob.send('кава 43.21');
    expect(bob.lastText()).toContain('Збережено');
  });
  it('/checkcategory показує кнопки й точні підсумки місяця та всього часу, окремо за валютами', async () => {
    const profile = await service.ensureUser(telegramIds[0]!);
    const other = await service.ensureUser(telegramIds[1]!);
    const category = await service.addCategory(profile.id, 'Звітна категорія');
    const foreign = await service.addCategory(other.id, 'Звітна категорія');
    for (const [date, amount] of [['2026-10-01', 10n], ['2026-10-31', 20n], ['2026-09-30', 700n], ['2026-11-01', 900n]] as const) {
      await service.addExpense(profile.id, {
        categoryId: category.id, expenseDate: date, amountMinor: amount, currency: 'UAH',
        description: 'Звітна витрата', sourceKey: 'test:' + randomUUID(),
      });
    }
    await service.addExpense(profile.id, {
      categoryId: category.id, expenseDate: '2026-10-27', amountMinor: 200n, currency: 'USD',
      description: 'Валютна витрата', sourceKey: 'test:' + randomUUID(),
    });
    const removed = await service.addExpense(profile.id, {
      categoryId: category.id, expenseDate: '2026-10-27', amountMinor: 50000n, currency: 'UAH',
      description: 'Видалена витрата', sourceKey: 'test:' + randomUUID(),
    });
    await service.deleteExpense(profile.id, removed.id);
    await service.addExpense(other.id, {
      categoryId: foreign.id, expenseDate: '2026-10-27', amountMinor: 9999n, currency: 'UAH',
      description: 'Чужа витрата', sourceKey: 'test:' + randomUUID(),
    });

    await alice.send('/checkcategory');
    expect(alice.lastText()).toContain('Оберіть категорію');
    const callback = alice.button('Звітна категорія');
    expect(Buffer.byteLength(callback)).toBeLessThanOrEqual(64);
    await alice.click(callback);
    const response = alice.lastText();
    expect(response).toContain('Категорія «Звітна категорія»');
    expect(response).toContain('За поточний місяць (2026-10):\n0,30 UAH · записів: 2\n2,00 USD · записів: 1');
    expect(response).toContain('За весь час:\n16,30 UAH · записів: 4\n2,00 USD · записів: 1');
    expect(response).not.toContain('99,99');
    await alice.click(alice.button('← Обрати іншу категорію'));
    expect(alice.lastText()).toContain('Оберіть категорію');

    await alice.click('catcheck:' + foreign.id + ':0');
    expect(alice.lastText()).toContain('Категорія недоступна');
    const { from, to } = monthRange('2026-10');
    await expect(service.categorySummary(profile.id, foreign.id, from, to)).rejects.toThrow('Категорія недоступна');
  });

  it('/checkcategory пояснює порожню категорію й дозволяє переглядати архівовану', async () => {
    const profile = await service.ensureUser(telegramIds[0]!);
    await service.addCategory(profile.id, 'Порожня');
    await alice.send('/checkcategory');
    await alice.click(alice.button('Порожня'));
    expect(alice.lastText()).toContain('За поточний місяць (2026-10):\nВитрат немає.');
    expect(alice.lastText()).toContain('За весь час:\nВитрат немає.');
    const category = (await service.categories(profile.id)).find((item) => item.name === 'Звітна категорія')!;
    await service.archiveCategory(profile.id, category.id);
    await alice.send('/checkcategory');
    await alice.click(alice.button('Звітна категорія (архів)'));
    expect(alice.lastText()).toContain('Категорія «Звітна категорія» (архів)');
    expect(alice.lastText()).toContain('16,30 UAH');
    await alice.send('/help');
    expect(alice.lastText()).toContain('/checkcategory');
  });

  it('/checkcategory розбиває великий список категорій на сторінки', async () => {
    const profile = await service.ensureUser(telegramIds[0]!);
    for (let index = 0; index < 12; index++) await service.addCategory(profile.id, 'Додаткова ' + index);
    const visibleCategories = () => {
      const reply = alice.calls.findLast((call) => call.method === 'sendMessage')!;
      const keyboard = reply.payload.reply_markup as InlineKeyboardMarkup;
      return keyboard.inline_keyboard.flat().flatMap((button) =>
        'callback_data' in button && button.callback_data.startsWith('catcheck:') ? [button.callback_data.split(':')[1]] : []);
    };
    await alice.send('/checkcategory');
    const first = visibleCategories();
    expect(first).toHaveLength(10);
    await alice.click(alice.button('Категорії далі →'));
    const second = visibleCategories();
    expect(second).toHaveLength(10);
    expect(second.some((id) => first.includes(id))).toBe(false);
    expect(alice.lastText()).toContain('Сторінка 2');
    await alice.click(alice.button('← Попередні категорії'));
    expect(visibleCategories()).toEqual(first);
  });

});
