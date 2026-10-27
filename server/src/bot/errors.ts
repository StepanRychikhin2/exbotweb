import { GrammyError, HttpError } from 'grammy';
import { UserInputError } from '../domain/errors.js';

export function errorKind(error: unknown): string {
  if (error instanceof UserInputError) return 'input';
  if (error instanceof GrammyError) return `telegram_${error.error_code}`;
  if (error instanceof HttpError) return 'telegram_network';
  if (typeof error === 'object' && error !== null && 'code' in error &&
    typeof error.code === 'string' && /^P\d{4}$/.test(error.code)) return 'database';
  return 'internal';
}

// Never log raw errors: driver URLs, Telegram request URLs and payloads may contain secrets or expenses.
export function logFailure(event: string, error: unknown): void {
  console.error(JSON.stringify({ event, kind: errorKind(error) }));
}

export function publicError(error: unknown): string {
  if (error instanceof UserInputError) return error.message;
  if (error instanceof GrammyError || error instanceof HttpError) {
    return 'Не вдалося виконати дію через Telegram. Спробуйте пізніше. Перед повторним додаванням перевірте /last.';
  }
  return 'Не вдалося завершити дію. Можливо, база даних тимчасово недоступна. Спробуйте пізніше; перед повторним додаванням перевірте /last.';
}
