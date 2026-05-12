import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

// Load .env from the monorepo root (adjust the relative path if your repo layout differs)
loadEnv({ path: join(__dirname, '../../../.env') });

const databaseUrl = process.env.DATABASE_URL;

// SSL default: on when DATABASE_URL present (managed Postgres), unless explicitly disabled.
const sslEnabled = databaseUrl
  ? process.env.DATABASE_SSL !== 'false'
  : process.env.DATABASE_SSL === 'true';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_USER ?? 'appuser',
        password: process.env.DATABASE_PASSWORD ?? 'apppass',
        database: process.env.DATABASE_NAME ?? 'appdb',
      }),

  // Glob patterns work for both `ts-node` (dev) and compiled `dist` (prod)
  entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*{.ts,.js}')],

  // Never enable in production — use migrations instead
  synchronize: false,

  // Helpful logging in dev; turn off or set to ['error'] in prod
  logging:
    process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],

  // Enable SSL when connecting to managed Postgres (RDS, Supabase, Neon, etc.)
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,

  // Recommended pool sizing for serverful APIs; tune for your workload
  extra: {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectionTimeoutMillis: 5000,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
