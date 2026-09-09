import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

async function main() {
  const schema = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const seed = readFileSync(join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
  await pool.query(schema);
  await pool.query(seed);
  console.log('✔ Migración completada: esquema + datos semilla aplicados.');
  await pool.end();
}

main().catch((e) => {
  console.error('Error en migración:', e.message);
  process.exit(1);
});
