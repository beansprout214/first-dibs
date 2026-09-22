// Sets up a single, shared connection pool to Postgres.
// Every route file imports `pool` from here rather than creating its own connection.
require('dotenv').config();
const { Pool } = require('pg');

// DATABASE_URL is provided automatically by Railway once you attach a Postgres
// service. Locally, you'll set it in a .env file (see .env.example).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway's Postgres requires SSL in production but not for local dev.
  // This checks NODE_ENV so you don't have to toggle it by hand.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
