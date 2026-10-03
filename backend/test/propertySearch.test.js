const assert = require("node:assert/strict");
const test = require("node:test");

const {
  DEFAULT_LIMIT,
  ValidationError,
  buildPropertySearchSql,
  parsePropertySearchQuery,
} = require("../src/services/propertySearch");

test("uses default pagination values", () => {
  const filters = parsePropertySearchQuery({});

  assert.equal(filters.limit, DEFAULT_LIMIT);
  assert.equal(filters.offset, 0);
});

test("rejects invalid limit values", () => {
  assert.throws(
    () => parsePropertySearchQuery({ limit: "-20" }),
    ValidationError
  );
});

test("builds a case-insensitive city condition", () => {
  const filters = parsePropertySearchQuery({ city: "irvine" });
  const { resultsSql, resultsValues } = buildPropertySearchSql(filters);

  assert.match(resultsSql, /LOWER\(TRIM\(L_City\)\) = LOWER\(TRIM\(\?\)\)/);
  assert.deepEqual(resultsValues, ["irvine", DEFAULT_LIMIT, 0]);
});

test("keeps values aligned for city, minPrice, and beds filters", () => {
  const filters = parsePropertySearchQuery({
    city: "Irvine",
    minPrice: "300000",
    beds: "3",
  });
  const { countSql, countValues, resultsValues } = buildPropertySearchSql(filters);

  assert.match(
    countSql,
    /LOWER\(TRIM\(L_City\)\) = LOWER\(TRIM\(\?\)\) AND L_SystemPrice >= \? AND L_Keyword2 = \?/
  );
  assert.deepEqual(countValues, ["Irvine", 300000, 3]);
  assert.deepEqual(resultsValues, ["Irvine", 300000, 3, DEFAULT_LIMIT, 0]);
});

test("rejects non-numeric price, beds, and baths filters", () => {
  assert.throws(
    () => parsePropertySearchQuery({ minPrice: "cheap" }),
    ValidationError
  );
  assert.throws(
    () => parsePropertySearchQuery({ beds: "three" }),
    ValidationError
  );
  assert.throws(
    () => parsePropertySearchQuery({ baths: "many" }),
    ValidationError
  );
});
