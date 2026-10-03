const express = require("express");

const pool = require("../db");
const {
  ValidationError,
  searchProperties,
} = require("../services/propertySearch");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const payload = await searchProperties(pool, req.query);

    res.status(200).json(payload);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    console.error("Property search failed:", error.message);

    res.status(500).json({
      error: "Failed to search properties.",
    });
  }
});

module.exports = router;
