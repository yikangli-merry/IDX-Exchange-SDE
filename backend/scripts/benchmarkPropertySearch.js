// Read-only benchmark. Creates no indexes and never changes application data.
// Run from backend/: node scripts/benchmarkPropertySearch.js [case_name]
require("dotenv").config({ quiet: true });
const mysql = require("mysql2/promise");
const { performance } = require("node:perf_hooks");
const { buildPropertySearchSql, parsePropertySearchQuery } = require("../src/services/propertySearch");

const cases = [
  ["city_beds_price", { city: "Irvine", beds: "3", minPrice: "300000", maxPrice: "1500000" }],
  ["zip_beds_price", { zipcode: "92618", beds: "3", minPrice: "300000", maxPrice: "1500000" }],
  ["complex_filters", { city: "Irvine", zipcode: "92618", beds: "3", baths: "3", minPrice: "300000", maxPrice: "1500000" }],
];

async function main() {
  const selectedCases = process.argv[2] ? cases.filter(([name]) => name === process.argv[2]) : cases;
  if (!selectedCases.length) throw new Error(`Unknown case. Use ${cases.map(([name]) => name).join(", ")}.`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    connectTimeout: 5000,
  });
  try {
    const [[version]] = await connection.query("SELECT VERSION() AS version");
    const [[count]] = await connection.query("SELECT COUNT(*) AS total FROM rets_property");
    const [indexes] = await connection.query("SHOW INDEX FROM rets_property");
    const report = { server: version.version, properties: count.total, samples: 10,
      indexes: indexes.map(({ Key_name, Seq_in_index, Column_name, Expression }) => ({ Key_name, Seq_in_index, Column_name, Expression })), cases: [] };
    for (const [name, query] of selectedCases) {
      const sql = buildPropertySearchSql(parsePropertySearchQuery({ ...query, sortBy: "L_SystemPrice", sortOrder: "asc" }));
      for (const kind of ["count", "results"]) {
        const statement = sql[`${kind}Sql`];
        const values = sql[`${kind}Values`];
        const [plan] = await connection.query(`EXPLAIN ${statement}`, values);
        const [actual] = await connection.query(`EXPLAIN ANALYZE ${statement}`, values);
        await connection.query(statement, values); // One untimed warm-up.
        const milliseconds = [];
        let resultRows;
        for (let sample = 0; sample < 10; sample += 1) {
          const started = performance.now();
          [resultRows] = await connection.query(statement, values);
          milliseconds.push(performance.now() - started);
        }
        const sorted = [...milliseconds].sort((a, b) => a - b);
        report.cases.push({ name, kind, statement, values, plan, actual,
          matched: kind === "count" ? Number(resultRows[0].total) : resultRows.length,
          medianMs: Number(((sorted[4] + sorted[5]) / 2).toFixed(3)),
          samplesMs: milliseconds.map(value => Number(value.toFixed(3))) });
        console.error(`Measured ${name}/${kind}: ${report.cases.at(-1).medianMs} ms median`);
      }
    }
    console.log(JSON.stringify(report, null, 2));
  } finally { await connection.end(); }
}
main().catch(error => { console.error(`Benchmark failed: ${error.code || error.message}`); process.exitCode = 1; });
