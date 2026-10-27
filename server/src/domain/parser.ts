import { UserInputError } from './errors.js';
import { parseAmount } from './money.js';

export function descriptionText(text: string): string {
  const value = text.trim().replace(/\s+/g, ' ');
  if (value.length < 1 || value.length > 300 || !/\p{L}/u.test(value) || /[\p{Cc}\p{Cf}]/u.test(value)) {
    throw new UserInputError('Опис має містити літери та бути не довшим за 300 символів.');
  }
  return value;
}

export function parseExpense(text: string): { description: string; amountMinor: bigint } {
  const parts = text.trim().split(/\s+/u);
  // More than one numeric-looking token is ambiguous, including quantities, dates and negative amounts.
  const candidates = parts.flatMap((part, index) => /^[+−-]?(?:\d|[.,]\d)/u.test(part) ? [index] : []);
  const index = candidates[0];
  if (parts.length < 2 || candidates.length !== 1 || (index !== 0 && index !== parts.length - 1)) {
    throw new UserInputError('Не можу однозначно визначити суму. Напишіть «кава 85,50» або «500 ігри». Якщо опис містить числа, скористайтеся /add.');
  }
  const amountMinor = parseAmount(parts[index]!);
  const description = descriptionText(parts.filter((_, i) => i !== index).join(' '));
  return { description, amountMinor };
}
