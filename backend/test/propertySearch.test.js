const assert = require("node:assert/strict");
const test = require("node:test");

const {
  DEFAULT_LIMIT,
  ValidationError,
  buildPropertySearchSql,
  parsePropertySearchQuery,
  searchProperties,
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

test("keeps default ordering and defaults a selected sort field to ascending", () => {
  assert.match(buildPropertySearchSql(parsePropertySearchQuery({})).resultsSql, /ORDER BY id ASC LIMIT/);
  const parsed = parsePropertySearchQuery({ sortBy: "L_SystemPrice" });
  assert.equal(parsed.sortOrder, "asc");
});

for (const field of ["L_SystemPrice", "ListingContractDate", "LM_Int2_3", "L_Keyword2"]) {
  for (const order of ["asc", "desc"]) {
    test(`sorts ${field} ${order} with a stable ID tie-breaker and matching count filters`, () => {
      const sql = buildPropertySearchSql(parsePropertySearchQuery({ city: " Irvine ", beds: "3", sortBy: field, sortOrder: order, limit: "10", offset: "20" }));
      assert.ok(sql.resultsSql.includes(`ORDER BY ${field} ${order.toUpperCase()}, id ASC LIMIT ? OFFSET ?`));
      assert.deepEqual(sql.resultsValues, ["Irvine", 3, 10, 20]);
      assert.deepEqual(sql.countValues, ["Irvine", 3]);
      assert.ok(!sql.countSql.includes("ORDER BY"));
    });
  }
}

test("rejects invalid and repeated sorting parameters before any database query", async () => {
  const invalidQueries = [
    { sortBy: "ListPrice" }, { sortBy: "id" }, { sortBy: "" }, { sortBy: "   " },
    { sortBy: "L_SystemPrice DESC; DROP TABLE rets_property" },
    { sortBy: ["L_SystemPrice", "L_Keyword2"] }, { sortOrder: "asc" },
    { sortBy: "L_SystemPrice", sortOrder: "" }, { sortBy: "L_SystemPrice", sortOrder: "ASC" },
    { sortBy: "L_SystemPrice", sortOrder: "random" },
    { sortBy: "L_SystemPrice", sortOrder: ["asc", "desc"] },
  ];
  let calls = 0;
  const db = { query: async () => { calls += 1; throw new Error("Database must not be called"); } };
  for (const query of invalidQueries) await assert.rejects(searchProperties(db, query), ValidationError);
  assert.equal(calls, 0);
  assert.throws(() => buildPropertySearchSql({ sortBy: "L_SystemPrice; SELECT 1", sortOrder: "asc" }), ValidationError);
  assert.throws(() => buildPropertySearchSql({ sortBy: "L_SystemPrice", sortOrder: "asc; SELECT 1" }), ValidationError);
});

test("returns the existing paginated response shape for a sorted search", async () => {
  const calls = [];
  const rows = [{ id: 2, L_SystemPrice: 300000 }, { id: 3, L_SystemPrice: 300000 }];
  const db = { query: async (sql, values) => {
    calls.push({ sql, values });
    return [calls.length === 1 ? [{ total: "42" }] : rows];
  } };
  assert.deepEqual(await searchProperties(db, { sortBy: "L_SystemPrice", sortOrder: "asc", offset: "20" }), {
    total: 42, limit: 20, offset: 20, results: rows,
  });
  assert.match(calls[1].sql, /ORDER BY L_SystemPrice ASC, id ASC/);
  assert.deepEqual(calls[1].values, [20, 20]);
});
