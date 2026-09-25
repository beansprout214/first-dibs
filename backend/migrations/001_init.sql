-- Run this once against your database to set up the schema.
-- You can paste this directly into TablePlus's SQL editor, or run it via `npm run migrate`.

CREATE TABLE IF NOT EXISTS garments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  -- UNIQUE is what actually prevents two people from claiming the same garment.
  -- The database itself will reject a second insert for the same garment_id.
  garment_id INTEGER UNIQUE NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimed_at TIMESTAMP DEFAULT now(),
  -- Checked (not claimant_name) when unclaiming, so only the original
  -- browser that made the claim can undo it.
  claim_token TEXT
);

-- A garment can have several photos (front, back, tag, etc.), so photos
-- live in their own table rather than as a column on garments.
CREATE TABLE IF NOT EXISTS garment_photos (
  id SERIAL PRIMARY KEY,
  garment_id INTEGER NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  -- Controls which photo shows first; lower numbers display earlier.
  display_order INTEGER DEFAULT 0
);