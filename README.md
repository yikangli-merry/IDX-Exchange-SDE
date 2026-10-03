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
