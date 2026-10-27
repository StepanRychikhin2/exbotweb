import { GrammyError } from 'grammy';
import { ConfigError, readConfig } from './config.js';
import { createDatabase } from './db/client.js';
import { ExpenseService } from './services/expenses.js';
import { createBot, COMMANDS } from './bot/create-bot.js';
import { logFailure } from './bot/errors.js';
import { PrismaSessionStorage } from './bot/session.js';

async function main(): Promise<void> {
  const config = readConfig();
  const db = createDatabase(config.databaseUrl);
  try {
    // Validate connectivity AND applied schema before contacting Telegram or consuming updates.
    await db.$connect();
    await db.user.count();
    const bot = createBot(config, new ExpenseService(db, config.defaultCurrency), new PrismaSessionStorage(db));
    let stopping = false;
    const stop = () => {
      stopping = true;
      if (bot.isRunning()) void bot.stop().catch((error: unknown) => logFailure('shutdown_failed', error));
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    try {
      await bot.init();
      await bot.api.setMyCommands(COMMANDS, { scope: { type: 'all_private_chats' } });
      await bot.api.setChatMenuButton({ menu_button: { type: 'commands' } });
      if (!stopping) {
        await bot.start({
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
          onStart: () => { console.info('Бот запущено (long polling). Для зупинки натисніть Ctrl+C.'); },
        });
      }
    } finally {
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
    }
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  if (error instanceof ConfigError) console.error(error.message);
  else if (error instanceof GrammyError && error.error_code === 401) console.error('Telegram відхилив токен. Перевірте BOT_TOKEN у .env.');
  else if (error instanceof GrammyError && error.error_code === 409) console.error('Конфлікт Telegram: зупиніть інші копії цього бота.');
  else {
    logFailure('startup_or_polling_failed', error);
    console.error('Не вдалося запустити або продовжити роботу. Перевірте PostgreSQL, міграції, з’єднання з Telegram та налаштування .env.');
  }
  process.exitCode = 1;
});
