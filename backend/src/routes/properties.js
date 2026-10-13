const express = require("express");

const pool = require("../db");
const {
  getOpenHousesByListingId,
  getPropertyByListingId,
} = require("../services/propertyDetails");
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

router.get("/:id/openhouses", async (req, res) => {
  try {
    const { property, openHouses } = await getOpenHousesByListingId(
      pool,
      req.params.id
    );

    if (!property) {
      res.status(404).json({
        error: `Property not found for listing ID ${req.params.id}.`,
      });
      return;
    }

    res.status(200).json(openHouses);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    console.error("Open houses lookup failed:", error.message);

    res.status(500).json({
      error: "Failed to load open houses.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const property = await getPropertyByListingId(pool, req.params.id);

    if (!property) {
      res.status(404).json({
        error: `Property not found for listing ID ${req.params.id}.`,
      });
      return;
    }

    res.status(200).json(property);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    console.error("Property detail lookup failed:", error.message);

    res.status(500).json({
      error: "Failed to load property.",
    });
  }
});

module.exports = router;
