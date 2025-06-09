const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function computeFinalStatus(event) {
  const now = new Date();
  const start = new Date(event.start);
  const end = new Date(event.end);
  const status = event.status;

  if (status === "Ready") {
    if (now >= start && now <= end) return "Live";
    if (now > end) return "Done";
  }
  return status;
}

// GET all events with computed finalStatus
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY start ASC");
    const enriched = result.rows.map((event) => ({
      ...event,
      finalStatus: computeFinalStatus(event),
    }));
    res.json(enriched);
  } catch (err) {
    console.error("GET /events error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST new event
router.post("/", async (req, res) => {
  const { title, start, end, template_name, status = "Draft" } = req.body;
  try {
    const result = await pool.query(
      `
      INSERT INTO events (title, start, "end", template_name, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [title, start, end, template_name, status]
    );
    const event = result.rows[0];
    res.json({ ...event, finalStatus: computeFinalStatus(event) });
  } catch (err) {
    console.error("POST /events error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT update existing event
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, start, end, template_name, status = "Draft" } = req.body;
  try {
    const result = await pool.query(
      `
      UPDATE events
      SET title = $1, start = $2, "end" = $3, template_name = $4, status = $5
      WHERE id = $6
      RETURNING *;
      `,
      [title, start, end, template_name, status, id]
    );
    const event = result.rows[0];
    res.json({ ...event, finalStatus: computeFinalStatus(event) });
  } catch (err) {
    console.error("PUT /events/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM events WHERE id = $1", [id]);
    res.status(204).end();
  } catch (err) {
    console.error("DELETE /events/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

