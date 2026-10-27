import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import net from 'node:net';
import dotenv from 'dotenv';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = path.join(root, '.postgres');
const dataDir = path.join(stateDir, 'data');
const stateFile = path.join(stateDir, 'local.json');
const envFile = path.join(root, '.env');
const action = process.argv[2] ?? 'up';
class SetupError extends Error {}
let secrets = [];

function shortPath(directory) {
  const result = spawnSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    '$fso = New-Object -ComObject Scripting.FileSystemObject; $fso.GetFolder($env:EXBOT_SHORT_PATH).ShortPath',
  ], { env: { ...process.env, EXBOT_SHORT_PATH: directory }, windowsHide: true, encoding: 'utf8' });
  const value = result.stdout?.trim();
  if (result.status !== 0 || !value || /[^\x20-\x7e]/.test(value)) {
    throw new SetupError('Не вдалося отримати короткий Windows-шлях. Для локального PostgreSQL потрібен шлях латиницею або ввімкнені короткі NTFS-імена.');
  }
  return value;
}
function redact(text = '') {
  for (const value of secrets) if (value) text = text.split(value).join('[hidden]');
  return text;
}
function run(binary, args, cwd, failure) {
  const result = spawnSync(binary, args, {
    cwd, windowsHide: true, stdio: 'ignore', timeout: 45_000,
    env: { ...process.env, LC_MESSAGES: 'C' },
  });
  if (result.error || result.status !== 0) throw new SetupError(failure);
  return result;
}
async function availablePort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new SetupError('Порт PostgreSQL зайнятий. Зупиніть іншу базу або змініть POSTGRES_PORT перед першим запуском.')));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
function updateEnv(text, entries) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  for (const [key, value] of Object.entries(entries)) {
    const expression = new RegExp('^(?:export\\s+)?' + key + '\\s*=.*$', 'm');
    const line = key + '=' + value;
    if (expression.test(text)) text = text.replace(expression, () => line);
    else text += (text.endsWith('\n') || !text ? '' : eol) + line + eol;
  }
  return text;
}
async function connect(settings, password, database) {
  const client = new pg.Client({
    host: '127.0.0.1', port: settings.port, user: settings.user, password, database,
    connectionTimeoutMillis: 5_000,
  });
  try { await client.connect(); return client; }
  catch {
    await client.end().catch(() => {});
    throw new SetupError('Не вдалося підключитися до локального PostgreSQL. Не змінюйте згенерований пароль у server/.env без зміни пароля в самій базі.');
  }
}
async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new SetupError('Ця команда підготовлена для Windows x64. На іншій системі використайте Docker Compose або власний PostgreSQL.');
  }
  if (!['up', 'stop', 'status'].includes(action)) throw new SetupError('Доступні дії: up, stop, status.');
  const localRequire = createRequire(import.meta.url);
  let binaries;
  try {
    const embeddedRequire = createRequire(localRequire.resolve('embedded-postgres'));
    binaries = await import(pathToFileURL(embeddedRequire.resolve('@embedded-postgres/windows-x64')).href);
  } catch {
    throw new SetupError('Спочатку виконайте npm run bot:install з кореня exbotweb.');
  }
  const binaryDir = shortPath(path.dirname(binaries.pg_ctl));
  const pgCtl = path.join(binaryDir, path.basename(binaries.pg_ctl));
  const initdb = path.join(binaryDir, path.basename(binaries.initdb));
  const shortRoot = shortPath(root);
  if (action !== 'up' && !existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('Локальну базу ще не створено. Запуск: npm run db:local.');
    return;
  }
  if (!existsSync(envFile)) {
    if (action !== 'up') throw new SetupError('Відсутній server/.env.');
    await fs.copyFile(path.join(root, '.env.example'), envFile);
  }
  let text = await fs.readFile(envFile, 'utf8');
  const values = dotenv.parse(text);
  secrets = [values.BOT_TOKEN, values.DATABASE_URL, values.POSTGRES_PASSWORD].filter(Boolean);
  let settings;
  if (existsSync(stateFile)) {
    settings = JSON.parse(await fs.readFile(stateFile, 'utf8'));
  } else {
    if (action !== 'up') throw new SetupError('Відсутня конфігурація локальної бази.');
    if (values.DATABASE_URL?.trim()) {
      throw new SetupError('DATABASE_URL уже заповнено. Команда не замінює налаштоване підключення іншою базою.');
    }
    settings = {
      user: values.POSTGRES_USER?.trim() || 'expensebot',
      database: values.POSTGRES_DB?.trim() || 'expensebot',
      port: Number(values.POSTGRES_PORT || 5432),
    };
  }
  if (![settings.user, settings.database].every((value) => typeof value === 'string' && /^[a-z_][a-z0-9_]{0,62}$/i.test(value)) ||
      !Number.isInteger(settings.port) || settings.port < 1024 || settings.port > 65535) {
    throw new SetupError('Перевірте POSTGRES_USER, POSTGRES_DB та POSTGRES_PORT (1024–65535).');
  }
  let password = values.POSTGRES_PASSWORD;
  if (!password && existsSync(path.join(dataDir, 'PG_VERSION'))) throw new SetupError('Відновіть POSTGRES_PASSWORD у server/.env. Дані бази збережено.');
  password ||= randomBytes(24).toString('hex');
  if (/[\r\n\0]/.test(password)) throw new SetupError('Пароль PostgreSQL не може містити переноси рядків.');
  const url = 'postgresql://' + encodeURIComponent(settings.user) + ':' + encodeURIComponent(password) +
    '@127.0.0.1:' + settings.port + '/' + settings.database;
  secrets.push(password, encodeURIComponent(password), url);
  if (action === 'up' && values.DATABASE_URL?.trim() && values.DATABASE_URL.trim() !== url) {
    throw new SetupError('DATABASE_URL не відповідає створеній локальній базі. Наявну конфігурацію не змінено.');
  }

  if (action === 'up') await fs.mkdir(dataDir, { recursive: true });
  const shortState = shortPath(stateDir);
  const shortData = shortPath(dataDir);
  const status = () => spawnSync(pgCtl, ['status', '-D', shortData], {
    cwd: shortRoot, windowsHide: true, stdio: 'ignore', timeout: 10_000,
  }).status;
  if (action === 'stop') {
    if (status() === 0) run(pgCtl, ['stop', '-D', shortData, '-m', 'fast', '-w', '-t', '30'], shortRoot, 'Не вдалося зупинити локальну базу.');
    console.log('Локальний PostgreSQL зупинено. Дані залишилися в server/.postgres/data.');
    return;
  }
  if (action === 'status') {
    if (status() !== 0) { console.log('Локальний PostgreSQL зупинений. Запуск: npm run db:local.'); return; }
    const client = await connect(settings, password, settings.database);
    try {
      const result = await client.query('SHOW server_version');
      console.log('PostgreSQL ' + result.rows[0].server_version + ': база ' + settings.database +
        ' доступна на 127.0.0.1:' + settings.port + '.');
    } finally { await client.end(); }
    return;
  }

  if (!existsSync(path.join(dataDir, 'PG_VERSION'))) {
    await availablePort(settings.port);
    const updates = {
      DATABASE_URL: url, POSTGRES_USER: settings.user, POSTGRES_DB: settings.database,
      POSTGRES_PORT: String(settings.port),
    };
    if (!values.POSTGRES_PASSWORD) updates.POSTGRES_PASSWORD = password;
    text = updateEnv(text, updates);
    await fs.writeFile(envFile, text, { mode: 0o600 });
    await fs.writeFile(stateFile, JSON.stringify(settings, null, 2), { mode: 0o600 });
    const passwordFile = path.join(shortState, 'init-password-' + randomUUID());
    try {
      await fs.writeFile(passwordFile, password + '\n', { flag: 'wx', mode: 0o600 });
      console.log('Створюю локальний кластер PostgreSQL...');
      run(initdb, ['-D', shortData, '--username=' + settings.user, '--pwfile=' + passwordFile,
        '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C', '--lc-messages=C'],
        shortRoot, 'Не вдалося створити кластер PostgreSQL. Наявні файли не видалялися.');
    } finally { await fs.unlink(passwordFile).catch(() => {}); }
  }
  if (status() !== 0) {
    run(pgCtl, ['start', '-D', shortData, '-l', path.join(shortState, 'postgres.log'),
      '-o', '-h 127.0.0.1 -p ' + settings.port, '-w', '-t', '30'], shortRoot,
      'Не вдалося запустити PostgreSQL. Перевірте порт і журнал server/.postgres/postgres.log.');
  }
  const admin = await connect(settings, password, 'postgres');
  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [settings.database]);
    if (!exists.rowCount) await admin.query('CREATE DATABASE "' + settings.database + '"');
  } finally { await admin.end(); }
  const migration = spawnSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
    cwd: root, env: { ...process.env, DATABASE_URL: url }, windowsHide: true, encoding: 'utf8', timeout: 60_000,
  });
  process.stdout.write(redact(migration.stdout || ''));
  process.stderr.write(redact(migration.stderr || ''));
  if (migration.error || migration.status !== 0) throw new SetupError('База запущена, але міграції не завершилися. Повторіть npm run db:deploy.');
  console.log('Готово: база ' + settings.database + ' працює на 127.0.0.1:' + settings.port + '.');
  console.log('Підключення записано в server/.env. Дані зберігаються в server/.postgres/data.');
  console.log('Запуск бота: npm run bot:dev. Зупинка бази: npm run db:local:stop.');
}
main().catch((error) => {
  console.error(error instanceof SetupError ? error.message : 'Не вдалося налаштувати локальну базу. Перевірте файли конфігурації та повторіть команду.');
  process.exitCode = 1;
});
