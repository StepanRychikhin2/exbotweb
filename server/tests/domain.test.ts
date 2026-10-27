import { describe, expect, it } from 'vitest';
import { categoryName, DEFAULT_CATEGORIES, suggestCategory } from '../src/domain/categories.js';
import { dateValue, monthRange, todayInZone } from '../src/domain/dates.js';
import { formatMoney, parseAmount } from '../src/domain/money.js';
import { parseExpense } from '../src/domain/parser.js';

describe('точні суми та розбір повідомлень', () => {
  it.each([
    ['ігри 500', 'ігри', 50_000n], ['кава 85,50', 'кава', 8_550n],
    ['500 ігри', 'ігри', 50_000n], ['кава 0.01', 'кава', 1n],
    ['  PlayStation5   10.1  ', 'PlayStation5', 1_010n],
  ])('%s', (input, description, amountMinor) => {
    expect(parseExpense(input)).toEqual({ description, amountMinor });
  });
  it.each(['кава', '500', 'кава 0', 'кава -2', 'кава +2', 'кава 1.234', 'кава 1e3',
    'кава 100 200', '2 кави 100', 'кава 1 000', 'кава 500 грн', '100 кава 20', 'кава 20грн'])('не вгадує %s', (input) => {
    expect(() => parseExpense(input)).toThrow();
  });
  it('точно додає копійки та підтримує верхню межу', () => {
    expect(parseAmount('0.1') + parseAmount('0,2')).toBe(30n);
    expect(formatMoney(30n, 'UAH')).toBe('0,30 UAH');
    expect(parseAmount('999999999.99')).toBe(99_999_999_999n);
    expect(() => parseAmount('1000000000')).toThrow();
  });
});

describe('календарна дата Europe/Kyiv', () => {
  it.each([
    ['2026-10-31T22:30:00Z', '2026-11-01'],
    ['2026-06-30T21:30:00Z', '2026-07-01'],
    ['2026-03-29T00:59:59Z', '2026-03-29'],
    ['2026-03-29T01:00:00Z', '2026-03-29'],
    ['2026-10-25T01:00:00Z', '2026-10-25'],
  ])('%s → %s', (timestamp, expected) => {
    expect(todayInZone('Europe/Kyiv', new Date(timestamp))).toBe(expected);
  });
  it('переходить між роками й підтримує високосний лютий', () => {
    expect(monthRange('2026-12').to.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(monthRange('2024-02').to.toISOString()).toBe('2024-03-01T00:00:00.000Z');
    expect(dateValue('2024-02-29').toISOString()).toBe('2024-02-29T00:00:00.000Z');
    expect(() => dateValue('2026-02-29')).toThrow();
  });
  it.each(['2026-00', '2026-13', '26-10', '2026-1', '2026-10 extra', '0000-01'])('відхиляє місяць %s', (month) => {
    expect(() => monthRange(month)).toThrow();
  });
});

describe('категорії', () => {
  const categories = DEFAULT_CATEGORIES.map((category, id) => ({ id: String(id), name: category.name, defaultKey: category.key }));
  it('визначає одну категорію та не вгадує при кількох збігах', () => {
    expect(suggestCategory('кава', categories)?.name).toBe('Їжа');
    expect(suggestCategory('ігри', categories)?.name).toBe('Ігри');
    expect(suggestCategory('кава і таксі', categories)).toBeUndefined();
    expect(suggestCategory('подарунок', categories)).toBeUndefined();
  });
  it('розпізнає власні назви й однаково нормалізує апострофи', () => {
    expect(suggestCategory('хобі', [{ id: 'own', name: 'Хобі', defaultKey: null }])?.id).toBe('own');
    expect(categoryName("ЗДОРОВ'Я").nameKey).toBe(categoryName('Здоров’я').nameKey);
  });
});
