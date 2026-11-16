## Week 9: Advanced Feature — Sorting & Performance Optimization

### Goal

Fully implement Option 1: Sorting, and complete the required performance
optimization tasks.

### Completed Work

- Added price, date listed, square footage, and bedroom sorting in both directions.
- Extended the existing property search endpoint with validated sorting parameters.
- Used actual SQL column names in the whitelist and rejected invalid inputs with HTTP 400.
- Added a stable ID tie-breaker to keep equal-valued records in a consistent order.
- Added a sorting dropdown to the listings page.
- Stored sorting in the URL to preserve it across pagination, refreshes, browser history, and detail-page return navigation.
- Reset sorting and pagination when Search or Clear Filters is submitted.
- Preserved submitted filters and sorting during retries and rapid interactions.
- Prevented outdated responses from overwriting newer searches.
- Fixed a quick Search-then-Sort race by recording submitted conditions synchronously.
- Captured and documented EXPLAIN and EXPLAIN ANALYZE output.
- Added and measured two composite indexes for normalized city and ZIP filter combinations.
- Reused and verified the existing request logger with response time in milliseconds.
- Added a React Error Boundary with retry and return-to-listings recovery.
- Verified the development application without browser console warnings or errors.

### Sorting API

Endpoint: `GET /api/properties`

| Query parameter | Accepted values |
|---|---|
| `sortBy` | `L_SystemPrice`, `ListingContractDate`, `LM_Int2_3`, `L_Keyword2` |
| `sortOrder` | `asc`, `desc` |

Example:

```text
GET /api/properties?city=Irvine&sortBy=L_SystemPrice&sortOrder=asc&limit=20&offset=0
```

Without sorting parameters, the existing `id ASC` order is preserved.
With only `sortBy`, the direction defaults to `asc`. A selected sort adds
`id ASC` as the tie-breaker. SQL NULL values retain MySQL's normal ordering.

Unsupported fields, empty values, repeated sorting parameters, invalid directions,
and `sortOrder` without `sortBy` return HTTP 400. Filter values still use SQL
placeholders. Sorting identifiers are interpolated only after whitelist validation.

The response retains `total`, `limit`, `offset`, and `results`. Listing rows now
also include `ListingContractDate`.

### Performance Results

Measured against MySQL 8.4.11 with the existing 55,212-property dataset.
Each value is the median of 10 queries after one untimed warm-up.

| Filter combination | Query | Before (ms) | After (ms) |
|---|---|---:|---:|
| City + beds + price | Count | 64.128 | 4.751 |
| City + beds + price | Listings | 17921.914 | 5.926 |
| ZIP + beds + price | Count | 11.683 | 2.732 |
| ZIP + beds + price | Listings | 16.648 | 8.414 |
| All six filters | Count | 48.631 | 3.478 |
| All six filters | Listings | 72.805 | 4.857 |

The city listing query's estimated scanned rows fell from 18,712 to 123.
These local client-side query measurements include result transfer and decoding;
they are not complete HTTP timings or production performance guarantees.

Full query plans, column explanations, actual execution trees, individual samples,
index rationale, and reproduction steps are in the
[Week 9 performance report](https://github.com/yikangli-merry/IDX-Exchange-SDE/blob/main/docs/week9-performance.md).

### Database Setup for This Verification

The existing Windows MySQL service uses port 3306. Verification used
`idx-mysql-week9` on `127.0.0.1:3307`, sharing the stopped `idx-mysql-local`
container's existing data volume. Do not run both containers at the same time.

Existing passwords and environment files were preserved. In a backend terminal:

```powershell
docker start idx-mysql-week9
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3307'
$env:DB_USER = 'root'
$env:DB_NAME = 'rets'
npm.cmd run dev
```

This uses the existing local `.env` password. In another frontend terminal,
run `npm.cmd start` and open `http://localhost:3000`.

On a different checkout, use its own configured MySQL database and port.
Do not rerun CREATE INDEX statements for index names that already exist.
The SQL script handles the imported legacy zero-date default for its DDL
connection only and restores the original session SQL mode.

### Files Added

- `frontend/src/components/SortControls.jsx`
- `frontend/src/components/ErrorBoundary.jsx`
- `frontend/src/components/ErrorBoundary.test.jsx`
- `backend/sql/week9_explain.sql`
- `backend/sql/week9_property_indexes.sql`
- `backend/scripts/benchmarkPropertySearch.js`
- `docs/week9-performance.md`
- `docs/week9-readme.md` — this Week 9 section as a standalone copyable document.

Existing backend search logic and tests, listings and navigation tests, app routing,
styles, and the root README were updated. No third-party dependencies were added.

### Validation Results

- Backend: 25 tests passing.
- Frontend: 187 tests passing across 13 suites.
- Production build: compiled successfully.
- Live integration: 19 checks passed against the real API and database.
- All four sorting fields in both directions matched independent SQL across two pages, with no repeated IDs.
- Actual HTTP 400 responses, normalized city matching, and empty results were verified.
- Browser checks covered price ordering, pagination, detail return, refresh, filter reset, and rapid Search-then-Sort.
- Responsive checks at 390px, 800px, and 1280px passed without page-level horizontal overflow.
- The development browser reported no console warnings or errors.
- Error Boundary tests covered render failures, retry, preserved page shell, and navigation recovery.

The existing CRA 5 toolchain still emits terminal-only dependency deprecation
notices under Node 24 (`fs.F_OK` and webpack-dev-server middleware options).
These were not suppressed; the application build succeeds and the browser checks
above are separate from those toolchain notices.

### Week 9 Demo Checklist

1. Apply a city filter and show price sorting in both directions.
2. Demonstrate date listed, square footage, and bedroom sorting.
3. Navigate to page two, refresh, and open a property.
4. Return to listings and show that sorting, filters, and the page are retained.
5. Submit or clear filters and show that sorting resets.
6. Request an unsupported sort field and show HTTP 400.
7. Show the Error Boundary tests and recovery interface implementation.
8. Explain the two composite indexes and the before/after execution plans.
9. Show request logs containing response time in milliseconds.
10. Run automated tests and the production build.

### Week 9 Checkpoint

- [x] Sorting is fully functional for all four supported fields.
- [x] Invalid sorting parameters return HTTP 400.
- [x] Sorting persists across page changes.
- [x] Sorting resets when filters are submitted or cleared.
- [x] EXPLAIN output and column meanings are documented.
- [x] Composite indexes are added and supported by measured results.
- [x] Request logging includes response time in milliseconds.
- [x] Error Boundary is implemented and tested.
- [x] Development browser checks show no console warnings or errors.
- [x] Updated automated tests and production build pass.
