# Week 1 汇报文档与发言稿

## 1. 汇报目标

本次 Week 1 的目标是展示本地数据库环境已经搭建完成：

- MySQL 8 正在 Docker 容器中运行。
- 容器名是 `idx-mysql-local`。
- 容器把 MySQL 暴露到本机 `3306` 端口。
- 数据库名是 `rets`。
- 两张表 `rets_property` 和 `rets_openhouse` 已经导入成功。
- 两张表都可以正常查询，并且行数不是 0。
- 我能说明主要字段的含义，以及为什么项目使用 Docker 来运行 MySQL。

当前验证结果：

```text
rets_property: 55212 rows
rets_openhouse: 13433 rows
```

本地开发 MySQL root 密码：

```text
idxlocal123
```

> Demo 时如果不想把密码直接显示在命令里，可以使用 `-p`，然后在提示符里输入密码。

---

## 2. Demo 前准备

### 2.1 打开需要的窗口

汇报前建议提前打开这几个窗口：

1. Docker Desktop
2. PowerShell
3. 这个项目目录：

```powershell
cd D:\idx_exchange\sde_project
```

### 2.2 检查 Docker Desktop 是否启动

如果 Docker Desktop 没开：

**操作标注：**

- 点击 Windows 开始菜单。
- 搜索 `Docker Desktop`。
- 点击打开。
- 等左下角或主页面显示 Docker 已经 running。

然后在 PowerShell 里检查：

```powershell
docker --version
docker ps
```

如果 `docker ps` 可以正常输出，说明 Docker daemon 已经启动。

### 2.3 如果重启电脑后 3306 被 MySQL80 占用

你电脑上还有一个本机 MySQL 服务叫 `MySQL80`。如果重启电脑，它可能会自动启动并占用 `3306`。

如果 `idx-mysql-local` 启动失败，或者提示 `3306` 端口被占用，用管理员 PowerShell 执行：

```powershell
Stop-Service MySQL80
docker start idx-mysql-local
```

**操作标注：**

- 右键 PowerShell。
- 点击 `Run as administrator` / `以管理员身份运行`。
- 执行上面的命令。

---

## 3. 推荐汇报顺序

### Step 1: 展示 Docker 容器正在运行

在 PowerShell 执行：

```powershell
docker ps
```

重点让 supervisor 看到这一行：

```text
idx-mysql-local   0.0.0.0:3306->3306/tcp   mysql:8
```

**操作标注：**

- 如果使用 Docker Desktop：点击左侧 `Containers`。
- 找到 `idx-mysql-local`。
- 指给对方看它的状态是 running。
- 再指给对方看端口映射是 `3306`。

**你可以说：**

> 这里可以看到 MySQL 不是直接跑在我电脑本机服务里，而是跑在 Docker 容器里。容器名是 `idx-mysql-local`，使用的是 `mysql:8` 镜像，并且映射到了本机的 `3306` 端口。

---

### Step 2: 演示容器可以重新启动

如果 supervisor 要求看 checkpoint，可以执行：

```powershell
docker stop idx-mysql-local
docker start idx-mysql-local
docker ps
```

如果只是普通汇报，不一定要 stop/start，因为这会中断几秒数据库连接。

**操作标注：**

- 在 PowerShell 输入 `docker stop idx-mysql-local`。
- 等它输出 `idx-mysql-local`。
- 再输入 `docker start idx-mysql-local`。
- 最后用 `docker ps` 展示它又回到 running 状态。

**你可以说：**

> 我也验证过 checkpoint 要求的重启流程。这个容器可以通过 `docker start idx-mysql-local` 重新启动，启动后数据仍然保留，因为 MySQL 数据存在 Docker volume 里。

---

### Step 3: 进入 MySQL shell

推荐 demo 时使用这个命令：

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

然后输入密码：

```text
idxlocal123
```

成功后会进入 MySQL shell，看到类似：

```text
mysql>
```

**操作标注：**

- 让 supervisor 看命令里的 `docker exec`。
- 指出这个命令表示进入 Docker 容器里的 MySQL。
- 进入后指出当前使用的是 `rets` 数据库。

**你可以说：**

> 我现在不是连接本机原来的 MySQL 服务，而是通过 `docker exec` 进入 Docker 容器里的 MySQL。最后的 `rets` 表示我直接进入项目使用的数据库。

---

### Step 4: 展示两张表存在

在 MySQL shell 里执行：

```sql
SHOW TABLES;
```

应该看到：

```text
rets_openhouse
rets_property
```

**操作标注：**

- 指给 supervisor 看输出里的两个表名。
- 重点标注 `rets_property` 和 `rets_openhouse`。

**你可以说：**

> 这里可以看到 Week 1 要求的两张表都已经存在：`rets_property` 是房源数据表，`rets_openhouse` 是 open house 活动表。

---

### Step 5: 展示两张表都有数据

执行：

```sql
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
```

当前结果：

```text
rets_property: 55212
rets_openhouse: 13433
```

**操作标注：**

- 指给 supervisor 看两个 `COUNT(*)` 都不是 0。
- 如果输出比较窄，可以把窗口放大。

**你可以说：**

> 这一步是验证导入是否成功。`rets_property` 现在有 55212 行，`rets_openhouse` 有 13433 行，所以不是只有空表，而是真正导入了数据。

---

### Step 6: 展示 `rets_property` 字段结构

执行：

```sql
DESCRIBE rets_property;
```

重点解释这些字段：

```text
L_ListingID: 房源 ID，也是和 open house 表关联的字段
L_Address: 地址
L_City: 城市
L_State: 州
L_Zip: 邮编
L_SystemPrice: 房价
L_Keyword2: 卧室数量
LM_Dec_3: 浴室数量
LM_Int2_3: 面积
L_Photos: 照片 URL 数据
LMD_MP_Latitude: 纬度
LMD_MP_Longitude: 经度
L_Remarks: 房源描述
YearBuilt: 建造年份
LotSizeAcres: 土地面积
```

**操作标注：**

- 输出会比较长，不需要全部逐行讲。
- 滚动或截图时重点停在 `L_ListingID`、`L_Address`、`L_City`、`L_SystemPrice`、`L_Photos`、`LMD_MP_Latitude`、`LMD_MP_Longitude` 附近。
- 告诉对方这些字段名不是标准 MLS 命名，所以后面写 API 时必须用真实字段名。

**你可以说：**

> 这张表的字段名是旧 RETS 风格，比如价格不是 `price`，而是 `L_SystemPrice`；卧室数量不是 `beds`，而是 `L_Keyword2`；浴室数量是 `LM_Dec_3`。所以后面写后端查询时，不能猜字段名，必须先看 `DESCRIBE` 的结果。

---

### Step 7: 展示 `rets_openhouse` 字段结构

执行：

```sql
DESCRIBE rets_openhouse;
```

重点解释这些字段：

```text
L_ListingID: 对应 rets_property 的房源 ID
OpenHouseDate: open house 日期
OH_StartTime: 开始时间
OH_EndTime: 结束时间
all_data: 额外 open house 信息的 JSON 数据
```

**操作标注：**

- 指出 `L_ListingID` 是两张表之间最重要的关联字段。
- 指出日期和时间字段后面会用于 property detail 页面展示 open house schedule。

**你可以说：**

> `rets_openhouse` 主要存 open house 活动。它也有 `L_ListingID`，所以后面可以用这个字段把 open house 记录和具体房源关联起来。

---

### Step 8: 展示真实查询结果

查询房源样例：

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

查询 open house 样例：

```sql
SELECT
  L_ListingID,
  OpenHouseDate,
  OH_StartTime,
  OH_EndTime
FROM rets_openhouse
LIMIT 5;
```

**操作标注：**

- 第一条查询让对方看真实房源地址、城市、价格、卧室、浴室、面积。
- 第二条查询让对方看 open house 日期和时间。

**你可以说：**

> 这里我做了实际 SELECT 查询，说明应用后端之后可以从这些表里拿到真实房源数据。第一条查询返回房源列表要用的信息，第二条查询返回 open house schedule 要用的信息。

---

## 4. 完整发言稿

下面是一份可以照着念的版本。你可以根据实际情况缩短。

### 开场

大家好，我今天汇报 Week 1 的内容。Week 1 的目标是完成本地数据库环境搭建，也就是让 MySQL 8 跑在 Docker 里，并且把项目需要的两张 SQL 表导入到 `rets` 数据库中。最终要求是两张表都能查询、能看到表结构，并且我能解释这些表里的关键字段。

### Docker 环境

我先展示 Docker 容器状态。

【操作：打开 PowerShell，执行 `docker ps`】

这里可以看到容器 `idx-mysql-local` 正在运行，使用的是 `mysql:8` 镜像，并且端口映射是 `3306` 到 `3306`。这说明本地应用之后可以通过本机 `3306` 端口连接到 Docker 里的 MySQL。

我们使用 Docker 的原因是让数据库环境更稳定、可复现。每个人本机安装 MySQL 的方式可能不同，但 Docker 容器可以保证 MySQL 版本、端口和数据库环境保持一致。

### 数据库连接

接下来我进入容器里的 MySQL。

【操作：执行 `docker exec -it idx-mysql-local mysql -uroot -p rets`，输入密码】

这里我通过 `docker exec` 进入了容器内部的 MySQL，并且直接连接到 `rets` 数据库。

### 表是否存在

现在我检查 Week 1 要求的两张表是否存在。

【操作：执行 `SHOW TABLES;`】

输出里可以看到 `rets_property` 和 `rets_openhouse`。`rets_property` 是房源信息表，`rets_openhouse` 是 open house 活动表。

### 数据是否导入

然后我检查这两张表是否真的有数据。

【操作：执行两个 `COUNT(*)` 查询】

当前 `rets_property` 有 55212 行，`rets_openhouse` 有 13433 行，所以导入不是空表，而是实际数据已经进入数据库。

### 字段结构说明

接下来我展示表结构。

【操作：执行 `DESCRIBE rets_property;`】

这张表使用的是 RETS 风格字段名，不是普通的 `price`、`beds`、`baths`。比如 `L_SystemPrice` 表示价格，`L_Keyword2` 表示卧室数量，`LM_Dec_3` 表示浴室数量，`LM_Int2_3` 表示面积。地址相关字段包括 `L_Address`、`L_City`、`L_State` 和 `L_Zip`。图片数据在 `L_Photos`，经纬度在 `LMD_MP_Latitude` 和 `LMD_MP_Longitude`。

这个很重要，因为后面写 Node/Express API 查询时，SQL 必须使用这些真实字段名，不能使用自己猜的标准字段名。

【操作：执行 `DESCRIBE rets_openhouse;`】

`rets_openhouse` 里最重要的是 `L_ListingID`、`OpenHouseDate`、`OH_StartTime` 和 `OH_EndTime`。其中 `L_ListingID` 可以和 `rets_property` 里的房源 ID 对应起来，后面 property detail 页面可以用它查询某个房源的 open house schedule。

### 实际查询

最后我展示实际 SELECT 查询。

【操作：执行房源样例查询】

这条查询返回了房源 ID、地址、城市、价格、卧室数、浴室数和面积。这些字段后面会用于 property listing page。

【操作：执行 open house 样例查询】

这条查询返回了房源 ID、open house 日期、开始时间和结束时间。这些字段后面会用于 property detail page 的 open house schedule。

### 结尾

所以 Week 1 的目标已经完成：Docker 中的 MySQL 可以启动，两张表已经导入，数据可以查询，表结构可以查看，并且我知道后面 API 开发要使用哪些真实字段。

---

## 5. 快速命令清单

### 查看容器

```powershell
docker ps
```

### 启动容器

```powershell
docker start idx-mysql-local
```

### 停止容器

```powershell
docker stop idx-mysql-local
```

### 进入 MySQL

```powershell
docker exec -it idx-mysql-local mysql -uroot -p rets
```

### MySQL 内部检查命令

```sql
SHOW TABLES;
SELECT COUNT(*) FROM rets_property;
SELECT COUNT(*) FROM rets_openhouse;
DESCRIBE rets_property;
DESCRIBE rets_openhouse;
```

### 房源样例查询

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

### Open house 样例查询

```sql
SELECT
  L_ListingID,
  OpenHouseDate,
  OH_StartTime,
  OH_EndTime
FROM rets_openhouse
LIMIT 5;
```

---

## 6. 可能被问到的问题

### Q1: 为什么用 Docker 跑 MySQL？

可以回答：

> Docker 可以让数据库环境更可复现。我们不依赖每个人电脑上本机 MySQL 的安装状态，而是用同一个 MySQL 8 镜像、同一个容器名、同一个端口和同一个数据库名。这样后面开发 Node/Express API 时环境更稳定。

### Q2: `rets_property` 和 `rets_openhouse` 怎么关联？

可以回答：

> 两张表都包含 `L_ListingID`。`rets_property` 里它表示房源 ID，`rets_openhouse` 里它表示这个 open house 属于哪个房源。后面可以通过这个字段查询某个 property 的 open house events。

### Q3: 为什么字段名这么奇怪？

可以回答：

> 这些字段是旧 RETS 命名风格，不是现代 RESO 或普通业务字段名。所以后面写 SQL 时不能写 `price`、`beds`、`baths`，要写真实字段，比如 `L_SystemPrice`、`L_Keyword2`、`LM_Dec_3`。

### Q4: 如何证明数据不是空的？

可以回答：

> 我用 `SELECT COUNT(*)` 检查了两张表，`rets_property` 有 55212 行，`rets_openhouse` 有 13433 行，而且我也用 `SELECT ... LIMIT 5` 查出了真实数据。

### Q5: 如果电脑重启后容器没有运行怎么办？

可以回答：

> 先确认 Docker Desktop 已启动，然后执行 `docker start idx-mysql-local`。如果 `3306` 被本机 `MySQL80` 占用，需要先用管理员 PowerShell 停掉 `MySQL80`，再启动 Docker 容器。

---

## 7. Demo 时的屏幕提示

建议你汇报时把 PowerShell 字体调大一点，让输出容易看清楚。

推荐展示节奏：

1. Docker Desktop: 指出 `idx-mysql-local` running。
2. PowerShell: 运行 `docker ps`。
3. PowerShell: 进入 MySQL shell。
4. MySQL shell: 运行 `SHOW TABLES;`。
5. MySQL shell: 运行两个 `COUNT(*)`。
6. MySQL shell: 运行 `DESCRIBE rets_property;`，解释关键字段。
7. MySQL shell: 运行样例 SELECT 查询。

最重要的四个画面：

```text
docker ps
SHOW TABLES;
SELECT COUNT(*)
SELECT ... LIMIT 5
```

只要这四个画面展示清楚，Week 1 的汇报就很完整。
