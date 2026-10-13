const cors = require("cors");
const express = require("express");

const pool = require("./db");
const requestLogger = require("./middleware/requestLogger");
const propertiesRouter = require("./routes/properties");

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/properties", propertiesRouter);

module.exports = app;
