import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Generation needs no connection; migration commands require a real URL.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});

