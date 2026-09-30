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
