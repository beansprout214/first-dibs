// Reads 001_init.sql and executes it against whatever DATABASE_URL points to.
// Run with: npm run migrate
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '001_init.sql'), 'utf8');
  console.log('Running migration...');
  await pool.query(sql);
  console.log('Done. Tables created (or already existed).');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
