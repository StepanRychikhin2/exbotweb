import { UserInputError } from './errors.js';

export const DEFAULT_CATEGORIES = [
  { key: 'food', name: 'Їжа', keywords: ['їжа', 'кав', 'чай', 'продукт', 'супермаркет', 'ресторан', 'обід', 'снідан', 'вечер', 'піца', 'піц', 'хліб', 'молоко', 'атб', 'сільпо'] },
  { key: 'transport', name: 'Транспорт', keywords: ['транспорт', 'таксі', 'метро', 'автобус', 'трамвай', 'пальн', 'бензин', 'парков', 'uber', 'bolt'] },
  { key: 'home', name: 'Дім', keywords: ['дім', 'оренд', 'комунал', 'ремонт', 'мебл', 'електроенергі', 'інтернет'] },
  { key: 'games', name: 'Ігри', keywords: ['ігри', 'гра', 'гру', 'steam', 'playstation', 'xbox', 'nintendo'] },
  { key: 'health', name: 'Здоров’я', keywords: ['здоров', 'аптек', 'ліки', 'лікар', 'стоматолог', 'аналіз', 'вітамін'] },
  { key: 'shopping', name: 'Покупки', keywords: ['покупк', 'одяг', 'взуття', 'кросівк', 'футболк', 'куртк'] },
  { key: 'other', name: 'Інше', keywords: ['інше'] },
] as const;

export function normalizeName(name: string): string {
  return name.normalize('NFKC').toLocaleLowerCase('uk').replace(/[’'`ʼ]/g, '').trim().replace(/\s+/g, ' ');
}

export function categoryName(text: string): { name: string; nameKey: string } {
  const name = text.trim().replace(/\s+/g, ' ');
  if (!/\p{L}/u.test(name) || name.length > 40 || /[\p{Cc}\p{Cf}]/u.test(name)) {
    throw new UserInputError('Назва категорії має містити літери та бути не довшою за 40 символів.');
  }
  return { name, nameKey: normalizeName(name) };
}

export function suggestCategory<T extends { id: string; name: string; defaultKey: string | null }>(
  description: string, categories: T[],
): T | undefined {
  const normalized = normalizeName(description);
  const words = normalized.split(/[^\p{L}\p{N}]+/u);
  const matches = categories.filter((category) => {
    const ownName = normalizeName(category.name);
    const nameMatches = ` ${normalized} `.includes(` ${ownName} `);
    const defaults = DEFAULT_CATEGORIES.find((item) => item.key === category.defaultKey);
    return nameMatches || defaults?.keywords.some((keyword) => words.some((word) => word.startsWith(keyword)));
  });
  return matches.length === 1 ? matches[0] : undefined;
}
