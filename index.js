require('dotenv').config();
const express = require('express');
const templatesRouter = require("./routes/templates");
const eventsRouter = require("./routes/events");
const configurationRoutes = require("./routes/configurations");
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: [
    "http://localhost:3000",              // local dev
    "https://monetization-mvp.vercel.app" // production
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
app.use("/api/templates", templatesRouter);
app.use("/api/configurations", configurationRoutes);
app.use("/api/events", eventsRouter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get('/', (req, res) => {
  res.send('LiveOps backend is running 🚀');
});


app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

