const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all templates
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM templates ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /templates error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST new or update existing template
router.post("/", async (req, res) => {
    console.log('Incoming POST /api/templates body:', req.body);

    const {
        template_name,
        title,
        configuration,
        layout,
        event_type,
        offer_type,
        slots
      } = req.body;
      console.log("Received payload:", req.body);

  try {
    const result = await pool.query(
        'INSERT INTO templates (template_name, title, event_type, offer_type, layout, configuration, slots) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING *',
        [template_name, title, event_type, offer_type, layout, configuration, JSON.stringify(slots)]
      );
      res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /templates error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE template by name
router.delete("/:name", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM templates WHERE template_name = $1", [
      req.params.name,
    ]);
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /templates error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ UPDATE template by name
router.put("/:name", async (req, res) => {
    const { name } = req.params;
    const {
      template_name,
      title,
      configuration,
      layout,
      event_type,
      offer_type,
      slots,
    } = req.body;
  
    try {
      await pool.query(
        `UPDATE templates
         SET title = $1,
             configuration = $2,
             layout = $3,
             event_type = $4,
             offer_type = $5,
             slots = $6
         WHERE template_name = $7`,
        [title, configuration, layout, event_type, offer_type, JSON.stringify(slots), name]
      );
      res.sendStatus(204);
    } catch (err) {
      console.error("PUT /api/templates/:name error:", err);
      res.status(500).json({ error: "Failed to update template" });
    }
  });
  

module.exports = router;
