import ExcelJS from 'exceljs';
import { decimalAmount } from '../domain/money.js';
import type { ExpenseWithCategory } from './expenses.js';

function excelAmount(amountMinor: bigint): number | string {
  const decimal = decimalAmount(amountMinor);
  // Excel has 15 significant decimal digits. Preserve cents as text beyond that limit.
  // Conversion is only for output; all totals below are calculated with bigint.
  return amountMinor > 999_999_999_999_999n ? decimal : Number(decimal);
}

export async function exportWorkbook(expenses: ExpenseWithCategory[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'expensiveBotWeb';
  const sheet = workbook.addWorksheet('Витрати', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [
    { header: 'Дата', key: 'date', width: 14 },
    { header: 'Опис', key: 'description', width: 55 },
    { header: 'Категорія', key: 'category', width: 24 },
    { header: 'Сума', key: 'amount', width: 24 },
    { header: 'Валюта', key: 'currency', width: 12 },
  ];
  const categories = new Map<string, { name: string; currency: string; amountMinor: bigint }>();
  const totals = new Map<string, bigint>();
  for (const expense of expenses) {
    sheet.addRow({
      date: expense.expenseDate, description: expense.description, category: expense.category.name,
      amount: excelAmount(expense.amountMinor), currency: expense.currency,
    });
    const key = expense.categoryId + ':' + expense.currency;
    const group = categories.get(key) ?? { name: expense.category.name, currency: expense.currency, amountMinor: 0n };
    group.amountMinor += expense.amountMinor;
    categories.set(key, group);
    totals.set(expense.currency, (totals.get(expense.currency) ?? 0n) + expense.amountMinor);
  }
  sheet.getColumn('date').numFmt = 'dd.mm.yyyy';
  sheet.getColumn('amount').numFmt = '#,##0.00';
  sheet.getColumn('description').alignment = { vertical: 'top', wrapText: true };
  sheet.getColumn('category').alignment = { vertical: 'top', wrapText: true };
  const headerStyle = (row: ExcelJS.Row) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF245743' } };
    row.height = 24;
  };
  headerStyle(sheet.getRow(1));
  // Filtering/sorting the detail table must not include the summary underneath.
  sheet.autoFilter = { from: 'A1', to: 'E' + (expenses.length + 1) };
  if (expenses.length) {
    sheet.addRow([]);
    const title = sheet.addRow(['Підсумки за категоріями за період експорту']);
    sheet.mergeCells(title.number, 1, title.number, 5);
    title.font = { bold: true, size: 13, color: { argb: 'FF245743' } };
    title.height = 28;
    const header = sheet.addRow(['Категорія', null, null, 'Сума', 'Валюта']);
    sheet.mergeCells(header.number, 1, header.number, 3);
    headerStyle(header);
    const addTotalRow = (name: string, amountMinor: bigint, currency: string, grandTotal = false) => {
      const amount = excelAmount(amountMinor);
      const row = sheet.addRow([name, null, null, amount, currency]);
      sheet.mergeCells(row.number, 1, row.number, 3);
      row.getCell(1).alignment = { vertical: 'middle', wrapText: true };
      row.getCell(4).numFmt = typeof amount === 'string' ? '@' : '#,##0.00';
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      row.height = 23;
      if (grandTotal) {
        row.font = { bold: true };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F0EA' } };
      }
    };
    const groups = [...categories.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'uk') || a.currency.localeCompare(b.currency));
    for (const group of groups) addTotalRow(group.name, group.amountMinor, group.currency);
    sheet.addRow([]);
    for (const [currency, amountMinor] of [...totals].sort(([a], [b]) => a.localeCompare(b))) {
      addTotalRow('Усього за період', amountMinor, currency, true);
    }
  }
  // Strings stay strings (including leading '='), never spreadsheet formulas.
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
