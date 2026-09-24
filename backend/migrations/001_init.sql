-- Run this once against your database to set up the schema.
-- You can paste this directly into TablePlus's SQL editor, or run it via `npm run migrate`.

CREATE TABLE IF NOT EXISTS garments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  garment_id INTEGER UNIQUE NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimed_at TIMESTAMP DEFAULT now(),
  claim_token TEXT
);