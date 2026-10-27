import ExcelJS from 'exceljs';
import { expect, it } from 'vitest';
import { exportWorkbook } from '../src/services/export.js';
import type { ExpenseWithCategory } from '../src/services/expenses.js';

it('експортує справжній XLSX з числовою сумою, датою, кирилицею та без формул із тексту', async () => {
  const expense: ExpenseWithCategory = {
    id: 'e', userId: 'u', categoryId: 'c', amountMinor: 8550n, currency: 'UAH',
    description: '=HYPERLINK("https://example.com","кава")', expenseDate: new Date('2026-10-27T00:00:00Z'),
    createdAt: new Date(), sourceKey: 'test:1',
    category: { id: 'c', userId: 'u', name: 'Їжа', nameKey: 'їжа', defaultKey: 'food', archivedAt: null, createdAt: new Date() },
  };
  const buffer = await exportWorkbook([expense]);
  expect(buffer.subarray(0, 2).toString()).toBe('PK');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.getWorksheet('Витрати')!;
  expect(sheet.getRow(1).values).toEqual([, 'Дата', 'Опис', 'Категорія', 'Сума', 'Валюта']);
  expect(sheet.getCell('A2').value).toEqual(expense.expenseDate);
  expect(sheet.getCell('B2').value).toBe(expense.description);
  expect(sheet.getCell('B2').type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell('C2').value).toBe('Їжа');
  expect(sheet.getCell('D2').value).toBe(85.5);
  expect(sheet.getCell('D2').numFmt).toBe('#,##0.00');
  expect(sheet.getCell('E2').value).toBe('UAH');
});

function expenseFixture(categoryId: string, name: string, amountMinor: bigint, currency = 'UAH'): ExpenseWithCategory {
  return {
    id: 'e-' + categoryId, userId: 'u', categoryId, amountMinor, currency,
    description: 'Витрата', expenseDate: new Date('2026-10-27T00:00:00Z'),
    createdAt: new Date('2026-10-27T12:00:00Z'), sourceKey: 'test:' + categoryId,
    category: { id: categoryId, userId: 'u', name, nameKey: name.toLowerCase(), defaultKey: null, archivedAt: null, createdAt: new Date() },
  };
}

async function openExport(rows: ExpenseWithCategory[]) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await exportWorkbook(rows) as unknown as ExcelJS.Buffer);
  return workbook.getWorksheet('Витрати')!;
}

it('додає внизу підсумки за категоріями й валютою та загальний підсумок за період', async () => {
  const sheet = await openExport([
    expenseFixture('food', 'Їжа', 8550n),
    expenseFixture('food', 'Їжа', 1450n),
    expenseFixture('travel', 'Подорожі', 4500000n),
    expenseFixture('games', 'Ігри', 1200000n),
    expenseFixture('food', 'Їжа', 10n, 'USD'),
    expenseFixture('food', 'Їжа', 20n, 'USD'),
  ]);
  expect(sheet.getCell('A9').value).toBe('Підсумки за категоріями за період експорту');
  expect(sheet.getCell('A10').value).toBe('Категорія');
  const groups: Record<string, ExcelJS.CellValue> = {};
  const totals: Record<string, ExcelJS.CellValue> = {};
  for (let index = 11; index <= sheet.rowCount; index++) {
    const row = sheet.getRow(index);
    const name = row.getCell(1).value;
    if (!name) continue;
    const currency = String(row.getCell(5).value);
    const amount = row.getCell(4);
    expect(amount.type).toBe(ExcelJS.ValueType.Number);
    expect(amount.numFmt).toBe('#,##0.00');
    if (name === 'Усього за період') totals[currency] = amount.value;
    else groups[String(name) + ':' + currency] = amount.value;
  }
  expect(groups).toEqual({ 'Їжа:UAH': 100, 'Їжа:USD': 0.3, 'Подорожі:UAH': 45000, 'Ігри:UAH': 12000 });
  expect(totals).toEqual({ UAH: 57100, USD: 0.3 });
  expect(sheet.autoFilter).toBe('A1:E7');
  expect(sheet.getCell('D2').value).toBe(85.5);
});

it('назва категорії у підсумку залишається текстом, навіть якщо починається зі знака =', async () => {
  const name = '=HYPERLINK("url","Їжа")';
  const sheet = await openExport([expenseFixture('custom', name, 100n)]);
  expect(sheet.getCell('A6').value).toBe(name);
  expect(sheet.getCell('A6').type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell('D6').value).toBe(1);
});

it('не втрачає копійки у великому підсумку понад точність чисел Excel', async () => {
  const item = expenseFixture('large', 'Великі витрати', 99_999_999_999n);
  const rows = Array.from({ length: 10_001 }, () => item);
  const sheet = await openExport(rows);
  // Each source amount is valid; the aggregate needs more than 15 significant digits.
  const expected = '10000999999899.99';
  expect(sheet.getCell('D10006').value).toBe(expected);
  expect(sheet.getCell('D10006').type).toBe(ExcelJS.ValueType.String);
  expect(sheet.getCell('D10008').value).toBe(expected);
}, 20_000);
