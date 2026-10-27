import { randomBytes } from 'node:crypto';
import { Bot, Context, InlineKeyboard, InputFile, Keyboard, session, type SessionFlavor, type MiddlewareFn } from 'grammy';
import type { BotCommand, UserFromGetMe } from 'grammy/types';
import type { User } from '../generated/prisma/client.js';
import type { Config } from '../config.js';
import { suggestCategory } from '../domain/categories.js';
import { dateValue, displayDate, monthRange, todayInZone } from '../domain/dates.js';
import { UserInputError } from '../domain/errors.js';
import { CURRENCIES, currencyCode, formatMoney, parseAmount } from '../domain/money.js';
import { descriptionText, parseExpense } from '../domain/parser.js';
import { ExpenseService, type ExpenseWithCategory } from '../services/expenses.js';
import { exportWorkbook } from '../services/export.js';
import { logFailure, publicError } from './errors.js';
import { PrismaSessionStorage, type Draft, type SessionData } from './session.js';

export type BotContext = Context & SessionFlavor<SessionData> & { profile: User };

export const COMMANDS: BotCommand[] = [
  { command: 'start', description: 'Почати та показати меню' },
  { command: 'help', description: 'Як користуватися ботом' },
  { command: 'add', description: 'Додати витрату покроково' },
  { command: 'today', description: 'Витрати за сьогодні' },
  { command: 'month', description: 'Підсумок поточного місяця' },
  { command: 'last', description: 'Останні 10 витрат' },
  { command: 'undo', description: 'Видалити останню витрату' },
  { command: 'categories', description: 'Переглянути та змінити категорії' },
  { command: 'checkcategory', description: 'Скільки витрачено в категорії' },
  { command: 'currency', description: 'Валюта для нових витрат' },
  { command: 'export', description: 'Excel за місяць: /export YYYY-MM' },
  { command: 'cancel', description: 'Скасувати поточну дію' },
];

const HELP = 'Додайте витрату повідомленням:\nігри 500\nкава 85,50\n500 ігри\n\n' +
  'Сума — додатне число з максимум двома знаками після коми або крапки, без розділювачів тисяч. ' +
  'Якщо опис містить числа (наприклад, «2 кави»), використайте /add. ' +
  'Для неоднозначної категорії запропоную кнопки.\n\n' +
  COMMANDS.map(({ command, description }) => `/${command} — ${description}`).join('\n') +
  '\n\nДата — сьогодні у часовому поясі бота. Валюти підсумовуються окремо. ' +
  'Будь-яка команда скасовує попередній незавершений крок. Незавершені діалоги діють 24 години.';

const menu = new Keyboard().text('/add').text('/today').text('/month').row()
  .text('/last').text('/undo').text('/export').row()
  .text('/categories').text('/checkcategory').row()
  .text('/currency').text('/help').resized();

const newNonce = () => randomBytes(6).toString('hex');

function expenseLine(expense: ExpenseWithCategory): string {
  return `${displayDate(expense.expenseDate)} · ${expense.description} — ${formatMoney(expense.amountMinor, expense.currency)} (${expense.category.name})`;
}

async function replyLong(ctx: BotContext, text: string, keyboard?: InlineKeyboard): Promise<void> {
  const chunks: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (current.length + line.length + 1 > 3500) { chunks.push(current); current = ''; }
    current += `${current ? '\n' : ''}${line}`;
  }
  if (current) chunks.push(current);
  for (let i = 0; i < chunks.length; i++) {
    await ctx.reply(chunks[i]!, i === chunks.length - 1 && keyboard ? { reply_markup: keyboard } : {});
  }
}

function totalsText(groups: { currency: string; amountMinor: bigint }[]): string {
  const totals = new Map<string, bigint>();
  for (const group of groups) totals.set(group.currency, (totals.get(group.currency) ?? 0n) + group.amountMinor);
  return [...totals].map(([currency, amount]) => formatMoney(amount, currency)).join('\n');
}

export function createBot(
  config: Config,
  service: ExpenseService,
  storage: PrismaSessionStorage,
  options: { botInfo?: UserFromGetMe; now?: () => Date } = {},
): Bot<BotContext> {
  const bot = new Bot<BotContext>(config.botToken, { botInfo: options.botInfo });
  const today = () => todayInZone(config.timeZone, options.now?.());
  const month = () => today().slice(0, 7);

  // This also covers profile/session storage failures. A failed update must not stop polling.
  const errorBoundary: MiddlewareFn<BotContext> = async (ctx, next) => {
    try { await next(); }
    catch (error) {
      if (!(error instanceof UserInputError)) logFailure('update_failed', error);
      try { await ctx.reply(publicError(error)); }
      catch (replyError) { logFailure('error_reply_failed', replyError); }
    }
  };
  bot.use(errorBoundary);
  bot.use(async (ctx, next) => {
    if (!ctx.from || ctx.from.is_bot) return;
    if (ctx.callbackQuery) {
      try { await ctx.answerCallbackQuery(); }
      catch (error) { logFailure('callback_ack_failed', error); }
    }
    if (ctx.chat?.type !== 'private') {
      if (ctx.chat && (ctx.message || ctx.callbackQuery)) {
        await ctx.reply('Для особистих витрат відкрийте приватний чат зі мною та надішліть /start. У групах я не зберігаю витрати.');
      }
      return;
    }
    ctx.profile = await service.ensureUser(BigInt(ctx.from.id));
    await next();
  });
  bot.use(session({ initial: (): SessionData => ({}), storage, getSessionKey: (ctx) => ctx.profile.id }));
  // Handle action errors inside session middleware so command cancellations and completed writes persist.
  bot.use(errorBoundary);
  bot.use(async (ctx, next) => {
    if (ctx.msg?.text?.startsWith('/')) ctx.session = {};
    await next();
  });

  const save = async (ctx: BotContext, draft: Draft, categoryId: string) => {
    const expense = await service.addExpense(ctx.profile.id, { ...draft, amountMinor: BigInt(draft.amountMinor), categoryId });
    ctx.session = {};
    await ctx.reply(`Збережено: ${expenseLine(expense)}\nВидалити останню витрату: /undo.`);
  };

  const chooseCategory = async (ctx: BotContext, parsed: { description: string; amountMinor: bigint }) => {
    const draft: Draft = {
      ...parsed, amountMinor: parsed.amountMinor.toString(), currency: currencyCode(ctx.profile.defaultCurrency),
      expenseDate: today(), sourceKey: `telegram:${ctx.update.update_id}`,
    };
    const categories = await service.categories(ctx.profile.id);
    const suggested = suggestCategory(draft.description, categories);
    if (suggested) return save(ctx, draft, suggested.id);
    const nonce = newNonce();
    ctx.session.flow = { kind: 'category', draft, nonce };
    const keyboard = new InlineKeyboard();
    categories.forEach((category, index) => {
      keyboard.text(category.name, `pick:${nonce}:${category.id}`);
      if (index % 2 === 1) keyboard.row();
    });
    keyboard.row().text('＋ Власна категорія', `new:${nonce}`).row().text('Скасувати', `cancel:${nonce}`);
    await ctx.reply(`Оберіть категорію: ${draft.description} — ${formatMoney(parsed.amountMinor, draft.currency)}.`, { reply_markup: keyboard });
  };

  const showCategories = async (ctx: BotContext) => {
    const categories = await service.categories(ctx.profile.id);
    const keyboard = new InlineKeyboard();
    categories.forEach((category, index) => {
      keyboard.text(category.name, `manage:${category.id}`);
      if (index % 2 === 1) keyboard.row();
    });
    keyboard.row().text('＋ Додати категорію', 'category-new');
    await ctx.reply('Ваші категорії. Оберіть для перейменування чи архівування. Архівування зберігає історію витрат. Повторне додавання тієї самої назви відновлює категорію.', { reply_markup: keyboard });
  };

  const showCategoryChoices = async (ctx: BotContext, requestedPage = 0) => {
    const categories = (await service.categories(ctx.profile.id, true)).sort((a, b) =>
      Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)) || a.name.localeCompare(b.name, 'uk'));
    if (!categories.length) {
      await ctx.reply('Категорій ще немає. Створіть категорію через /categories.');
      return;
    }
    const pageSize = 10;
    const pages = Math.ceil(categories.length / pageSize);
    const page = Math.min(requestedPage, pages - 1);
    const keyboard = new InlineKeyboard();
    categories.slice(page * pageSize, (page + 1) * pageSize).forEach((category, index) => {
      keyboard.text(category.name + (category.archivedAt ? ' (архів)' : ''), 'catcheck:' + category.id + ':' + page);
      if (index % 2 === 1) keyboard.row();
    });
    keyboard.row();
    if (page > 0) keyboard.text('← Попередні категорії', 'catpage:' + (page - 1));
    if (page + 1 < pages) keyboard.text('Категорії далі →', 'catpage:' + (page + 1));
    await ctx.reply('Оберіть категорію — покажу витрати за поточний місяць і за весь час.' +
      (pages > 1 ? '\nСторінка ' + (page + 1) + ' з ' + pages + '.' : ''), { reply_markup: keyboard });
  };

  const showCategorySummary = async (ctx: BotContext, categoryId: string, page: number) => {
    const period = month();
    const { from, to } = monthRange(period);
    const report = await service.categorySummary(ctx.profile.id, categoryId, from, to);
    const lines = (groups: typeof report.month) => groups.length
      ? groups.map((group) => formatMoney(group.amountMinor, group.currency) + ' · записів: ' + group.count).join('\n')
      : 'Витрат немає.';
    await ctx.reply('Категорія «' + report.category.name + '»' + (report.category.archivedAt ? ' (архів)' : '') +
      '\n\nЗа поточний місяць (' + period + '):\n' + lines(report.month) +
      '\n\nЗа весь час:\n' + lines(report.allTime), {
      reply_markup: new InlineKeyboard().text('← Обрати іншу категорію', 'catpage:' + page),
    });
  };

  const showDay = async (ctx: BotContext, day: string, page = 0) => {
    const from = dateValue(day);
    const to = new Date(from); to.setUTCDate(to.getUTCDate() + 1);
    const [rows, groups] = await Promise.all([
      service.list(ctx.profile.id, { from, to, take: 10, skip: page * 10 }),
      service.summary(ctx.profile.id, from, to),
    ]);
    const count = groups.reduce((total, group) => total + group.count, 0);
    if (!count) { await ctx.reply(`За ${displayDate(day)} витрат ще немає.`); return; }
    const keyboard = new InlineKeyboard();
    if (page > 0) keyboard.text('← Назад', `day:${day}:${page - 1}`);
    if ((page + 1) * 10 < count) keyboard.text('Далі →', `day:${day}:${page + 1}`);
    await replyLong(ctx, `Витрати за ${displayDate(day)} · сторінка ${page + 1}\n\n${rows.map(expenseLine).join('\n')}\n\nРазом за день (${count}):\n${totalsText(groups)}`, keyboard);
  };

  bot.command('start', async (ctx) => {
    await ctx.reply(`Вітаю! Я допоможу вести особисті витрати.\n\nНапишіть «ігри 500», «кава 85,50» або «500 ігри». Для додавання покроково — /add.\n\nВалюта: ${ctx.profile.defaultCurrency}. Часовий пояс: ${config.timeZone}.\nУсі команди — у меню нижче та /help.`, { reply_markup: menu });
  });
  bot.command('help', (ctx) => ctx.reply(HELP));
  bot.command('cancel', (ctx) => ctx.reply('Поточну дію скасовано. Можете додати нову витрату.'));
  bot.command('add', async (ctx) => {
    if (ctx.match.trim()) return chooseCategory(ctx, parseExpense(ctx.match));
    ctx.session.flow = { kind: 'description' };
    await ctx.reply('На що витратили гроші? Напишіть опис (до 300 символів). Скасувати: /cancel.');
  });
  bot.command('today', (ctx) => showDay(ctx, today()));
  bot.command('month', async (ctx) => {
    const { from, to } = monthRange(month());
    const groups = await service.summary(ctx.profile.id, from, to);
    if (!groups.length) { await ctx.reply('За поточний місяць витрат ще немає.'); return; }
    await replyLong(ctx, `Підсумок за ${month()}\n\n${groups.map((group) => `${group.category}: ${formatMoney(group.amountMinor, group.currency)} (${group.count})`).join('\n')}\n\nРазом:\n${totalsText(groups)}`);
  });
  bot.command('last', async (ctx) => {
    const rows = await service.list(ctx.profile.id);
    await replyLong(ctx, rows.length ? `Останні ${rows.length} витрат:\n\n${rows.map(expenseLine).join('\n')}` : 'Витрат ще немає. Напишіть «кава 85,50».');
  });
  bot.command('undo', async (ctx) => {
    const [expense] = await service.list(ctx.profile.id, { take: 1 });
    if (!expense) { await ctx.reply('Немає витрат для видалення.'); return; }
    const nonce = newNonce();
    ctx.session.flow = { kind: 'undo', expenseId: expense.id, nonce };
    await ctx.reply(`Видалити цю витрату?\n${expenseLine(expense)}`, {
      reply_markup: new InlineKeyboard().text('Так, видалити', `undo:${nonce}`).text('Скасувати', `cancel:${nonce}`),
    });
  });
  bot.command('categories', showCategories);
  bot.command('checkcategory', (ctx) => showCategoryChoices(ctx));
  bot.command('currency', async (ctx) => {
    if (ctx.match.trim()) {
      const profile = await service.setCurrency(ctx.profile.id, ctx.match);
      await ctx.reply(`Валюта для нових витрат: ${profile.defaultCurrency}. Раніше внесені суми не змінюються.`);
      return;
    }
    const keyboard = new InlineKeyboard();
    CURRENCIES.forEach((currency, index) => { keyboard.text(currency, `currency:${currency}`); if (index % 4 === 3) keyboard.row(); });
    await ctx.reply(`Валюта для нових витрат: ${ctx.profile.defaultCurrency}. Оберіть іншу або напишіть /currency USD. Конвертація валют не виконується.`, { reply_markup: keyboard });
  });
  bot.command('export', async (ctx) => {
    const period = ctx.match.trim() || month();
    const rows = await service.monthExpenses(ctx.profile.id, period);
    if (!rows.length) { await ctx.reply(`За ${period} витрат немає — експортувати нічого.`); return; }
    const buffer = await exportWorkbook(rows);
    await ctx.replyWithDocument(new InputFile(buffer, `expenses-${period}.xlsx`), { caption: `Витрати за ${period}. Записів: ${rows.length}.` });
  });

  bot.callbackQuery(/^catpage:(\d{1,6})$/, (ctx) => showCategoryChoices(ctx, Number(ctx.match[1])));
  bot.callbackQuery(/^catcheck:([a-z0-9]+):(\d{1,6})$/, (ctx) => showCategorySummary(ctx, ctx.match[1]!, Number(ctx.match[2])));
  bot.callbackQuery(/^day:(\d{4}-\d{2}-\d{2}):(\d{1,6})$/, (ctx) => showDay(ctx, ctx.match[1]!, Number(ctx.match[2])));
  bot.callbackQuery(/^pick:([a-f0-9]{12}):([a-z0-9]+)$/, async (ctx) => {
    const flow = ctx.session.flow;
    if (flow?.kind !== 'category' || flow.nonce !== ctx.match[1]) throw new UserInputError('Цей вибір уже неактуальний. Додайте витрату знову або скористайтеся /cancel.');
    await save(ctx, flow.draft, ctx.match[2]!);
  });
  bot.callbackQuery(/^new:([a-f0-9]{12})$/, async (ctx) => {
    const flow = ctx.session.flow;
    if (flow?.kind !== 'category' || flow.nonce !== ctx.match[1]) throw new UserInputError('Ця кнопка вже неактуальна. Скористайтеся /add.');
    ctx.session.flow = { kind: 'category-create', draft: flow.draft };
    await ctx.reply('Введіть назву нової категорії (до 40 символів). Після цього збережу витрату. Скасувати: /cancel.');
  });
  bot.callbackQuery(/^undo:([a-f0-9]{12})$/, async (ctx) => {
    const flow = ctx.session.flow;
    if (flow?.kind !== 'undo' || flow.nonce !== ctx.match[1]) throw new UserInputError('Підтвердження вже неактуальне. Скористайтеся /undo ще раз.');
    const removed = await service.deleteExpense(ctx.profile.id, flow.expenseId);
    ctx.session = {};
    await ctx.reply(removed ? 'Витрату видалено.' : 'Цю витрату вже видалено.');
  });
  bot.callbackQuery(/^cancel:([a-f0-9]{12})$/, async (ctx) => {
    const flow = ctx.session.flow;
    if (!flow || !('nonce' in flow) || flow.nonce !== ctx.match[1]) throw new UserInputError('Ця кнопка вже неактуальна. Для скасування поточної дії — /cancel.');
    ctx.session = {};
    await ctx.reply('Дію скасовано.');
  });
  bot.callbackQuery('category-new', async (ctx) => {
    ctx.session.flow = { kind: 'category-create' };
    await ctx.reply('Введіть назву категорії (до 40 символів). Скасувати: /cancel.');
  });
  bot.callbackQuery(/^manage:([a-z0-9]+)$/, async (ctx) => {
    const category = await service.getCategory(ctx.profile.id, ctx.match[1]!);
    await ctx.reply(`Категорія «${category.name}». Перейменування також змінить назву в історії.`, {
      reply_markup: new InlineKeyboard().text('Перейменувати', `rename:${category.id}`).text('Архівувати', `archive:${category.id}`),
    });
  });
  bot.callbackQuery(/^rename:([a-z0-9]+)$/, async (ctx) => {
    const category = await service.getCategory(ctx.profile.id, ctx.match[1]!);
    ctx.session.flow = { kind: 'category-rename', categoryId: category.id };
    await ctx.reply(`Нова назва для «${category.name}»? Скасувати: /cancel.`);
  });
  bot.callbackQuery(/^archive:([a-z0-9]+)$/, async (ctx) => {
    const category = await service.getCategory(ctx.profile.id, ctx.match[1]!);
    const nonce = newNonce();
    ctx.session.flow = { kind: 'category-archive', categoryId: category.id, nonce };
    await ctx.reply(`Архівувати «${category.name}»? Витрати залишаться у звітах.`, {
      reply_markup: new InlineKeyboard().text('Архівувати', `archive-confirm:${nonce}`).text('Скасувати', `cancel:${nonce}`),
    });
  });
  bot.callbackQuery(/^archive-confirm:([a-f0-9]{12})$/, async (ctx) => {
    const flow = ctx.session.flow;
    if (flow?.kind !== 'category-archive' || flow.nonce !== ctx.match[1]) throw new UserInputError('Це підтвердження вже неактуальне. Відкрийте /categories.');
    await service.archiveCategory(ctx.profile.id, flow.categoryId);
    ctx.session = {};
    await ctx.reply('Категорію архівовано. Історію витрат збережено.');
  });
  bot.callbackQuery(/^currency:([A-Z]{3})$/, async (ctx) => {
    const profile = await service.setCurrency(ctx.profile.id, ctx.match[1]!);
    ctx.session = {};
    await ctx.reply(`Валюта для нових витрат: ${profile.defaultCurrency}. Раніше внесені суми не змінюються.`);
  });
  bot.on('callback_query:data', (ctx) => ctx.reply('Ця кнопка більше не підтримується. Відкрийте /help.'));

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) { await ctx.reply('Невідома команда. Перелік команд: /help.'); return; }
    const flow = ctx.session.flow;
    switch (flow?.kind) {
      case 'description':
        ctx.session.flow = { kind: 'amount', description: descriptionText(text) };
        await ctx.reply(`Яка сума у ${ctx.profile.defaultCurrency}? Наприклад: 85,50. Скасувати: /cancel.`);
        return;
      case 'amount':
        await chooseCategory(ctx, { description: flow.description, amountMinor: parseAmount(text) });
        return;
      case 'category-create': {
        const category = await service.addCategory(ctx.profile.id, text);
        if (flow.draft) await save(ctx, flow.draft, category.id);
        else { ctx.session = {}; await ctx.reply(`Категорія «${category.name}» готова. Переглянути: /categories.`); }
        return;
      }
      case 'category-rename':
        await service.renameCategory(ctx.profile.id, flow.categoryId, text);
        ctx.session = {};
        await ctx.reply('Категорію перейменовано. Переглянути: /categories.');
        return;
      case 'category':
      case 'undo':
      case 'category-archive':
        await ctx.reply('Оберіть кнопку в попередньому повідомленні або скасуйте дію через /cancel.');
        return;
      default:
        await chooseCategory(ctx, parseExpense(text));
    }
  });
  bot.on('message', (ctx) => ctx.reply('Надішліть витрату текстом, наприклад «кава 85,50», або скористайтеся /add.'));
  bot.catch(({ error }) => logFailure('unhandled_update', error));
  return bot;
}
