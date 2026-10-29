export const STORE = 'myex-prototype-v1';
export const today = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
export const uid = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const monthOf = d => d.slice(0, 7);
export function shiftDay(s, n) {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function monthDays(m) {
  return new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate();
}
export function priorMonth(m) {
  const d = new Date(m + '-15T12:00:00Z');
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}
export function rangeFor(period, custom = {}) {
  const t = today();
  if (period === 'today') return {
    from: t,
    to: t
  };
  if (period === 'week') return {
    from: shiftDay(t, -6),
    to: t
  };
  if (period === 'custom') return {
    from: custom.from || t,
    to: custom.to || t
  };
  return {
    from: t.slice(0, 7) + '-01',
    to: t
  };
}
export function parseMinor(v) {
  const s = String(v).trim().replace(',', '.');
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null;
  const [a, b = ''] = s.split('.');
  const n = Number(a) * 100 + Number(b.padEnd(2, '0'));
  return n > 0 && n <= 99999999999 ? n : null;
}
export const minorText = n => `${Math.floor(n / 100)}.${String(n % 100).padStart(2, '0')}`;
export const sum = rows => rows.reduce((a, r) => a + r.amount, 0);
export function money(n, currency = 'UAH', lang = 'uk') {
  return new Intl.NumberFormat(lang === 'uk' ? 'uk-UA' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: n % 100 === 0 ? 0 : 2,
    minimumFractionDigits: n % 100 === 0 ? 0 : 2
  }).format(n / 100);
}
export function dateText(d, lang = 'uk', long = false) {
  return new Intl.DateTimeFormat(lang === 'uk' ? 'uk-UA' : 'en-GB', {
    day: 'numeric',
    month: long ? 'long' : 'short',
    ...(long ? {
      year: 'numeric'
    } : {})
  }).format(new Date(d + 'T12:00:00'));
}
export const catName = (c, lang) => c?.customName || (lang === 'en' ? c?.en : c?.uk) || '—';
export const categorySeed = [{
  id: 'food',
  uk: 'Їжа',
  en: 'Food',
  icon: 'coffee',
  color: '#90CAF9',
  keywords: ['кава', 'продукт', 'їжа', 'кафе', 'coffee', 'food', 'lunch', 'pizza', 'піца', 'супермаркет']
}, {
  id: 'transport',
  uk: 'Транспорт',
  en: 'Transport',
  icon: 'car',
  color: '#64B5F6',
  keywords: ['таксі', 'транспорт', 'метро', 'taxi', 'bus', 'uber', 'пальне']
}, {
  id: 'shopping',
  uk: 'Покупки',
  en: 'Shopping',
  icon: 'bag',
  color: '#42A5F5',
  keywords: ['покуп', 'одяг', 'shop', 'одеж', 'кросівки']
}, {
  id: 'games',
  uk: 'Ігри',
  en: 'Games',
  icon: 'game',
  color: '#2196F3',
  keywords: ['гра', 'ігри', 'steam', 'game']
}, {
  id: 'home',
  uk: 'Дім',
  en: 'Home',
  icon: 'home',
  color: '#6C8AA6',
  keywords: ['дім', 'оренда', 'rent', 'інтернет', 'internet']
}, {
  id: 'travel',
  uk: 'Подорожі',
  en: 'Travel',
  icon: 'plane',
  color: '#BBDEFB',
  keywords: ['подорож', 'квиток', 'travel', 'flight', 'train']
}, {
  id: 'health',
  uk: 'Здоров’я',
  en: 'Health',
  icon: 'heart',
  color: '#7D9CAF',
  keywords: ['аптек', 'здоров', 'health', 'ліки']
}, {
  id: 'other',
  uk: 'Інше',
  en: 'Other',
  icon: 'grid',
  color: '#ADB5BD',
  keywords: []
}];
export function guessCategory(text, cats) {
  const lower = text.toLowerCase();
  const found = cats.filter(c => !c.archived && ((c.keywords || []).some(k => lower.includes(k)) || (c.customName && lower.includes(c.customName.toLowerCase()))));
  return found.length === 1 ? found[0].id : '';
}
export function parseQuick(s, cats) {
  const matches = [...s.matchAll(/(?:^|\s)(\d+(?:[.,]\d{1,2})?)(?=\s|$)/g)];
  if (matches.length !== 1) return null;
  const amount = parseMinor(matches[0][1]);
  if (!amount) return null;
  const desc = s.replace(matches[0][0], ' ').trim();
  if (!desc) return null;
  return {
    amount,
    description: desc,
    categoryId: guessCategory(desc, cats)
  };
}
export function filtered(rows, {
  currency,
  from,
  to,
  query = '',
  categoryId = '',
  min = '',
  max = ''
}) {
  const lo = min !== '' ? Math.round(Number(String(min).replace(',', '.')) * 100) : 0;
  const hi = max !== '' ? Math.round(Number(String(max).replace(',', '.')) * 100) : Infinity;
  return rows.filter(r => (!currency || r.currency === currency) && (!from || r.date >= from) && (!to || r.date <= to) && (!categoryId || r.categoryId === categoryId) && (!query || [r.description, r.en || ''].some(s => s.toLowerCase().includes(query.toLowerCase()))) && r.amount >= lo && r.amount <= hi);
}
export function grouped(rows, cats) {
  const map = new Map();
  for (const r of rows) {
    const key = r.categoryId + '|' + r.currency;
    const v = map.get(key) || {
      category: cats.find(c => c.id === r.categoryId),
      currency: r.currency,
      amount: 0,
      count: 0
    };
    v.amount += r.amount;
    v.count++;
    map.set(key, v);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}
export function comparison(rows, currency, categoryId = '') {
  const t = today(),
    m = monthOf(t),
    p = priorMonth(m),
    day = Number(t.slice(8));
  const prevTo = p + '-' + String(Math.min(day, monthDays(p))).padStart(2, '0');
  const current = sum(filtered(rows, {
    currency,
    categoryId,
    from: m + '-01',
    to: t
  }));
  const previous = sum(filtered(rows, {
    currency,
    categoryId,
    from: p + '-01',
    to: prevTo
  }));
  return {
    current,
    previous,
    percent: previous ? Math.round((current - previous) / previous * 100) : null,
    prevFrom: p + '-01',
    prevTo
  };
}
export function nextDue(date, freq) {
  if (freq === 'once') return null;
  if (freq === 'weekly') return shiftDay(date, 7);
  const m = monthOf(date),
    d = Number(date.slice(8)),
    nd = new Date(m + '-15T12:00:00Z');
  nd.setUTCMonth(nd.getUTCMonth() + 1);
  const nm = nd.toISOString().slice(0, 7);
  return nm + '-' + String(Math.min(d, monthDays(nm))).padStart(2, '0');
}
export function initialData() {
  const t = today(),
    m = monthOf(t),
    p = priorMonth(m),
    rows = [];
  const add = (date, categoryId, amount, description, en, currency = 'UAH', source = 'bot') => rows.push({
    id: uid(),
    date,
    categoryId,
    amount,
    description,
    en,
    currency,
    source,
    payment: '',
    receipt: null,
    createdAt: rows.length
  });
  for (let d = 1; d < Number(t.slice(8)); d++) {
    const date = m + '-' + String(d).padStart(2, '0');
    add(date, 'food', (120 + d * 73 % 450) * 100, d % 2 ? 'Обід у місті' : 'Продукти на тиждень', d % 2 ? 'Lunch in town' : 'Weekly groceries');
    if (d % 3 === 0) add(date, 'transport', (80 + d * 4) * 100, 'Дорога додому', 'Ride home');
    if (d % 8 === 0) add(date, 'shopping', 78000, 'Покупки для себе', 'Something for myself');
    if (d % 11 === 0) add(date, 'games', 34900, 'Гра у Steam', 'A game on Steam');
  }
  for (let d = 1; d <= Math.min(26, monthDays(p)); d++) {
    const date = p + '-' + String(d).padStart(2, '0');
    add(date, 'food', (160 + d * 51 % 390) * 100, 'Продукти та кава', 'Groceries and coffee');
    if (d % 4 === 0) add(date, 'transport', 22000, 'Таксі', 'Taxi');
    if (d === 15) add(date, 'shopping', 165000, 'Кросівки', 'Sneakers');
  }
  add(t, 'food', 8500, 'Кава з собою', 'Coffee to go', 'UAH', 'web');
  add(t, 'food', 34900, 'Продукти', 'Groceries');
  add(t, 'transport', 24000, 'Таксі додому', 'Taxi home');
  add(t, 'games', 22000, 'Вечірня гра', 'An evening game');
  add(t, 'games', 1499, 'Гра у Steam', 'A game on Steam', 'USD', 'web');
  add(m + '-01', 'other', 1299, 'Музична підписка', 'Music subscription', 'USD');
  add(p + '-01', 'other', 1299, 'Музична підписка', 'Music subscription', 'USD');
  return {
    version: 1,
    expenses: rows,
    categories: categorySeed,
    budgets: {
      [m + '|UAH']: 2000000
    },
    reminders: [{
      id: uid(),
      title: 'Музична підписка',
      en: 'Music subscription',
      amount: 1299,
      currency: 'USD',
      categoryId: 'other',
      date: t,
      freq: 'monthly',
      channels: ['app', 'telegram']
    }],
    paidOccurrences: [],
    lang: 'uk',
    theme: 'dark',
    currency: 'UAH',
    authenticated: false
  };
}
export function readStored() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved?.version === 1 && Array.isArray(saved.expenses) && Array.isArray(saved.categories)) return saved;
  } catch {}
  return initialData();
}
