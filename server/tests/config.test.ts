import { expect, it } from 'vitest';
import { readConfig } from '../src/config.js';
import { publicError } from '../src/bot/errors.js';

it('не приймає відсутні налаштування і не показує секрет із помилки', () => {
  expect(() => readConfig({})).toThrow('BOT_TOKEN');
  expect(publicError(new Error('postgres://secret_password@host/db'))).not.toContain('secret_password');
});
