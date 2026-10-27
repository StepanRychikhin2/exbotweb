import 'dotenv/config';
import { currencyCode, type Currency } from './domain/money.js';

export interface Config {
  botToken: string;
  databaseUrl: string;
  defaultCurrency: Currency;
  timeZone: string;
  nodeEnv: 'development' | 'test' | 'production';
}

export class ConfigError extends Error {}

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const botToken = env.BOT_TOKEN?.trim() ?? '';
  if (!/^\d+:[\w-]{20,}$/.test(botToken)) throw new ConfigError('Заповніть BOT_TOKEN справжнім токеном від @BotFather.');
  const databaseUrl = env.DATABASE_URL?.trim() ?? '';
  try {
    const url = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
  } catch {
    throw new ConfigError('DATABASE_URL має містити справжній URL PostgreSQL із назвою бази даних.');
  }
  const timeZone = env.TIME_ZONE?.trim() || 'Europe/Kyiv';
  try { new Intl.DateTimeFormat('uk-UA', { timeZone }).format(); }
  catch { throw new ConfigError('TIME_ZONE має бути часовим поясом IANA, наприклад Europe/Kyiv.'); }
  let defaultCurrency: Currency;
  try { defaultCurrency = currencyCode(env.DEFAULT_CURRENCY || 'UAH'); }
  catch { throw new ConfigError('DEFAULT_CURRENCY: доступні UAH, USD, EUR, PLN, GBP, CZK, CAD, CHF.'); }
  const nodeEnv = env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new ConfigError('NODE_ENV: development, test або production.');
  return { botToken, databaseUrl, defaultCurrency, timeZone, nodeEnv: nodeEnv as Config['nodeEnv'] };
}
