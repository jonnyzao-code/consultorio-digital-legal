import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://consultorio:consultorio@localhost:5432/consultorio';

export const pool = new Pool({ connectionString });

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params as any[]);
}
