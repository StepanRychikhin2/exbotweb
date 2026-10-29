# exbotweb

Проєкт для особистого обліку витрат із React-основою та окремим Telegram-ботом на Node.js/TypeScript.

React-застосунок залишається в корені репозиторію: `src/`, `public/`, Create React App і поточні залежності. Telegram-бот, PostgreSQL, Prisma, міграції та тести розташовані в `server/` і мають власний `package.json` та lockfile.

Вебінтерфейс MyEx перенесено з погодженого Figma Make прототипу в наявний React-застосунок. Лендінг, витрати, категорії, графіки, місячний бюджет, нагадування, Excel-експорт, теми й мови працюють на демонстраційних даних у localStorage. Вхід Telegram наразі демонстраційний; HTTP API та синхронізація вебінтерфейсу з базою Telegram-бота ще не підключені.

## Структура

```text
src/myex/             React-інтерфейс MyEx, переклади, модель і Excel-експорт
public/               файли React-застосунку
package.json          React-залежності та команди запуску обох частин
server/
  src/domain/         суми, дати, категорії й парсер
  src/services/       облік витрат і Excel-експорт
  src/bot/            Telegram-обробники та діалоги
  src/db/             підключення Prisma до PostgreSQL
  prisma/             схема й міграції
  tests/              автономні та інтеграційні тести
  compose.yaml        локальний PostgreSQL
  .env.example        шаблон серверних налаштувань
  README.md           повна інструкція Telegram-бота
```

## Встановлення та React

Потрібні Node.js 24 LTS (24.11 або новіша в гілці 24) і npm. На Windows x64 PostgreSQL запускається командою `npm run db:local` без Docker. Також можна використати Docker Desktop або власну базу PostgreSQL.

У корені `exbotweb`:

```powershell
npm ci
npm run bot:install
npm start
```

`npm start` запускає React на `http://localhost:3000`. Зупинка — Ctrl+C. Поточні React-команди `start`, `build`, `test` та `eject` збережено. React і сервер мають окремі залежності; `npm ci` в корені не встановлює серверні пакети, для них потрібна команда `bot:install`.

## Інтерфейс MyEx

Після `npm start` відкрийте `http://localhost:3000`, натисніть **Почати через Telegram → Увійти в демо**. Для перегляду інтерфейсу запуск бази чи бота не потрібен. Дані демо залишаються у цьому браузері; ключ localStorage — `myex-prototype-v1`.

Нижня панель на мобільному: прозорість кольору фону 50% у двох темах, `backdrop-filter: blur(3px)`. Стилі — `src/myex/styles.css`, екрани — `src/myex/MyExApp.jsx`. На комп’ютері використовується бічне меню.

ExcelJS 4.4.0 завантажується локально з `public/vendor/` лише при експорті; ліцензії містяться поруч. Гривні й долари мають окремі підсумки. Фото чека можна додавати; автоматичне розпізнавання ще не реалізоване.

## Локальна база без Docker (Windows)

На Windows x64 запустіть із кореня проєкту:

```powershell
npm run db:local
```

Команда створює справжній PostgreSQL 17 у фоні, генерує пароль, заповнює параметри бази в `server/.env` і застосовує міграції. Наявний `BOT_TOKEN` зберігається. Якщо `DATABASE_URL` уже вказує на іншу базу, команда не замінює це підключення.

```powershell
npm run db:local:status
npm run db:local:stop
```

Дані розташовані в **`server/.postgres/data/`** і залишаються після зупинки чи перезавантаження комп’ютера. Для повторного запуску виконайте `npm run db:local`; системна служба й автозапуск Windows не додаються. База доступна лише через `127.0.0.1`, початковий порт — `5432`.

Не видаляйте `server/.postgres/` або згенерований пароль, якщо хочете зберегти доступ до витрат. Папка виключена з Git. Журнал запуску: `server/.postgres/postgres.log`. Робіть резервні копії PostgreSQL.

Цей спосіб призначений для локальної розробки Windows x64 і використовує [embedded-postgres](https://github.com/leinelissen/embedded-postgres). Для сервера чи іншої ОС використовуйте звичайний PostgreSQL або Docker Compose.

## Запуск бота

Створіть бота через офіційного [@BotFather](https://t.me/BotFather) командою `/newbot`. Скопіюйте шаблон (якщо `server/.env` ще не існує):

```powershell
Copy-Item server/.env.example server/.env
```

У Linux/macOS: `cp server/.env.example server/.env`.

Заповніть у **`server/.env`**:

- `BOT_TOKEN` — справжній токен від BotFather.
- `DATABASE_URL` — автоматично заповнюється через `db:local`; для Docker чи зовнішньої бази задайте власний URL.
- `POSTGRES_PASSWORD` — генерується через `db:local`; для Docker Compose задайте власний пароль.
- `DEFAULT_CURRENCY=UAH`, `TIME_ZONE=Europe/Kyiv`, `NODE_ENV=development`.
- Для Compose початкові значення: `POSTGRES_USER=expensebot`, `POSTGRES_DB=expensebot`, `POSTGRES_PORT=5432`.

Формат локального URL: `postgresql://expensebot:<URL-encoded-пароль>@127.0.0.1:5432/expensebot`. Замініть позначення пароля власним значенням без кутових дужок. Параметри користувача, бази та порту мають збігатися з Compose.

Токен Telegram і пароль БД використовує лише сервер. Не додавайте їх до React-коду або змінних `REACT_APP_*`, які потрапляють у браузерну збірку. Не публікуйте `.env`.

У новому терміналі з кореня `exbotweb`:

```powershell
npm run db:local
npm run db:generate
npm run bot:dev
```

React і бот можуть працювати одночасно у двох терміналах. Для зібраного бота: `npm run bot:build`, потім `npm run bot:start`. Зупинка бота — Ctrl+C; локальної бази — `npm run db:local:stop`.

Для Docker Compose замість `db:local` виконайте `npm run db:up`, потім `npm run db:deploy`. Docker-база зупиняється через `npm run db:stop`; `npm run db:down` видаляє контейнери, зберігаючи том. Повна інструкція для Docker — у `server/README.md`.

## Команди бота

`/start`, `/help`, `/add`, `/today`, `/month`, `/last`, `/undo`, `/categories`, `/checkcategory`, `/currency`, `/export`, `/cancel`.

Приклади: `ігри 500`, `кава 85,50`, `500 ігри`, `/currency USD`, `/export 2026-10`.

`/checkcategory` показує кнопки категорій. Після вибору бот надсилає суми за поточний місяць та за весь час, окремо за валютами. Доступні власні й архівовані категорії; довгий список має сторінки.

В Excel під списком витрат розташовані підсумки за категоріями та загальна сума за місяць експорту. Різні валюти підсумовуються окремо.

Бот підтримує точні суми в найменших одиницях валюти, окремі підсумки валют, категорії, підтвердження видалення, ізоляцію користувачів та справжній Excel-експорт. Працює в приватних чатах через long polling. Повний опис, ручні сценарії перевірки, налаштування сервера та поширені помилки — у [server/README.md](server/README.md).

## Перевірки та збірка

Усі ці команди виконуються з кореня:

```powershell
npm run db:generate
npm run db:validate
npm run bot:typecheck
npm run bot:test
npm run build:all
```

- `npm run build` — React-збірка в `build/`.
- `npm run bot:build` — серверна збірка в `server/dist/`.
- `npm run build:all` — обидві збірки.
- `npm run bot:test` — автономні тести серверної логіки та XLSX.
- `npm run bot:test:integration` — тести зі справжнім PostgreSQL; потрібна окрема тестова база й `TEST_DATABASE_URL`, див. [інструкцію](server/README.md#автоматичні-перевірки-й-розробка).
- `npm run db:status`, `npm run db:studio` — стан міграцій і локальне адміністрування.
- Для нової міграції перейдіть у `server/` і виконайте `npm run db:migrate -- --name describe_change`, потім `npm run db:generate`.

Приклад systemd для постійного запуску бота знаходиться в `server/deploy/expensebot.service`; він розрахований на каталог `/opt/exbotweb/server`. Секрети та з’єднання з PostgreSQL налаштовуються на сервері.

## Наступний етап

Під’єднати React до сервісу витрат через HTTP API з перевіреною авторизацією, потім реалізувати вебекрани додавання витрат, історії та підсумків. Логіка обліку вже відокремлена від Telegram у `server/src/services/` і `server/src/domain/`.
