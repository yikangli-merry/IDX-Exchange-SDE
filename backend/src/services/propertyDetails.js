const { ValidationError } = require("./propertySearch");

function parseListingId(value) {
  const listingId = String(value ?? "").trim();

  if (!/^\d+$/.test(listingId)) {
    throw new ValidationError('"id" must be a numeric listing ID.');
  }

  return listingId;
}

function buildPropertyDetailSql(listingId) {
  return {
    sql: "SELECT * FROM rets_property WHERE L_ListingID = ? LIMIT 1",
    values: [listingId],
  };
}

function buildOpenHousesSql(listingId) {
  return {
    sql: [
      "SELECT * FROM rets_openhouse",
      "WHERE L_ListingID = ?",
      "ORDER BY OpenHouseDate ASC, OH_StartTime ASC, id ASC",
    ].join(" "),
    values: [listingId],
  };
}

async function getPropertyByListingId(db, id) {
  const listingId = parseListingId(id);
  const { sql, values } = buildPropertyDetailSql(listingId);
  const [rows] = await db.query(sql, values);

  return rows[0] || null;
}

async function getOpenHousesByListingId(db, id) {
  const listingId = parseListingId(id);
  const property = await getPropertyByListingId(db, listingId);

  if (!property) {
    return {
      property: null,
      openHouses: [],
    };
  }

  const { sql, values } = buildOpenHousesSql(listingId);
  const [openHouses] = await db.query(sql, values);

  return {
    property,
    openHouses,
  };
}

module.exports = {
  buildOpenHousesSql,
  buildPropertyDetailSql,
  getOpenHousesByListingId,
  getPropertyByListingId,
  parseListingId,
};
