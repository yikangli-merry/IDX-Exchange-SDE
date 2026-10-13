const assert = require("node:assert/strict");
const test = require("node:test");

const {
  ValidationError,
} = require("../src/services/propertySearch");
const {
  buildOpenHousesSql,
  buildPropertyDetailSql,
  getOpenHousesByListingId,
  getPropertyByListingId,
  parseListingId,
} = require("../src/services/propertyDetails");

test("accepts numeric listing IDs as strings", () => {
  assert.equal(parseListingId(" 1190952876 "), "1190952876");
});

test("rejects invalid listing IDs", () => {
  assert.throws(() => parseListingId(""), ValidationError);
  assert.throws(() => parseListingId("abc123"), ValidationError);
  assert.throws(() => parseListingId("-1190952876"), ValidationError);
});

test("builds a parameterized property detail query", () => {
  const { sql, values } = buildPropertyDetailSql("1190952876");

  assert.match(sql, /FROM rets_property WHERE L_ListingID = \? LIMIT 1/);
  assert.deepEqual(values, ["1190952876"]);
});

test("builds a sorted open houses query", () => {
  const { sql, values } = buildOpenHousesSql("1190952876");

  assert.match(sql, /FROM rets_openhouse WHERE L_ListingID = \?/);
  assert.match(sql, /ORDER BY OpenHouseDate ASC, OH_StartTime ASC, id ASC/);
  assert.deepEqual(values, ["1190952876"]);
});

test("returns a single property by listing ID", async () => {
  const db = {
    async query(sql, values) {
      assert.match(sql, /FROM rets_property/);
      assert.deepEqual(values, ["1190952876"]);
      return [[{ L_ListingID: "1190952876", L_Address: "1 Main Street" }]];
    },
  };

  const property = await getPropertyByListingId(db, "1190952876");

  assert.equal(property.L_ListingID, "1190952876");
});

test("returns null when a property is not found", async () => {
  const db = {
    async query() {
      return [[]];
    },
  };

  const property = await getPropertyByListingId(db, "999999999999");

  assert.equal(property, null);
});

test("returns open houses for an existing property", async () => {
  const queries = [];
  const db = {
    async query(sql, values) {
      queries.push({ sql, values });

      if (queries.length === 1) {
        return [[{ L_ListingID: "1190952876" }]];
      }

      return [[{ id: 10, L_ListingID: "1190952876" }]];
    },
  };

  const { property, openHouses } = await getOpenHousesByListingId(
    db,
    "1190952876"
  );

  assert.equal(property.L_ListingID, "1190952876");
  assert.deepEqual(openHouses, [{ id: 10, L_ListingID: "1190952876" }]);
  assert.equal(queries.length, 2);
});

test("does not query open houses when the property is missing", async () => {
  let queryCount = 0;
  const db = {
    async query() {
      queryCount += 1;
      return [[]];
    },
  };

  const { property, openHouses } = await getOpenHousesByListingId(
    db,
    "999999999999"
  );

  assert.equal(property, null);
  assert.deepEqual(openHouses, []);
  assert.equal(queryCount, 1);
});
