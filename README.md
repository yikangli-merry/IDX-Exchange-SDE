# 2026 Fall - SDE Internship Project

This repository contains the local setup for a real estate property listings project. The final project goal is to build a searchable, filterable, paginated property listings application using React, Node.js/Express, and MySQL, with support for property detail pages and open house schedules.

## Week 1: Environment Setup & Database Import

Week 1 focused on setting up the local MySQL database environment. The goal was to run MySQL 8 in Docker, import the required SQL files, and verify that the database tables were ready for backend development.

### Goal

By the end of Week 1:

- MySQL 8 should run in Docker.
- The Docker container should be named `idx-mysql-local`.
- MySQL should be available on local port `3306`.
- The database should be named `rets`.
- The `rets_property` and `rets_openhouse` tables should exist and contain data.

### Completed Work

The following Week 1 tasks have been completed:

- Installed and started Docker Desktop.
- Created a MySQL 8 Docker container named `idx-mysql-local`.
- Created the local database `rets`.
- Imported `source/rets_property.sql`.
- Imported `source/rets_openhouse.sql`.
- Verified that both required tables exist.
- Verified that both tables contain data.

Verified row counts:

```text
rets_property: 55212 rows
rets_openhouse: 13433 rows
```

### Start The Database

```powershell
cd D:\idx_exchange\sde_project
docker start idx-mysql-local
docker ps
```

### Connect To MySQL

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

Local development password:

```text
idxlocal123
```

### Verify The Database

```sql
SHOW TABLES;
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
```

Expected tables:

```text
rets_property
rets_openhouse
```

### Important Table Notes

`rets_property` stores property listing data. `rets_openhouse` stores open house event data. The two tables can be connected through `L_ListingID`.

Important `rets_property` columns:

```text
L_ListingID: property listing ID
L_Address: property address
L_City: city
L_State: state
L_Zip: ZIP code
L_SystemPrice: listing price
L_Keyword2: number of bedrooms
LM_Dec_3: number of bathrooms
LM_Int2_3: living area / square footage
```

This database uses RETS-style column names:

```text
price -> L_SystemPrice
beds -> L_Keyword2
baths -> LM_Dec_3
sqft -> LM_Int2_3
```

### Notes

- The original SQL files are stored in the `source/` directory.
- The MySQL Docker container is named `idx-mysql-local`.
- The database name is `rets`.
- Docker is used to keep the local database environment consistent.
- If port `3306` is already in use, the local Windows service `MySQL80` may need to be stopped first.



## Week 2: Backend Foundation & REST API Basics

Week 2 focuses on creating a basic Node.js/Express backend server and connecting it to the local MySQL database from Week 1.

### Goal

By the end of Week 2:

- The backend server should run on port `5000`.
- The backend should connect to the MySQL database `rets`.
- A `GET /api/health` endpoint should check database connectivity.
- The server should handle database errors without crashing.

### Completed Work

The following Week 2 tasks have been completed:

- Created a new `backend/` folder.
- Initialized a Node.js project.
- Installed `express`, `mysql2`, `dotenv`, and `cors`.
- Installed `nodemon` as a development dependency.
- Added `npm run dev` and `npm start` scripts.
- Created a MySQL connection pool.
- Created the `GET /api/health` endpoint.
- Added `.env.example` for environment variable reference.
- Added `.gitignore` rules for `.env`, `node_modules/`, and large SQL files.
- Tested both connected and disconnected database states.
- Pushed the Week 2 backend code to GitHub.

### Backend Files

Important backend files:

```text
backend/package.json
backend/.env.example
backend/src/db.js
backend/src/server.js
```

### Environment Variables

Example backend configuration:

```
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=rets
DB_CONNECTION_LIMIT=10
```

The real .env file is kept locally and is not committed to GitHub.

### Run The Backend

Go to the backend folder:

```npm install```

Start the development server:

```npm run dev```

Expected output:

```Server running on port 5000```

### Health Check API

Endpoint:

```GET /api/health```

When MySQL is connected:

```
{
  "status": "ok",
  "database": "connected"
}
```

When MySQL is unreachable:

```
{
  "status": "error",
  "database": "disconnected"
}
```

In the disconnected case, the API returns HTTP 500, but the server does not crash.

### Week 2 Demo Checklist

For the Week 2 demo, show:
1. The ```backend/``` folder.
2. ```package.json``` dependencies and scripts.
3. ```backend/src/db.js``` connection pool.
4. ```backend/src/server.js``` health check route.
5. The server running with ```npm run dev```.
6. ```/api/health``` returning the correct response.

### Notes

- The backend uses port ```5000```.
- The database name is ```rets```.
- ```.env``` and ```node_modules/``` are not committed.
- Large SQL files are not uploaded to GitHub.



## Week 3: Property Search Endpoint with Filters & Indexing

Week 3 adds the main property search API: a paginated and filterable `GET /api/properties` endpoint backed by parameterized SQL and database indexes.

### Goal

- Add `GET /api/properties`.
- Support pagination with `limit` and `offset`.
- Support filters for city, ZIP code, price, bedrooms, and bathrooms.
- Validate bad query parameters with HTTP 400.
- Use parameterized SQL for all user input.
- Add indexes and verify them with `EXPLAIN`.

### Completed Work

- Added `backend/src/app.js` to mount `/api/health` and `/api/properties`.
- Kept `backend/src/server.js` focused on starting the server.
- Added `backend/src/routes/properties.js` for the properties route.
- Added `backend/src/services/propertySearch.js` for validation and query building.
- Added unit tests for pagination, invalid inputs, and combined filters.
- Added SQL scripts for Week 3 indexes and `EXPLAIN` checks.

### Backend Files

```text
backend/src/app.js
backend/src/server.js
backend/src/routes/properties.js
backend/src/services/propertySearch.js
backend/test/propertySearch.test.js
backend/sql/week3_property_indexes.sql
backend/sql/week3_explain.sql
```

### API

Endpoint:

```text
GET /api/properties
```

Supported query parameters:

```text
city, zipcode, minPrice, maxPrice, beds, baths, limit, offset
```

Defaults:

```text
limit=20
offset=0
```

Example request:

```text
GET /api/properties?city=Irvine&minPrice=300000&beds=3&limit=20&offset=0
```

Example response shape:

```json
{
  "total": 87,
  "limit": 20,
  "offset": 0,
  "results": []
}
```

### Validation And Field Mapping

- `limit` must be an integer from `1` to `100`.
- `offset` must be an integer greater than or equal to `0`.
- `minPrice`, `maxPrice`, and `baths` must be non-negative numbers.
- `beds` must be a non-negative integer.
- Empty, repeated, or unsupported query parameters return HTTP 400.

```text
city -> L_City
zipcode -> L_Zip
minPrice -> L_SystemPrice
maxPrice -> L_SystemPrice
beds -> L_Keyword2
baths -> LM_Dec_3
sqft -> LM_Int2_3
```

The city filter uses `LOWER(TRIM(L_City)) = LOWER(TRIM(?))` to handle inconsistent casing and extra spaces.

### SQL Safety

The endpoint builds SQL from known column names and passes all user values through `?` placeholders. User input is treated as data, not executable SQL.

### Indexes And EXPLAIN

Week 3 adds indexes for `L_SystemPrice`, `L_Keyword2`, `LM_Dec_3`, and `(L_City, L_SystemPrice, L_Keyword2)`.

Run indexes:

```powershell
cd D:\idx_exchange\sde_project
Get-Content backend/sql/week3_property_indexes.sql | docker exec -i idx-mysql-local mysql -uroot -pidxlocal123 rets
```

Run `EXPLAIN` checks:

```powershell
cd D:\idx_exchange\sde_project
Get-Content backend/sql/week3_explain.sql | docker exec -i idx-mysql-local mysql -uroot -pidxlocal123 rets
```

Check the `key`, `rows`, and `Extra` columns. For indexed queries, `key` should not be `NULL`.

### Run And Test

```powershell
cd D:\idx_exchange\sde_project\backend
npm install
npm run dev
```

```text
GET http://localhost:5000/api/properties
GET http://localhost:5000/api/properties?limit=10&offset=20
GET http://localhost:5000/api/properties?city=Irvine
GET http://localhost:5000/api/properties?city=Irvine&minPrice=300000&beds=3
GET http://localhost:5000/api/properties?limit=-20
```

Run unit tests:

```powershell
npm test
```

### Week 3 Demo Checklist

1. `backend/src/app.js` mounting both `/api/health` and `/api/properties`.
2. `backend/src/services/propertySearch.js` building parameterized dynamic queries.
3. Invalid inputs returning HTTP 400.
4. `npm test` passing.
5. `/api/properties` returning 20 properties by default.
6. `/api/properties?limit=10&offset=20` returning properties 21-30.
7. `/api/properties?city=Irvine` returning only Irvine properties.
8. `/api/properties?city=Irvine&minPrice=300000&beds=3` combining filters correctly.
9. `EXPLAIN` showing an index in the `key` column for indexed searches.

### Notes

- Week 3 is backend-only.
- MySQL or Docker Desktop must be running before API and `EXPLAIN` checks.
- If database login fails, confirm `backend/.env` matches local MySQL credentials.
- `beds` and `baths` use exact matching.

## Week 4: Property Detail & Open House Endpoints

Week 4 adds backend support for property detail pages and open house schedules. The goal is to let the frontend request one property by listing ID, then request the open house events connected to that same property.

### Goal

- Add `GET /api/properties/:id`.
- Add `GET /api/properties/:id/openhouses`.
- Validate listing IDs before querying the database.
- Return helpful `400`, `404`, and `500` responses.
- Add request logging for method, URL, timestamp, status code, and response time.
- Keep route order correct so the open houses endpoint is matched before the dynamic `/:id` endpoint.

### Completed Work

- Added property detail lookup by `L_ListingID`.
- Added open house lookup by `L_ListingID`.
- Added validation for invalid listing IDs.
- Added `404` handling when a property does not exist.
- Added request logging middleware.
- Added unit tests for validation, SQL query building, property lookup, open house lookup, and logging.
- Verified the local MySQL Docker container is running.
- Verified the API works against the local `rets` database.

### Backend Files

```text
backend/src/app.js
backend/src/routes/properties.js
backend/src/middleware/requestLogger.js
backend/src/services/propertyDetails.js
backend/test/propertyDetails.test.js
backend/test/requestLogger.test.js
```

### API

Property detail endpoint:
```GET /api/properties/:id```

Example:
```GET http://localhost:5000/api/properties/1178585070```

This returns one full property object from rets_property.

Open houses endpoint:
```GET /api/properties/:id/openhouses```

Example:
```GET http://localhost:5000/api/properties/1178585070/openhouses```

This returns an array of open house events from ```rets_openhouse```. An empty array is valid if the property exists but has no open house events.

### Validation And Error Handling

- ```:id``` must be a numeric listing ID.
- Invalid IDs return HTTP 400.
- Unknown property IDs return HTTP 404.
- Database or server errors return HTTP 500.
- Open house events are ordered by ```OpenHouseDate```, ```OH_StartTime```, and ```id```.

Example invalid ID response:
```
{
  "error": "\"id\" must be a numeric listing ID."
}
```

Example missing property response:
```
{
  "error": "Property not found for listing ID 999999999999999."
}
```

### Route Order Note

The ```/api/properties/:id/openhouses``` route must be registered before ```/api/properties/:id```.
Express checks routes in the order they are defined. If ```/:id``` is registered first, Express may treat ```/1178585070/openhouses``` incorrectly as part of the dynamic ID route.

### Request Logging

Every request prints one log line in the terminal with:
```timestamp, method, URL, status code, response time```

Example:
```[2026-10-13T02:48:11.488Z] GET /api/properties/1178585070/openhouses 200 5.0ms```

### Run And Test

Start the database:
```docker start idx-mysql-local```
Start the backend:
```cd D:\idx_exchange\sde_project\backend
npm run dev
```
Manual test URLs:
```GET http://localhost:5000/api/health
GET http://localhost:5000/api/properties/1178585070
GET http://localhost:5000/api/properties/1178585070/openhouses
GET http://localhost:5000/api/properties/not-a-number
GET http://localhost:5000/api/properties/999999999999999
```
Run unit tests:
```npm test```
Current test result:
```14 tests passing```

### Week 4 Demo Checklist

1. Show ```GET /api/properties/:id``` returning one full property.
2. Show ```GET /api/properties/:id/openhouses``` returning open house events.
3. Show invalid ID returning HTTP 400.
4. Show unknown ID returning HTTP 404.
5. Show request logs in the terminal.
6. Show that open house events are ordered by date and start time.
7. Explain why ```/openhouses``` must be registered before ```/:id```.
8. Run ``npm test``` and show all tests passing.

### Notes

- Week 4 is backend-only.
- Property lookup uses ```L_ListingID```, not the database auto-increment ```id```.
- The ```rets_property``` and ```rets_openhouse``` tables connect through ```L_ListingID```.
- The ```all_data``` column in ```rets_openhouse``` is returned as-is and is not parsed in the backend.
- MySQL or Docker Desktop must be running before API testing.

## Week 5: React Setup & Listings Page

Week 5 adds a React frontend that fetches property listings from the Express API and displays them in a responsive grid. The frontend uses Create React App and connects to the existing backend through a development proxy.

### Goal

- Create a React app in the `frontend/` folder.
- Run the frontend on port `3000`.
- Proxy `/api/*` requests to the Express server on port `5000`.
- Display property photos, prices, addresses, city/state, beds, baths, and square footage.
- Handle loading states, API errors, and missing photos.
- Display the number of properties shown and the total count.

### Completed Work

- Created the frontend using React and Create React App.
- Added a reusable API client for property list and detail requests.
- Added `ListingsPage` and `PropertyCard` components.
- Added a responsive grid with card hover effects.
- Added loading, error, retry, and empty-result states.
- Added defensive photo parsing and image loading fallbacks.
- Added Jest and React Testing Library tests.
- Verified the frontend against the local `rets` database.
- Pushed the Week 5 code to GitHub.

### Frontend Files

```text
frontend/package.json
frontend/package-lock.json
frontend/public/index.html
frontend/src/index.js
frontend/src/App.js
frontend/src/styles.css
frontend/src/setupTests.js
frontend/src/api/client.js
frontend/src/api/client.test.js
frontend/src/components/PropertyCard.jsx
frontend/src/components/PropertyCard.test.jsx
frontend/src/pages/ListingsPage.jsx
frontend/src/pages/ListingsPage.test.jsx
frontend/src/utils/propertyPhotos.js
frontend/src/utils/propertyPhotos.test.js
```

### API Client

The API client exports:

```javascript
fetchProperties(params)
fetchPropertyDetail(id)
```

The listings page requests:

```text
GET /api/properties?limit=20&offset=0
```

It uses the existing response shape:

```json
{
  "total": 55212,
  "limit": 20,
  "offset": 0,
  "results": []
}
```

The page uses `results.length` and `total` to display the property count:

```text
Showing 20 of 55,212 properties
```

HTTP errors include the response status and backend error message when available. Network failures display a connection error, and the page provides a `Try again` button.

### Photo Handling

`L_Photos` is stored as a JSON string. The frontend parses it inside `try/catch` and displays the first photo URL.

The parser handles:

- Missing and null values.
- Empty strings.
- Malformed JSON.
- Non-array JSON values and empty arrays.
- Invalid first photo values or URLs.

A placeholder appears when no usable photo is available or when the remote image fails to load.

The local database audit found `211` properties with an empty-string `L_Photos` value. These properties display the placeholder without crashing the page.

Missing property statistics display a dash. Missing or zero listing prices display `Price unavailable`, while zero bedrooms remain visible as `0`.

### Run And Test

If the Windows `MySQL80` service is using port `3306`, stop it from an administrator PowerShell window before starting the Docker database:

```powershell
Stop-Service MySQL80
```

Start the database:

```powershell
docker start idx-mysql-local
```

Start the backend:

```powershell
cd D:\idx_exchange\sde_project\backend
npm install
npm run dev
```

In another terminal, start the frontend:

```powershell
cd D:\idx_exchange\sde_project\frontend
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Run backend tests:

```powershell
cd D:\idx_exchange\sde_project\backend
npm test
```

Run frontend tests and create a production build:

```powershell
cd D:\idx_exchange\sde_project\frontend
npm test -- --watchAll=false --runInBand
npm run build
```

Verified results:

```text
Backend: 14 tests passing
Frontend: 40 tests passing across 4 test suites
Production build: compiled successfully
```

### Week 5 Demo Checklist

1. Show the frontend running on port `3000`.
2. Show property cards with real database photos, prices, addresses, and statistics.
3. Show the property count above the grid.
4. Show a placeholder for a property with no photos.
5. Demonstrate the card hover effect and responsive layout.
6. Stop the backend and reload the page to show the error state.
7. Restart the backend and click `Try again` to restore the listings.
8. Run the tests and production build.

### Notes

- React requests data through Express and never connects directly to MySQL.
- The development proxy is configured at the top level of `frontend/package.json`.
- The proxy setting only applies during local development.
- Existing backend endpoints and database tables were reused.
- `.env`, `node_modules/`, frontend build output, and coverage output are excluded from Git.
- Search controls, pagination controls, and the property detail page are reserved for later weeks.

## Week 6: Filters UI + Introduction to Testing

Week 6 adds a filter form to the property listings page and expands the frontend unit tests. The work reuses the existing property search API and supports combined filters, clearing searches, and safe handling of overlapping requests.

### Goal

- Add a `PropertyFilters` component with six controlled inputs.
- Search by city, ZIP code, price range, bedrooms, and bathrooms.
- Combine multiple filters in one request.
- Clear the form and reload the unfiltered listings.
- Omit empty filter values from API requests.
- Prevent outdated requests from replacing the latest results.
- Write unit tests for the API client and filter component.

### Completed Work

- Added all six filter inputs using one React state object.
- Integrated Search and Clear Filters with `ListingsPage`.
- Added responsive form styles for desktop, tablet, and mobile layouts.
- Added price range validation and preserved leading zeros in ZIP codes.
- Trimmed text values and removed empty query parameters.
- Preserved valid zero values in API requests.
- Improved the empty-result message with guidance to adjust or clear filters.
- Added request cancellation and sequence IDs to prevent stale updates.
- Kept retries tied to the last submitted filters, including after draft edits.
- Expanded API client tests and added filter component tests.
- Added regression tests for overlapping searches, clearing, and React StrictMode.
- Verified the API against the existing property database through the frontend proxy.

### Frontend Files

New files:

```text
frontend/src/components/PropertyFilters.jsx
frontend/src/components/PropertyFilters.test.jsx
```

Updated files:

```text
frontend/src/pages/ListingsPage.jsx
frontend/src/pages/ListingsPage.test.jsx
frontend/src/api/client.js
frontend/src/api/client.test.js
frontend/src/styles.css
README.md
```

### Filter Form

| Input | API Parameter | Behavior |
| --- | --- | --- |
| City | `city` | Case-insensitive city matching |
| ZIP Code | `zipcode` | Text input that preserves leading zeros |
| Min Price | `minPrice` | Inclusive, non-negative minimum price |
| Max Price | `maxPrice` | Inclusive, non-negative maximum price |
| Beds | `beds` | Exact matching; Any or 0 through 10 |
| Baths | `baths` | Exact matching; Any or 0 through 10 in increments of 0.5 |

All six values are stored in one React state object. Typing updates the draft form; clicking Search submits a snapshot and loads matching properties.

The form rejects a minimum price greater than the maximum price. Clear Filters resets all six inputs, clears validation messages, and reloads the first page without search filters.

Search and Clear Filters remain available while requests are loading. Try again repeats the last submitted search, even if the user has since edited the draft form.

### API Requests

The existing endpoint is reused:

```text
GET /api/properties
```

Supported filter parameters:

```text
city, zipcode, minPrice, maxPrice, beds, baths
```

Example request combining all six filters:

```text
GET /api/properties?city=Beverly+Hills&zipcode=90210&minPrice=3950000&maxPrice=3950000&beds=4&baths=5&limit=20&offset=0
```

Clearing filters requests:

```text
GET /api/properties?limit=20&offset=0
```

Empty strings, whitespace-only strings, `null`, and `undefined` values are omitted. Valid numeric and string zero values remain in the request.

The response shape remains unchanged:

```json
{
  "total": 0,
  "limit": 20,
  "offset": 0,
  "results": []
}
```

The example shows an empty search result. Matching searches return property objects inside `results` and the corresponding total count.

### Debug Challenge: Outdated Search Results

Requests can finish in a different order from the order in which they were started. Without protection, an older search or clear request could replace newer results, display an outdated error, or finish the loading state too early. Reading state immediately after `setState` can also use the previous filter values.

The fix:

- Pass an explicit filter snapshot to each request.
- Invalidate the previous request synchronously using a sequence ID.
- Cancel the previous request with `AbortController`.
- Allow only the latest request to update results, count, errors, and loading.
- Invalidate and cancel active requests when the page unmounts.
- Request empty filters directly when Clear Filters is clicked.

Regression tests control request completion order and verify stale success and error responses both before and after the latest search finishes. The mock requests intentionally ignore cancellation so the sequence guard is tested independently.

### Unit Testing And Mocking

A unit test checks a small piece of behavior in isolation, such as query parameter handling or form submission.

Mocking replaces a dependency with a controlled test version. API client tests use `jest.fn()` to mock `global.fetch`.

Mocking `fetch()` lets tests:

- Run without starting Express or MySQL.
- Inspect the request URL and abort signal.
- Return predictable property data.
- Simulate HTTP errors, network failures, and cancellation.

Component tests use Jest and React Testing Library to check rendered controls and user interactions. Listings page tests mock the API client and use deferred promises to reproduce request races reliably.

### Run And Test

Start Docker Desktop, then start the database:

```powershell
docker start idx-mysql-local
```

If Windows `MySQL80` occupies port `3306`, stop it from an administrator PowerShell window before starting the Docker database:

```powershell
Stop-Service MySQL80
```

Start the backend:

```powershell
cd D:\idx_exchange\sde_project\backend
npm run dev
```

In another terminal, start the frontend:

```powershell
cd D:\idx_exchange\sde_project\frontend
npm start
```

Open:

```text
http://localhost:3000
```

Run backend tests:

```powershell
cd D:\idx_exchange\sde_project\backend
npm test
```

Run frontend tests and create a production build:

```powershell
cd D:\idx_exchange\sde_project\frontend
npm test -- --watchAll=false --runInBand
npm run build
```

Verified results:

```text
Backend: 14 tests passing
Frontend: 60 tests passing across 5 test suites
API client: 16 tests passing
PropertyFilters: 7 tests passing
ListingsPage: 13 tests passing
Production build: compiled successfully
Real database: 64 filter presence/absence combinations matched independent SQL checks
Additional API checks: empty results, zero values, and invalid price ranges passed
Browser checks: search, clear, validation, empty results, error recovery, and rapid search sequences passed
Responsive checks: 390px, 800px, and 1280px layouts passed without horizontal overflow
```

Database verification used an isolated copy of the existing 55,212-row database on port `3307` because the Windows MySQL service occupied port `3306`. The backend used a process-only `DB_PORT` override; the original database, `.env`, and default configuration were preserved. Temporary verification services and the copied database were removed after testing.

### Week 6 Demo Checklist

1. Show all six filter inputs.
2. Search by city and ZIP code.
3. Search using price, beds, and baths.
4. Combine multiple filters in one request.
5. Confirm empty filters are absent from the request URL.
6. Clear the form and restore the unfiltered first page.
7. Show the helpful message when no properties match.
8. Quickly search, clear, and search again without stale results.
9. Run all tests and the production build.
10. Explain unit tests, mocking, and why `fetch()` is mocked.

### Week 6 Checkpoint

- [x] Filter combinations return matching results.
- [x] Clear Filters works correctly in repeated search sequences.
- [x] Empty filter values are not sent to the API.
- [x] API client tests cover success and error paths.
- [x] The filter component has at least three unit tests.
- [x] All tests pass.
- [x] The production build succeeds.
- [x] Local files and GitHub are synchronized.

### Notes

- Search uses the existing backend endpoint and database tables.
- Beds and baths use exact matching.
- Requests continue to use `limit=20` and `offset=0`.
- Pagination controls and property detail pages remain future work.
- Unit tests use mocks and do not require a running database.
- Manual API verification requires Docker, MySQL, and Express.

## Week 7: Pagination UI & Component Testing

Week 7 adds reusable pagination controls to the property listings page and expands component tests. Pagination reuses the existing property search API and preserves submitted filters between pages.

### Goal

- Maintain `currentPage` and `itemsPerPage` in `ListingsPage`.
- Display Previous, Next, numbered pages, and ellipses.
- Preserve submitted filters when changing pages.
- Reset to page 1 when searching or clearing filters.
- Scroll to the top when the page changes.
- Display the current result range and total count.
- Test pagination boundaries and filter interactions.

### Completed Work

- Added a reusable `Pagination` component.
- Fixed the page size at 20 properties.
- Connected page changes to the existing `limit` and `offset` parameters.
- Added current-page highlighting and accessible button labels.
- Disabled Previous on the first page and Next on the last page.
- Hid pagination for empty results, single-page results, loading, and errors.
- Added ellipses for large page counts.
- Prevented duplicate first and last page numbers.
- Updated the results summary to show the displayed range.
- Preserved submitted filters independently of draft form edits.
- Kept retries tied to the failed request's filters and page.
- Preserved request cancellation and protection against stale responses.
- Added responsive pagination styles and regression tests.

### Frontend Files

New files:

```text
frontend/src/components/Pagination.jsx
frontend/src/components/Pagination.test.jsx
```

Updated files:

```text
frontend/src/pages/ListingsPage.jsx
frontend/src/pages/ListingsPage.test.jsx
frontend/src/styles.css
```

### Pagination Component

Component interface:

```jsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>
```

Pagination appears below the property grid.

- Previous is disabled on page 1.
- Next is disabled on the last page.
- Clicking a numbered button requests that page.
- Clicking the current page does not repeat the request.
- The selected page uses `aria-current="page"`.
- Ellipses are non-interactive.
- Pagination is hidden when there is no more than one page.

For up to seven pages, all page numbers are displayed. Larger ranges use a window around the current page.

Examples with 24 total pages:

```text
Near the start:  1 2 3 4 5 … 24
In the middle:  1 … 4 5 6 … 24
Near the end:   1 … 20 21 22 23 24
```

The first and last page numbers each appear exactly once.

### API Requests And Results Summary

The existing endpoint is reused:

```text
GET /api/properties
```

Pagination calculations:

```javascript
limit = itemsPerPage;
offset = (currentPage - 1) * itemsPerPage;
totalPages = Math.ceil(total / itemsPerPage);
```

Examples:

```text
Page 1: GET /api/properties?limit=20&offset=0
Page 2: GET /api/properties?limit=20&offset=20
Page 3: GET /api/properties?limit=20&offset=40
```

Filtered page 2:

```text
GET /api/properties?city=Irvine&limit=20&offset=20
```

The response shape remains unchanged:

```json
{
  "total": 487,
  "limit": 20,
  "offset": 20,
  "results": []
}
```

The results summary uses the requested offset and actual number of returned properties:

```text
First page:   Showing 1–20 of 487 properties
Second page:  Showing 21–40 of 487 properties
Last page:    Showing 481–487 of 487 properties
Empty result: Showing 0–0 of 0 properties
```

The summary is hidden during loading and errors.

### Filters, Scrolling, And Retry Behavior

Typing changes the draft filter form. Clicking Search submits the filters and requests page 1.

Changing pages uses the last submitted filters, even if the user has edited the draft form. Clear Filters resets the form and requests the unfiltered first page.

Actual page changes call:

```javascript
window.scrollTo(0, 0);
```

The initial load and repeated clicks on the current page do not trigger scrolling.

Try again repeats the failed request's page and submitted filters. New requests cancel previous requests, and sequence IDs prevent stale results, errors, or loading updates from replacing the latest search.

### Debug Challenge: Duplicate Page Numbers

A naive page-number implementation can append a boundary page that is already present in the visible range, producing duplicate first or last page numbers.

The implementation handles three separate large-range cases:

- Near the start: the first five pages and the last page.
- In the middle: the first page, the current page and its neighbors, and the last page.
- Near the end: the first page and the last five pages.

Regression tests cover ranges of 8, 24, and 2,761 pages. They verify that:

- Page 1 appears exactly once.
- The last page appears exactly once.
- The current page is present.
- Numbers remain strictly increasing.
- No page number is outside the valid range.

### Component Testing

Tests use Jest and React Testing Library.

`Pagination` tests use `fireEvent.click()` to verify numbered buttons, Previous, Next, disabled boundaries, current-page behavior, and ellipsis rendering.

`ListingsPage` tests mock the API client and verify request parameters, result ranges, scrolling, filter resets, retry behavior, and stale-response protection.

The listings tests mock `PropertyCard` to focus on page behavior. The existing dedicated `PropertyCard` tests remain in the full test suite.

### Run And Test

Start the backend with a reachable database and valid credentials:

```powershell
cd D:\idx_exchange\sde_project\backend
npm.cmd run dev
```

In another terminal, start the frontend:

```powershell
cd D:\idx_exchange\sde_project\frontend
npm.cmd start
```

Open:

```text
http://localhost:3000
```

Run backend tests:

```powershell
cd D:\idx_exchange\sde_project\backend
npm.cmd test
```

Run frontend tests and create a production build:

```powershell
cd D:\idx_exchange\sde_project\frontend
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run build
```

Verified results:

```text
Backend: 14 tests passing
Frontend: 86 tests passing across 6 test suites
Pagination: 14 tests passing
ListingsPage: 25 tests passing
Production build: compiled successfully
Browser checks: pagination, filters, empty results, single-page results, scrolling, and same-page retry passed
Responsive checks: 390px, 800px, and 1280px layouts passed without horizontal overflow
```

Browser verification used a temporary local server with deterministic API fixtures. The fixtures included 55,212 results, filtered results, a partial final page, empty results, and a temporary page failure.

Live database integration was not rerun because the configured credentials were rejected by the running MySQL instance. No database or environment configuration was changed. The temporary verification server was stopped after testing.

### Week 7 Demo Checklist

1. Show pagination below the property grid.
2. Show Previous disabled on page 1.
3. Navigate using Next, Previous, and numbered buttons.
4. Show ellipses on a large page range.
5. Visit the last page and show Next disabled.
6. Confirm boundary page numbers do not repeat.
7. Show the correct results range on a partial last page.
8. Apply filters, change pages, and confirm the filters remain active.
9. Search or clear filters from a later page and return to page 1.
10. Show pagination hidden for single-page and empty results.
11. Demonstrate scrolling to the top after changing pages.
12. Run all tests and the production build.

### Week 7 Checkpoint

- [x] All pagination edge cases work correctly.
- [x] Tests cover first, last, and middle pages.
- [x] Tests cover page-number clicks and ellipsis rendering.
- [x] First and last page numbers do not repeat.
- [x] Filters and pagination interact correctly.
- [x] Results summaries show the correct range.
- [x] Failed-page retries preserve the page and submitted filters.
- [x] All automated tests pass.
- [x] The production build succeeds.
- [x] Week 7 code is synchronized with GitHub main.
