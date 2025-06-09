const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// GET all configurations
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM configurations");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching configurations:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST a new configuration
router.post("/", async (req, res) => {
  const { config_name, event_type, offer_type, slots } = req.body;

  if (!config_name || !event_type || !offer_type || !slots) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO configurations (config_name, event_type, offer_type, slots)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [config_name, event_type, offer_type, JSON.stringify(slots)]);
    res.status(201).json({ message: "Configuration created" });
  } catch (err) {
    console.error("Error creating configuration:", err);
    res.status(500).json({ error: "Could not create configuration" });
  }
});

// PUT to update an existing configuration
router.put("/:config_name", async (req, res) => {
    const originalName = req.params.config_name;
    const { config_name, event_type, offer_type, slots } = req.body;
  
    try {
      const query = `
        UPDATE configurations
        SET config_name = $1, event_type = $2, offer_type = $3, slots = $4
        WHERE config_name = $5
      `;
      await pool.query(query, [
        config_name, // new name
        event_type,
        offer_type,
        JSON.stringify(slots),
        originalName, // search by old name
      ]);
      res.status(200).json({ message: "Configuration updated" });
    } catch (err) {
      console.error("Error updating configuration:", err);
      res.status(500).json({ error: "Could not update configuration" });
    }
  });
  

// DELETE a configuration
router.delete("/:config_name", async (req, res) => {
  const { config_name } = req.params;

  try {
    await pool.query("DELETE FROM configurations WHERE config_name = $1", [config_name]);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting configuration:", err);
    res.status(500).json({ error: "Could not delete configuration" });
  }
});

module.exports = router;
