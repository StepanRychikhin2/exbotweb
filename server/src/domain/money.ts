import { UserInputError } from './errors.js';

export const CURRENCIES = ['UAH', 'USD', 'EUR', 'PLN', 'GBP', 'CZK', 'CAD', 'CHF'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const MAX_AMOUNT_MINOR = 99_999_999_999n;

export function currencyCode(value: string): Currency {
  const code = value.trim().toUpperCase();
  if (!CURRENCIES.includes(code as Currency)) {
    throw new UserInputError(`Оберіть валюту: ${CURRENCIES.join(', ')}.`);
  }
  return code as Currency;
}

export function validateAmount(amount: bigint): bigint {
  if (amount <= 0n || amount > MAX_AMOUNT_MINOR) {
    throw new UserInputError('Сума має бути від 0,01 до 999999999,99.');
  }
  return amount;
}

export function parseAmount(text: string): bigint {
  const match = /^(\d{1,9})(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (!match) {
    throw new UserInputError('Введіть додатну суму без пробілів: 500 або 85,50. Максимум два знаки після коми.');
  }
  return validateAmount(BigInt(match[1]!) * 100n + BigInt((match[2] ?? '').padEnd(2, '0')));
}

export function decimalAmount(amount: bigint): string {
  return `${amount / 100n}.${(amount % 100n).toString().padStart(2, '0')}`;
}

export function formatMoney(amount: bigint, currency: string): string {
  return `${decimalAmount(amount).replace('.', ',')} ${currency}`;
}
