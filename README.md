# SDE Internship Project

这是一个房地产房源查询项目的本地开发仓库。项目最终目标是使用 React、Node.js/Express 和 MySQL 构建一个可搜索、可筛选、可分页的 property listings 应用，并支持 property detail 和 open house schedule。

当前 README 重点记录 Week 1 已完成的环境搭建和数据库导入工作。

## Project Overview

本项目的数据来自两个 SQL 文件：

- `source/rets_property.sql`: 房源列表数据
- `source/rets_openhouse.sql`: Open house 活动数据

数据库运行方式：

- MySQL 8
- Docker 容器名：`idx-mysql-local`
- 数据库名：`rets`
- 本机端口：`3306`

Week 1 的目标是让 MySQL 在 Docker 中运行，并确保两张表已经导入、可以查询、可以查看字段结构。

## Week 1 Status

Week 1 已完成以下内容：

- 已安装并启动 Docker Desktop。
- 已下载并创建 `mysql:8` Docker 容器。
- 已创建容器 `idx-mysql-local`。
- 已创建数据库 `rets`。
- 已导入 `rets_property.sql`。
- 已导入 `rets_openhouse.sql`。
- 已验证两张表存在并且包含数据。
- 已验证容器可以通过 `docker start idx-mysql-local` 重新启动。

已验证的数据量：

```text
rets_property: 55212 rows
rets_openhouse: 13433 rows
```

本机开发环境中使用的 MySQL root 密码：

```text
idxlocal123
```

注意：这个密码只用于本地开发环境，不应作为生产环境密码使用。

## Prerequisites

运行本项目数据库环境前，需要安装：

- Docker Desktop
- PowerShell
- MySQL client 可选，因为也可以通过 Docker 容器内的 `mysql` 命令连接

如果需要从头导入数据，还需要确保以下文件存在：

```text
D:\idx_exchange\sde_project\source\rets_property.sql
D:\idx_exchange\sde_project\source\rets_openhouse.sql
```

## Start The Database

先打开 Docker Desktop，等 Docker engine 启动完成。

然后在 PowerShell 中进入项目目录：

```powershell
cd D:\idx_exchange\sde_project
```

启动 MySQL 容器：

```powershell
docker start idx-mysql-local
```

检查容器是否正在运行：

```powershell
docker ps
```

期望看到类似输出：

```text
idx-mysql-local   0.0.0.0:3306->3306/tcp   mysql:8
```

## Connect To MySQL

进入 Docker 容器中的 MySQL shell：

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

输入密码：

```text
idxlocal123
```

进入成功后，会看到：

```text
mysql>
```

## Verify The Database

在 MySQL shell 中运行：

```sql
SHOW TABLES;
```

应该看到：

```text
rets_openhouse
rets_property
```

检查两张表的数据量：

```sql
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
```

期望结果是两个 count 都不是 0。当前本地验证结果是：

```text
rets_property: 55212
rets_openhouse: 13433
```

查看字段结构：

```sql
DESCRIBE rets_property;
DESCRIBE rets_openhouse;
```

查询示例房源数据：

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

查询示例 open house 数据：

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

`rets_property` 是房源主表。后续 property listing page、filter API 和 property detail page 都会主要使用这张表。

重要字段：

```text
L_ListingID: 房源 ID，也是和 open house 表关联的字段
L_Address: 房源地址
L_City: 城市
L_State: 州
L_Zip: 邮编
L_SystemPrice: 房价
L_Keyword2: 卧室数量
LM_Dec_3: 浴室数量
LM_Int2_3: 房屋面积
L_Photos: 照片 URL 数据
LMD_MP_Latitude: 纬度
LMD_MP_Longitude: 经度
L_Remarks: 房源描述
YearBuilt: 建造年份
LotSizeAcres: 土地面积
```

注意：这张表使用旧 RETS 命名风格，字段名不是常见的 `price`、`beds`、`baths`。写 SQL 查询时必须使用真实字段名，例如：

```text
price -> L_SystemPrice
beds -> L_Keyword2
baths -> LM_Dec_3
sqft -> LM_Int2_3
```

### `rets_openhouse`

`rets_openhouse` 存储 open house 活动信息。

重要字段：

```text
L_ListingID: 对应 rets_property 的房源 ID
OpenHouseDate: Open house 日期
OH_StartTime: 开始时间
OH_EndTime: 结束时间
all_data: 额外 open house 信息的 JSON 数据
```

两张表可以通过 `L_ListingID` 关联。

## Recreate The Container From Scratch

如果本地没有 `idx-mysql-local` 容器，可以用以下命令重新创建：

```powershell
docker run --name idx-mysql-local -e MYSQL_ROOT_PASSWORD=idxlocal123 -e MYSQL_DATABASE=rets -p 3306:3306 -d mysql:8
```

等待 MySQL ready：

```powershell
docker exec idx-mysql-local mysqladmin ping -uroot -pidxlocal123
```

导入 SQL 文件：

```powershell
cmd.exe /c 'docker exec -i idx-mysql-local mysql -uroot -pidxlocal123 --binary-mode=1 rets < "D:\idx_exchange\sde_project\source\rets_property.sql"'
cmd.exe /c 'docker exec -i idx-mysql-local mysql -uroot -pidxlocal123 --binary-mode=1 rets < "D:\idx_exchange\sde_project\source\rets_openhouse.sql"'
```

`rets_property.sql` 文件较大，导入和建立索引会花比较长时间。导入期间不要中断命令。

## Port 3306 Conflict

这台电脑上还有一个本机 MySQL 服务：

```text
MySQL80
```

它也可能占用 `3306` 端口。如果 Docker 容器启动时报端口冲突，可以在管理员 PowerShell 中停止本机 MySQL 服务：

```powershell
Stop-Service MySQL80
docker start idx-mysql-local
```

如果以后需要切回旧项目，先停止 Docker 容器，再启动本机 MySQL：

```powershell
docker stop idx-mysql-local
Start-Service MySQL80
```

同一时间只能有一个 MySQL 服务绑定本机 `3306` 端口。

## Week 1 Demo Checklist

汇报 Week 1 时，建议展示以下内容：

1. Docker 容器正在运行：

```powershell
docker ps
```

2. 容器可以重启：

```powershell
docker stop idx-mysql-local
docker start idx-mysql-local
```

3. 进入 MySQL：

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

4. 展示两张表存在：

```sql
SHOW TABLES;
```

5. 展示两张表有数据：

```sql
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
```

6. 展示字段结构：

```sql
DESCRIBE rets_property;
DESCRIBE rets_openhouse;
```

7. 展示真实查询：

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

项目使用 Docker 运行 MySQL，是为了让开发环境更稳定、可复现：

- 不依赖每个人电脑上本机 MySQL 的安装状态。
- 可以固定 MySQL 版本为 MySQL 8。
- 可以固定容器名、端口和数据库名。
- 后续 Node/Express API 可以连接一个稳定的本地数据库环境。
- 如果环境损坏，可以删除并重建容器，而不影响项目代码。

## Current Notes

- SQL 源文件仍保存在 `source/` 目录下。
- Docker Desktop 的数据会占用 D 盘空间。
- `idx-mysql-local` 的 MySQL 数据保存在 Docker volume 中。
- 不要删除 `idx-mysql-local` 的 volume，除非确定可以重新导入 SQL 文件。

更多 Week 1 汇报细节和发言稿见：

```text
WEEK1_DEMO_GUIDE.md
```
