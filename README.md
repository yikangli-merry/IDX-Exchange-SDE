# SDE Internship Project

This repository contains the local setup for a real estate property listings project. The final project goal is to build a searchable, filterable, paginated property listings application using React, Node.js/Express, and MySQL, with support for property detail pages and open house schedules.

This README currently focuses on the Week 1 work: local environment setup, Dockerized MySQL, database import, and database verification.

## Project Overview

The project uses two SQL data files:

- `source/rets_property.sql`: property listing data
- `source/rets_openhouse.sql`: open house event data

Database setup:

- MySQL 8
- Docker container name: `idx-mysql-local`
- Database name: `rets`
- Local port: `3306`

The Week 1 goal is to run MySQL in Docker, import both SQL files, and verify that both tables are populated and queryable.

## Week 1 Status

The following Week 1 tasks have been completed:

- Docker Desktop was installed and started.
- The `mysql:8` Docker image was downloaded.
- The MySQL container `idx-mysql-local` was created.
- The database `rets` was created.
- `rets_property.sql` was imported.
- `rets_openhouse.sql` was imported.
- Both tables were verified to exist.
- Both tables were verified to contain data.
- The container was verified to restart successfully with `docker start idx-mysql-local`.

Verified row counts:

```text
rets_property: 55212 rows
rets_openhouse: 13433 rows
```

Local development MySQL root password:

```text
idxlocal123
```

Note: this password is only for the local development environment. It should not be used in production.

## Prerequisites

To run the local database environment, install:

- Docker Desktop
- PowerShell
- Optional: MySQL client, although the MySQL CLI inside the Docker container can also be used

If the database needs to be recreated from scratch, make sure these files exist:

```text
D:\idx_exchange\sde_project\source\rets_property.sql
D:\idx_exchange\sde_project\source\rets_openhouse.sql
```

## Start The Database

Open Docker Desktop first and wait until the Docker engine is running.

Then open PowerShell and go to the project directory:

```powershell
cd D:\idx_exchange\sde_project
```

Start the MySQL container:

```powershell
docker start idx-mysql-local
```

Check that the container is running:

```powershell
docker ps
```

Expected output should include something similar to:

```text
idx-mysql-local   0.0.0.0:3306->3306/tcp   mysql:8
```

## Connect To MySQL

Enter the MySQL shell inside the Docker container:

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

Enter the password:

```text
idxlocal123
```

After a successful login, the terminal should show:

```text
mysql>
```

## Verify The Database

Inside the MySQL shell, run:

```sql
SHOW TABLES;
```

Expected tables:

```text
rets_openhouse
rets_property
```

Check the row counts:

```sql
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
```

Both counts should be greater than 0. Current verified local results:

```text
rets_property: 55212
rets_openhouse: 13433
```

Inspect the table schemas:

```sql
DESCRIBE rets_property;
DESCRIBE rets_openhouse;
```

Sample property query:

```sql
SELECT
  L_ListingID,
  L_Address,
  L_City,
  L_State,
  L_Zip,
  L_SystemPrice,
  L_Keyword2,
  LM_Dec_3,
  LM_Int2_3
FROM rets_property
LIMIT 5;
```

Sample open house query:

```sql
SELECT
  L_ListingID,
  OpenHouseDate,
  OH_StartTime,
  OH_EndTime
FROM rets_openhouse
LIMIT 5;
```

## Key Database Tables

### `rets_property`

`rets_property` is the main property listings table. It will be used by the property listing page, filter API, and property detail page.

Important columns:

```text
L_ListingID: property listing ID; also used to connect with open house records
L_Address: property address
L_City: city
L_State: state
L_Zip: ZIP code
L_SystemPrice: listing price
L_Keyword2: number of bedrooms
LM_Dec_3: number of bathrooms
LM_Int2_3: living area / square footage
L_Photos: photo URL data
LMD_MP_Latitude: latitude
LMD_MP_Longitude: longitude
L_Remarks: property description
YearBuilt: year built
LotSizeAcres: lot size in acres
```

Important note: this table uses older RETS-style column names. The column names are not standard application names like `price`, `beds`, or `baths`. SQL queries must use the real database column names:

```text
price -> L_SystemPrice
beds -> L_Keyword2
baths -> LM_Dec_3
sqft -> LM_Int2_3
```

### `rets_openhouse`

`rets_openhouse` stores open house event information.

Important columns:

```text
L_ListingID: property listing ID that connects to rets_property
OpenHouseDate: open house date
OH_StartTime: start time
OH_EndTime: end time
all_data: additional open house information stored as JSON data
```

The two tables can be connected through `L_ListingID`.

## Recreate The Container From Scratch

If the `idx-mysql-local` container does not exist, recreate it with:

```powershell
docker run --name idx-mysql-local -e MYSQL_ROOT_PASSWORD=idxlocal123 -e MYSQL_DATABASE=rets -p 3306:3306 -d mysql:8
```

Wait until MySQL is ready:

```powershell
docker exec idx-mysql-local mysqladmin ping -uroot -pidxlocal123
```

Import the SQL files:

```powershell
cmd.exe /c 'docker exec -i idx-mysql-local mysql -uroot -pidxlocal123 --binary-mode=1 rets < "D:\idx_exchange\sde_project\source\rets_property.sql"'
cmd.exe /c 'docker exec -i idx-mysql-local mysql -uroot -pidxlocal123 --binary-mode=1 rets < "D:\idx_exchange\sde_project\source\rets_openhouse.sql"'
```

`rets_property.sql` is large, so importing it and building indexes can take a long time. Do not interrupt the command while the import is running.

## Port 3306 Conflict

This computer also has a local Windows MySQL service:

```text
MySQL80
```

That service may also use port `3306`. If the Docker container fails to start because port `3306` is already in use, stop the local MySQL service from an administrator PowerShell:

```powershell
Stop-Service MySQL80
docker start idx-mysql-local
```

To switch back to older local projects that use the Windows MySQL service, stop the Docker container and start `MySQL80` again:

```powershell
docker stop idx-mysql-local
Start-Service MySQL80
```

Only one MySQL server can bind to local port `3306` at a time.

## Week 1 Demo Checklist

For the Week 1 demo, show the following:

1. The Docker container is running:

```powershell
docker ps
```

2. The container can restart:

```powershell
docker stop idx-mysql-local
docker start idx-mysql-local
```

3. MySQL can be accessed:

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

4. Both required tables exist:

```sql
SHOW TABLES;
```

5. Both required tables contain data:

```sql
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
```

6. Table schemas can be inspected:

```sql
DESCRIBE rets_property;
DESCRIBE rets_openhouse;
```

7. Real records can be queried:

```sql
SELECT
  L_ListingID,
  L_Address,
  L_City,
  L_SystemPrice,
  L_Keyword2,
  LM_Dec_3,
  LM_Int2_3
FROM rets_property
LIMIT 5;
```

## Why Docker Is Used

Docker is used for MySQL because it makes the development environment more consistent and reproducible:

- It avoids depending on each developer's local MySQL installation.
- It keeps the MySQL version fixed at MySQL 8.
- It keeps the container name, port, and database name consistent.
- It gives the future Node/Express API a stable local database target.
- If the environment breaks, the container can be recreated without changing the application code.

## Current Notes

- The original SQL files are still stored in the `source/` directory.
- Docker Desktop data uses disk space on the D drive.
- The `idx-mysql-local` MySQL data is stored in a Docker volume.
- Do not delete the `idx-mysql-local` Docker volume unless the SQL files can be imported again.

More detailed Week 1 demo notes and presentation script are available in:

```text
WEEK1_DEMO_GUIDE.md
```
