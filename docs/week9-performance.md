# Week 9: Property Search Performance

## Environment and method

- Dataset: the existing `rets` database, with 55,212 properties.
- Database: MySQL 8.4.11 in Docker; Node.js 24.18.0, npm 11.16.0 on Windows.
- The existing Windows MySQL service owns port 3306. The verification container
  `idx-mysql-week9` exposes `127.0.0.1:3307` and reuses the stopped
  `idx-mysql-local` container's existing MySQL data volume. Never run both
  containers against that volume at the same time.
- Existing credentials and `.env` files were preserved. Use a process-level
  `DB_PORT=3307` override with this container.
- Each benchmark uses the actual API SQL builder, including the full listing
  projection, photos, filters, ascending price order, stable `id` tie-breaker,
  limit 20, and offset 0. Count and listing queries are measured separately.
- Each statement receives one untimed warm-up, followed by 10 sequential timed
  queries on the same connection. The median averages the fifth and sixth
  sorted samples. Client timing includes SQL execution, result transfer, and
  mysql2 decoding; it is not a complete HTTP or browser response measurement.
- `EXPLAIN` estimates and `EXPLAIN ANALYZE` actual execution trees are captured
  separately from the timed samples. Local timings are observations rather
  than production guarantees; cache state, disk IO, and other local work vary.

## Queries and index choices

The three cases are city/beds/price, ZIP/beds/price, and all six filters.
The exact runnable statements are in `backend/sql/week9_explain.sql`.

The Week 3 `(L_City, L_SystemPrice, L_Keyword2)` index does not directly index
the API's `LOWER(TRIM(L_City))` expression. Week 9 adds:

```sql
CREATE INDEX idx_rets_property_city_normalized_beds_price
  ON rets_property ((LOWER(TRIM(L_City))), L_Keyword2, L_SystemPrice);

CREATE INDEX idx_rets_property_zip_beds_price
  ON rets_property (L_Zip, L_Keyword2, L_SystemPrice);
```

Equality conditions precede the price range. The city expression preserves
case and whitespace handling without updating stored values. Existing indexes
remain in place. Sorting by a different field can still require a separate
sort; these two indexes target the representative filtering combinations.
Index creation also costs storage and additional work on future writes.

The import contains a legacy zero-date default on `active_check`. MySQL 8.4
initially rejected the index DDL with `ER_INVALID_DEFAULT`. The index script
temporarily removes only the two zero-date mode flags for its own connection,
keeps strict mode, then restores the previous session mode. It changes no
stored values, column defaults, or global server settings.

## Reading every EXPLAIN column

| Column | Meaning |
|---|---|
| `id` | Query block identifier. |
| `select_type` | Kind of query block; these single SELECTs use SIMPLE. |
| `table` | Table accessed by this plan row. |
| `partitions` | Partitions accessed, or NULL for this unpartitioned table. |
| `type` | Access method, such as range, ref, index, or ALL. |
| `possible_keys` | Candidate indexes the optimizer considered usable. |
| `key` | Index actually selected, or NULL. |
| `key_len` | Bytes of the chosen key used for lookup. |
| `ref` | Constants or columns compared with the lookup key. |
| `rows` | Estimated rows examined by this access. |
| `filtered` | Estimated percentage remaining after additional conditions. |
| `Extra` | Additional operations, such as condition filtering or sorting. |

These definitions follow the [MySQL EXPLAIN reference](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html).
`rows` is an estimate, not a measured count. `Using filesort` identifies an
additional sort; the name alone does not establish disk IO.
See [EXPLAIN ANALYZE](https://dev.mysql.com/doc/refman/8.4/en/explain.html) for
actual times, rows, and loop counts, and the [functional index reference](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)
for expression key parts.

## Measured results

Measured on 2026-11-16. Each entry is a median of 10 queries after one warm-up.

| Case | Query | Before (ms) | After (ms) | Estimated rows before → after |
|---|---|---:|---:|---:|
| city_beds_price | count | 64.128 | 4.751 | 4157 → 123 |
| city_beds_price | results | 17921.914 | 5.926 | 18712 → 123 |
| zip_beds_price | count | 11.683 | 2.732 | 134 → 48 |
| zip_beds_price | results | 16.648 | 8.414 | 134 → 48 |
| complex_filters | count | 48.631 | 3.478 | 67 → 48 |
| complex_filters | results | 72.805 | 4.857 | 67 → 48 |

The city listing changed from the price-only index to the normalized city
composite index. Its count query changed from the old raw-city composite index.
Both ZIP queries changed from an index merge to the new ZIP composite index.
The six-filter queries changed from a three-index merge to the ZIP composite
index; city and baths remain residual conditions. All result totals were
unchanged: 123 city matches, 48 ZIP matches, and 25 six-filter matches.

The large city-listing improvement reflects eliminating a costly price-index
scan with residual city filtering and photo-row reads on this local dataset.
It is not a general speedup claim for every query, data distribution, cache
state, or machine. The city scan estimates fell from 18,712 to 123; the index
choice and actual execution tree corroborate the timing improvement.

### city_beds_price: listing EXPLAIN

Before:

```json
[
  {
    "id": 1,
    "select_type": "SIMPLE",
    "table": "rets_property",
    "partitions": null,
    "type": "range",
    "possible_keys": "idx_rets_property_price,idx_rets_property_beds",
    "key": "idx_rets_property_price",
    "key_len": "5",
    "ref": null,
    "rows": 18712,
    "filtered": 50,
    "Extra": "Using index condition; Using where"
  }
]
```

After:

```json
[
  {
    "id": 1,
    "select_type": "SIMPLE",
    "table": "rets_property",
    "partitions": null,
    "type": "range",
    "possible_keys": "idx_rets_property_price,idx_rets_property_beds,idx_rets_property_city_normalized_beds_price",
    "key": "idx_rets_property_city_normalized_beds_price",
    "key_len": "213",
    "ref": null,
    "rows": 123,
    "filtered": 100,
    "Extra": "Using where"
  }
]
```

Before, actual execution:

```text
-> Limit: 20 row(s)  (cost=4670 rows=20) (actual time=14777..32621 rows=20 loops=1)
    -> Filter: ((rets_property.L_Keyword2 = 3) and (lower(trim(rets_property.L_City)) = 'irvine'))  (cost=4670 rows=9356) (actual time=14777..32621 rows=20 loops=1)
        -> Index range scan on rets_property using idx_rets_property_price over (300000 <= L_SystemPrice <= 1500000), with index condition: ((rets_property.L_SystemPrice >= 300000) and (rets_property.L_SystemPrice <= 1500000))  (cost=4670 rows=18712) (actual time=5.19..32459 rows=33376 loops=1)

```

After, actual execution:

```text
-> Limit: 20 row(s)  (cost=135 rows=20) (actual time=0.0643..12 rows=20 loops=1)
    -> Filter: ((rets_property.L_Keyword2 = 3) and (lower(trim(L_City)) = 'irvine') and (rets_property.L_SystemPrice >= 300000) and (rets_property.L_SystemPrice <= 1500000))  (cost=135 rows=123) (actual time=0.0624..12 rows=20 loops=1)
        -> Index range scan on rets_property using idx_rets_property_city_normalized_beds_price over (lower(trim(`L_City`)) = 'irvine' AND L_Keyword2 = 3 AND 300000 <= L_SystemPrice <= 1500000)  (cost=135 rows=123) (actual time=0.0578..11.9 rows=20 loops=1)

```

### complex_filters: listing EXPLAIN

Before:

```json
[
  {
    "id": 1,
    "select_type": "SIMPLE",
    "table": "rets_property",
    "partitions": null,
    "type": "index_merge",
    "possible_keys": "idx_L_Zip,idx_rets_property_price,idx_rets_property_beds,idx_rets_property_baths",
    "key": "idx_L_Zip,idx_rets_property_beds,idx_rets_property_baths",
    "key_len": "83,5,4",
    "ref": null,
    "rows": 67,
    "filtered": 49.81,
    "Extra": "Using intersect(idx_L_Zip,idx_rets_property_beds,idx_rets_property_baths); Using where; Using filesort"
  }
]
```

After:

```json
[
  {
    "id": 1,
    "select_type": "SIMPLE",
    "table": "rets_property",
    "partitions": null,
    "type": "range",
    "possible_keys": "idx_L_Zip,idx_rets_property_price,idx_rets_property_beds,idx_rets_property_baths,idx_rets_property_zip_beds_price,idx_rets_property_city_normalized_beds_price",
    "key": "idx_rets_property_zip_beds_price",
    "key_len": "93",
    "ref": null,
    "rows": 48,
    "filtered": 5,
    "Extra": "Using index condition; Using where"
  }
]
```

Before, actual execution:

```text
-> Limit: 20 row(s)  (cost=91.8 rows=20) (actual time=47..47.3 rows=20 loops=1)
    -> Sort row IDs: rets_property.L_SystemPrice, rets_property.id, limit input to 20 row(s) per chunk  (cost=91.8 rows=67.2) (actual time=47..47.2 rows=20 loops=1)
        -> Filter: ((rets_property.L_Keyword2 = 3) and (rets_property.L_Zip = '92618') and (lower(trim(rets_property.L_City)) = 'irvine') and (rets_property.L_SystemPrice >= 300000) and (rets_property.L_SystemPrice <= 1500000) and (rets_property.LM_Dec_3 = 3.0))  (cost=91.8 rows=67.2) (actual time=0.83..46.8 rows=25 loops=1)
            -> Intersect rows sorted by row ID  (cost=91.8 rows=67.2) (actual time=0.807..46.6 rows=47 loops=1)
                -> Index range scan on rets_property using idx_L_Zip over (L_Zip = '92618')  (cost=0.0139..3.75 rows=269) (actual time=0.191..3.7 rows=269 loops=1)
                -> Index range scan on rets_property using idx_rets_property_beds over (L_Keyword2 = 3)  (cost=840e-6..15.7 rows=18712) (actual time=0.0323..15.2 rows=18647 loops=1)
                -> Index range scan on rets_property using idx_rets_property_baths over (LM_Dec_3 = 3.0)  (cost=257e-6..4.81 rows=18712) (actual time=0.0298..22.1 rows=17493 loops=1)

```

After, actual execution:

```text
-> Limit: 20 row(s)  (cost=53.2 rows=2.4) (actual time=0.0927..12.6 rows=20 loops=1)
    -> Filter: ((lower(trim(L_City)) = 'irvine') and (rets_property.LM_Dec_3 = 3.0))  (cost=53.2 rows=2.4) (actual time=0.0911..12.6 rows=20 loops=1)
        -> Index range scan on rets_property using idx_rets_property_zip_beds_price over (L_Zip = '92618' AND L_Keyword2 = 3 AND 300000 <= L_SystemPrice <= 1500000), with index condition: ((rets_property.L_Keyword2 = 3) and (rets_property.L_Zip = '92618') and (rets_property.L_SystemPrice >= 300000) and (rets_property.L_SystemPrice <= 1500000))  (cost=53.2 rows=48) (actual time=0.0854..12.5 rows=41 loops=1)

```

### All timed samples (milliseconds)

The six-filter baseline was measured separately using `complex_filters` after
selecting a bathroom value present in the data (3 baths). The city and ZIP
baseline entries were captured before the same two indexes were created.
No database server settings were tuned between the before/after measurements.

| Case / query | Before samples | After samples |
|---|---|---|
| city_beds_price / count | 70.282, 73.884, 55.548, 57.465, 56.932, 57.775, 66.22, 71.237, 63.12, 65.136 | 5.436, 5.533, 4.369, 3.677, 5.823, 5.119, 4.553, 4.949, 4.284, 3.568 |
| city_beds_price / results | 35170.502, 41527.767, 26131.664, 17798.953, 16204.97, 17794.517, 18044.874, 17344.401, 18046.415, 16151.86 | 5.096, 13.775, 7.383, 6.253, 5.599, 5.142, 8.075, 12.151, 5.513, 4.715 |
| zip_beds_price / count | 11.24, 12.559, 11.124, 13.606, 12.71, 9.015, 11.627, 10.592, 11.739, 12.854 | 2.92, 2.796, 3.854, 2.78, 2.743, 2.434, 2.36, 2.487, 2.483, 2.721 |
| zip_beds_price / results | 17.571, 12.087, 12.7, 15.394, 13.635, 20.536, 18.878, 17.767, 20.593, 15.725 | 5.52, 6.833, 8.512, 12.771, 7.852, 8.814, 8.317, 7.975, 13.749, 9.526 |
| complex_filters / count | 51.663, 41.711, 32.472, 33.086, 42.938, 52.3, 52.947, 64.314, 54.738, 45.6 | 3.777, 3.217, 2.913, 3.628, 4.274, 4.069, 4.376, 3.327, 3.161, 2.958 |
| complex_filters / results | 80.394, 68.266, 52.778, 51.925, 79.7, 85.432, 109.071, 68.296, 77.314, 60.781 | 5.258, 6.188, 382.072, 4.29, 3.855, 3.127, 4.456, 4.027, 9.031, 8.957 |


## Reproduce

From the repository's backend directory, with a valid local `.env`:

```powershell
docker start idx-mysql-week9
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3307'
$env:DB_USER = 'root'
$env:DB_NAME = 'rets'
node scripts/benchmarkPropertySearch.js
```

The benchmark is read-only and never adds or removes indexes. On a database
without the Week 9 indexes, capture its output, review and apply
`backend/sql/week9_property_indexes.sql` once, then capture another run.
Check `SHOW INDEX FROM rets_property` first to avoid duplicate index names.
The SQL file includes optional rollback statements for just the two Week 9
indexes. Do not remove pre-existing indexes to reproduce this measurement.

## Request logging

The existing middleware records a monotonic start time and logs on response
`finish`: timestamp, method, URL, HTTP status, and elapsed milliseconds.
The existing logger test verifies this behavior. No duplicate timer or logging
dependency was added.

Observed live requests included:

```text
[2026-11-16T21:37:19.884Z] GET /api/properties?city=Irvine&beds=3&sortBy=L_SystemPrice&sortOrder=desc&limit=20&offset=0 200 79.6ms
[2026-11-16T21:38:44.331Z] GET /api/properties?sortBy=ListPrice 400 1.3ms
```

These are complete server middleware response durations and are separate from
the SQL-only benchmark table above.
