const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/garments
// Returns every garment along with who (if anyone) has claimed it.
// A LEFT JOIN means garments with no claim still show up, just with claimant_name = null.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        g.id,
        g.name,
        g.size,
        g.description,
        g.photo_url,
        c.claimant_name,
        c.claimed_at
      FROM garments g
      LEFT JOIN claims c ON c.garment_id = g.id
      ORDER BY g.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch garments." });
  }
});

// POST /api/garments/:id/claim
// Body: { claimantName: "Alex" }
// Tries to insert a claim row. If one already exists for this garment,
// the UNIQUE constraint on garment_id makes Postgres reject the insert
// with error code 23505 — that's our signal to tell the client "too late."
router.post("/:id/claim", async (req, res) => {
  const { id } = req.params;
  const { claimantName } = req.body;
  const { claimToken } = req.body;

  if (!claimantName || !claimantName.trim()) {
    return res.status(400).json({ error: "claimantName is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO claims (garment_id, claimant_name, claim_token)
       VALUES ($1, $2, $3)
       RETURNING claimant_name, claimed_at`,
      [id, claimantName.trim(), claimToken],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // unique_violation — someone already claimed this garment.
      return res
        .status(409)
        .json({ error: "This item has already been claimed." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to claim garment." });
  }
});

// POST /api/garments/:id/unclaim
// Body: { claimantName: "Alex" }
// Only deletes the claim if the provided name matches who claimed it.
// This is NOT real authentication — it's a lightweight courtesy check
// appropriate for a small trusted group, not a security boundary.
router.post("/:id/unclaim", async (req, res) => {
  const { id } = req.params;
  const { claimToken } = req.body;

  try {
    const result = await pool.query(
      `DELETE FROM claims
       WHERE garment_id = $1 AND claim_token = $2
       RETURNING id`,
      [id, claimToken],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "No matching claim found to remove." });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unclaim garment." });
  }
});

module.exports = router;
