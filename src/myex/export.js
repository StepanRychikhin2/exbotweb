import { catName, grouped } from './model';
export async function buildWorkbook(ExcelJS, rows, categories, lang, range) {
  const en = lang === 'en',
    book = new ExcelJS.Workbook();
  book.creator = 'MyEx';
  book.created = new Date();
  const sheet = book.addWorksheet(en ? 'Expenses' : 'Витрати');
  sheet.columns = [{
    header: en ? 'Date' : 'Дата',
    key: 'date',
    width: 15
  }, {
    header: en ? 'Description' : 'Опис',
    key: 'description',
    width: 34
  }, {
    header: en ? 'Category' : 'Категорія',
    key: 'category',
    width: 22
  }, {
    header: en ? 'Amount' : 'Сума',
    key: 'amount',
    width: 19
  }, {
    header: en ? 'Currency' : 'Валюта',
    key: 'currency',
    width: 13
  }];
  const style = row => {
    row.font = {
      bold: true,
      color: {
        argb: 'FFF8F9FA'
      }
    };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'FF343A40'
      }
    };
    row.height = 27;
  };
  style(sheet.getRow(1));
  rows.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(e => sheet.addRow({
    date: e.date,
    description: en && e.en ? e.en : e.description,
    category: catName(categories.find(c => c.id === e.categoryId), lang),
    amount: e.amount / 100,
    currency: e.currency
  }));
  sheet.getColumn('amount').numFmt = '#,##0.00';
  sheet.views = [{
    state: 'frozen',
    ySplit: 1
  }];
  sheet.autoFilter = {
    from: {
      row: 1,
      column: 1
    },
    to: {
      row: Math.max(1, rows.length + 1),
      column: 5
    }
  };
  sheet.addRow([]);
  const title = sheet.addRow([en ? 'Category totals' : 'Підсумки за категоріями']);
  sheet.mergeCells(title.number, 1, title.number, 5);
  style(title);
  for (const g of grouped(rows, categories)) {
    const r = sheet.addRow([catName(g.category, lang), '', '', g.amount / 100, g.currency]);
    sheet.mergeCells(r.number, 1, r.number, 3);
  }
  sheet.addRow([]);
  for (const currency of [...new Set(rows.map(r => r.currency))]) {
    const total = rows.filter(r => r.currency === currency).reduce((s, r) => s + r.amount, 0);
    const row = sheet.addRow([en ? 'Period total' : 'Усього за період', '', '', total / 100, currency]);
    sheet.mergeCells(row.number, 1, row.number, 3);
    row.font = {
      bold: true
    };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: 'FFE3F2FD'
      }
    };
  }
  sheet.addRow([]);
  sheet.addRow([`${range.from} — ${range.to}`]);
  return book;
}
let loading;
function loadExcel() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (!loading) loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL(`${process.env.PUBLIC_URL || ''}/vendor/exceljs.min.js`, document.baseURI).href;
    s.onload = () => resolve(window.ExcelJS);
    s.onerror = () => {
      loading = null;
      reject(new Error('Excel load failed'));
    };
    document.head.appendChild(s);
  });
  return loading;
}
export async function exportWorkbook(rows, categories, lang, range) {
  const ExcelJS = await loadExcel();
  const book = await buildWorkbook(ExcelJS, rows, categories, lang, range);
  const bytes = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `MyEx_${range.from}_${range.to}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
