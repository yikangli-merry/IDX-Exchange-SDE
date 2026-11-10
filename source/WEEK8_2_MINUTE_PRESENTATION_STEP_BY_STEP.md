# Week 8 两分钟讲解稿及逐句展示位置

这份稿子用于向小组成员共享屏幕，展示 Week 8 的房源详情页、照片轮播与灯箱、开放日备注、地图接口和返回导航。

**中文是操作提示，英文是正式口播。正式汇报只读英文，不要把中文对照也念一遍。** 时间轴覆盖两分钟，包含点击和切换窗口；会前需要完整计时彩排一次。

主线：**列表卡片轮播 → 进入详情 → 路由代码 → 详情与照片 → 灯箱键盘操作 → 两个调试问题 → 地图配置状态 → 返回列表 → 测试结果。**

行号对应 Week 8 提交 `a1bef84`。后续文件改动时，优先按下面给出的代码原文定位。

## 一、会前环境检查，不计入两分钟

### 1. 先确认能否使用现场网页演示

编写本稿时，本机状态为：

- 前端端口 `3000` 和后端端口 `5000` 尚未启动。
- MySQL 端口 `3306` 正在监听，但项目配置的数据库凭据返回 `ER_ACCESS_DENIED_ERROR`。
- 前端尚未配置 Google Maps API key。

这些是编写时的检查结果，不代表你演讲当天的状态。先按下面的步骤检查。

打开 PowerShell **终端 A：Backend**，启动后端并保持运行：

```powershell
cd D:\idx_exchange\sde_project\backend
npm.cmd run dev
```

打开 [数据库健康检查](http://localhost:5000/api/health)。必须看到以下结果，才能采用本文的现场网页版：

```json
{"status":"ok","database":"connected"}
```

如果返回数据库未连接，先确认正在使用哪个 MySQL 实例，以及本地后端配置是否与它匹配。仅仅启动 Express 不会修复凭据错误。

如果使用项目的 Docker 数据库，先启动 Docker Desktop，确认端口可用，再执行：

```powershell
docker start idx-mysql-local
```

**如果会前仍无法通过健康检查，使用本文最后的备用版，不在两分钟内排查数据库。**

### 2. 启动前端

打开 PowerShell **终端 B：Frontend**，启动前端并保持运行：

```powershell
cd D:\idx_exchange\sde_project\frontend
npm.cmd start
```

打开 [房源列表](http://localhost:3000/)。健康检查通过后可以关闭健康检查标签页，正式演示主要使用房源应用这一个浏览器标签页。

### 3. 会前选好一套展示房源

1. 在 City 输入 `Irvine`，点击 **Search**，进入第 **2** 页。
2. 选一张房源卡片，检查它至少有两张能够加载的照片。
3. 点击进入详情，确认有 open house，最好包含 remarks，并且有有效的经纬度。
4. 记住这张卡片的地址。正式讲解时直接操作这张卡片，不临时寻找。
5. 如果当前页没有符合条件的房源，换一个城市或页码，选定后把下文的城市和页码同步替换。至少保证有多张可用照片；如果没有带备注的开放日，备注部分展示代码即可，不声称页面上出现了备注。
6. 提前练习一次：卡片箭头 → 详情 → 第二张缩略图 → 主图灯箱 → 方向键 → Escape → 开放日 → Location → Back to listings。
7. 最后返回选定的列表页，停在目标卡片前。确保照片、箭头、计数、地址和浏览器地址栏都能看到。

**浏览器开始画面：已提交筛选条件的第 2 页，鼠标停在目标卡片附近。** 如果你实际选了其他页，讲解时用实际页码。

### 4. 地图展示采用当前可用状态

本稿主讲词按“尚未配置 API key”编写。现场展示 Location 区域、地图提示文字和 **Get Directions** 链接，并明确说嵌入地图的真实显示还待验证。

如果你会前已经配置有效 key、重启前端，并亲自确认地图可以显示，把地图部分的第二句替换为：

> The embedded map uses the property's latitude and longitude, and it has been verified with a configured API key.

只有真实验证过后，才使用这句替换词。

## 二、提前准备 VS Code 和测试结果

### 1. 固定三个代码标签页

在 VS Code 按 `Ctrl+P` 输入下面的完整路径。每打开一个文件后双击标签，将它固定，避免被下一个预览标签覆盖。

| 标签 | 文件 | 会前停留位置 |
| --- | --- | --- |
| A：路由 | [App.js](D:/idx_exchange/sde_project/frontend/src/App.js:18) | `Ctrl+G` 输入 `18`，看到第 18、19 行的两个 Route |
| B：灯箱 | [PropertyImageGallery.jsx](D:/idx_exchange/sde_project/frontend/src/components/PropertyImageGallery.jsx:24) | 先停在第 24 行；正式讲解时还会跳到第 72 行 |
| C：开放日 | [OpenHouses.jsx](D:/idx_exchange/sde_project/frontend/src/components/OpenHouses.jsx:15) | `Ctrl+G` 输入 `15`，看到 getRemarks 函数 |

完整路径：

```text
D:\idx_exchange\sde_project\frontend\src\App.js
D:\idx_exchange\sde_project\frontend\src\components\PropertyImageGallery.jsx
D:\idx_exchange\sde_project\frontend\src\components\OpenHouses.jsx
```

开启编辑器行号。较长 JSX 看不全时，按 `Alt+Z` 自动换行。正式展示只定位和指示，不编辑代码。

### 2. 准备测试和构建结果

另开 PowerShell **终端 C：Week8 Checks**，会前依次执行：

```powershell
cd D:\idx_exchange\sde_project\frontend
npm.cmd run build

cd D:\idx_exchange\sde_project\backend
npm.cmd test

cd D:\idx_exchange\sde_project\frontend
npm.cmd test -- --watchAll=false --runInBand
```

本周实现验收时的结果是：

```text
Production build: Compiled successfully.
Backend: 14 tests passing
Frontend:
Test Suites: 12 passed, 12 total
Tests:       169 passed, 169 total
```

确认你会前实际运行也通过。终端最后停在前端测试摘要处，正式汇报时不重新运行测试或等待构建。

### 3. 开始共享屏幕

- 共享整个屏幕，方便切换浏览器、VS Code 和测试终端。
- 浏览器停在目标房源卡片。
- VS Code 的 A、B、C 标签都已经打开。
- 测试终端已经停在结果摘要处。
- 主讲时按表中的顺序切换，不再搜索文件。

## 三、正式两分钟：现场网页版

### 0:00–0:10 开场，停在列表卡片

**屏幕操作：** 保持浏览器在选定的列表页，鼠标指着目标房源卡片。

**英文口播：**

> This week, I connected the property listings to a complete detail page with photos, open houses, and location information.

**中文理解：** 本周把列表连接到完整详情页，包括照片、开放日和位置信息。

### 0:10–0:22 展示卡片轮播，然后进入详情

**英文口播：**

> The carousel changes photos without opening the property. Clicking the card navigates using its listing ID.

**逐句操作：**

1. 说到 **“carousel changes photos”**：点击卡片右箭头一次，指一下变化后的 `X / Y` 计数。此时仍停在列表页。
2. 说到 **“Clicking the card”**：点击卡片地址进入详情。
3. 说到 **“listing ID”**：鼠标指向地址栏中的 `/property/房源ID`。

**中文理解：** 箭头只切换照片；点击卡片才按 listing ID 跳转。

### 0:22–0:30 指出两条前端路由

**屏幕操作：** 切到 VS Code **标签 A**，定位第 18 行。

**英文口播：**

> These two routes connect the listings page and the property detail page.

**指哪里：** 先指第 18 行的 `path="/"`，再指第 19 行的 `path="/property/:id"`。不展开其他代码。

### 0:30–0:44 展示详情内容和缩略图

**屏幕操作：** 切回浏览器详情页。

**英文口播：**

> The detail page shows the price, address, property statistics, and description. Thumbnails change the main image.

**逐句操作：**

1. 第一句依次指价格、地址、Beds / Baths / Sq ft / Year built，以及 About this home 描述。
2. 按会前练习的滚动位置移动，不在现场逐项寻找。
3. 说到 **“Thumbnails”**：点击第二张缩略图，指向切换后的主图。

### 0:44–0:56 展示灯箱和键盘操作

**英文口播：**

> The lightbox supports arrow keys and Escape. Focus moves into the dialog so keyboard events work.

**逐句操作：**

1. 点击主图打开全屏灯箱。
2. 说到 **“arrow keys”**：按一次键盘右方向键 `→`，指照片或计数的变化。
3. 说到 **“Escape”**：按 `Esc` 关闭灯箱。
4. 第二句解释焦点作用，不再增加其他点击。

### 0:56–1:10 展示灯箱调试修复

**屏幕操作：** 切到 VS Code **标签 B**。

**英文口播：**

> Here, I focus the dialog when it opens. This tabIndex makes the container focusable.

**逐句操作：**

1. 第一句：指第 **24 行**的 `dialog.current?.focus()`。
2. 第二句：按 `Ctrl+G`，输入 `72`，回车；指第 **72 行**的 `tabIndex={-1}`。
3. 同一行的 `onKeyDown={handleKeyDown}` 就是键盘事件入口，鼠标稍作停留即可。

**中文理解：** 仅附加 keydown handler 不够；容器需要可接收焦点，并在打开后获得焦点。

### 1:10–1:25 展示开放日及备注解析

**英文口播：**

> Open house dates and times are formatted. Remarks come from parsing all_data and reading OpenHouseRemarks in React.

**逐句操作：**

1. 第一句：切回浏览器，滚到 **Open houses**，指日期、开始结束时间和备注。
2. 说到 **“parsing all_data”**：切到 VS Code **标签 C**，指第 **17 行**的 `JSON.parse(rawData)`。
3. 说到 **“OpenHouseRemarks”**：指第 **18 行**读取这个字段的位置。

**中文理解：** 备注位于 all_data JSON 内，由前端解析，后端保持原样返回。

### 1:25–1:39 展示地图接口和当前配置状态

**屏幕操作：** 切回浏览器，滚到 **Location**。

**英文口播：**

> The directions link opens Google Maps. The embedded map is implemented, but live verification is pending an API key.

**指哪里：** 第一句指 **Get Directions**；第二句指地图提示区域。两分钟内只指链接即可，点击外部地图的流程可留到提问环节。

### 1:39–1:49 返回列表，展示状态保留

**英文口播：**

> Returning restores the submitted filters and page number, so users keep their place.

**屏幕操作：** 回到详情页顶部，点击 **Back to listings**。指地址栏保留下来的城市筛选和 `page=2`，再指恢复后的页码或房源卡片。以你会前选定的实际页码为准。

### 1:49–2:00 展示测试结果并结束

**屏幕操作：** 切到 **终端 C：Week8 Checks**。

**英文口播：**

> All 169 frontend tests and 14 backend tests passed, and the production build succeeded.

**指哪里：** 指 `Tests: 169 passed` 和 `Test Suites: 12 passed`。后端与构建结果会前已确认。说完停住，结束展示。

## 四、数据库未连通时的两分钟备用版

这个版本使用上次验收截图、代码和自动化测试，不依赖实时数据库。不能把截图说成当前真实数据库页面。

### 会前额外准备

打开 [Week 8 浏览器验收截图](C:/Users/86150/.codex/visualizations/2026/11/10/01a1c34c-8618-7d32-b115-da9cc2e582ba/week8-detail.jpg)。截图使用测试数据，文件保存在本机，GitHub 网页无法打开这个本地路径。

如果截图在演讲电脑上不可用，直接从路由代码开始介绍；不要依赖这张图。

额外固定 **标签 D：地图**，打开 [PropertyMap.jsx](D:/idx_exchange/sde_project/frontend/src/components/PropertyMap.jsx:21)，按 `Ctrl+G` 输入 `21`，看到 iframe 条件和 URL。

### 逐句口播与展示位置

| 时间 | 展示位置与指示 | 英文口播 |
| --- | --- | --- |
| 0:00–0:20 | 验收截图，指照片、统计和开放日区域 | This week, I implemented the property detail flow. This screenshot uses test data. The local database currently rejects the configured credentials, so I'll demonstrate the implementation and automated tests. |
| 0:20–0:40 | 标签 A，第 18、19 行，依次指两个 Route | React Router connects the listings and property detail pages. Cards navigate using the listing ID, and returning restores the submitted filters and page number. |
| 0:40–1:10 | 标签 B，第 24 行 focus → 第 72 行 tabIndex → 第 35 行键盘 handler | The gallery supports thumbnails and a full-screen lightbox. I focus the dialog when it opens and make it focusable with tabIndex. The keyboard handler supports Escape and both arrow keys. |
| 1:10–1:30 | 标签 C，第 17 行 JSON.parse、第 18 行 OpenHouseRemarks | Open house remarks are stored inside all_data. I parse that JSON in the React component and extract OpenHouseRemarks, while safely handling missing or malformed data. |
| 1:30–1:45 | 标签 D，第 21 行渲染条件、第 22 行 iframe URL | The map uses an iframe with the property coordinates. Live embedded map verification is still pending a Google Maps API key. |
| 1:45–2:00 | 测试终端，指 169 passed 和 12 passed | All 169 frontend tests and 14 backend tests passed, and the production build succeeded. Browser checks also covered navigation, photos, error handling, and responsive layouts. |

## 五、提问环节备用定位

这些内容不放进正式两分钟，只在被问到时打开。

| 问题 | 打开哪里、指哪里 | 简短回答 |
| --- | --- | --- |
| 为什么轮播箭头不会跳转？ | [PropertyImageCarousel.jsx](D:/idx_exchange/sde_project/frontend/src/components/PropertyImageCarousel.jsx:25)，第 26、27 行 | `preventDefault()` 和 `stopPropagation()` 让箭头只处理切图。 |
| 筛选和页码保存在哪里？ | [ListingsPage.jsx](D:/idx_exchange/sde_project/frontend/src/pages/ListingsPage.jsx:75)，第 79–85 行 | 将已提交的筛选条件和页码写进列表 URL。 |
| 卡片按哪个 ID 跳转？ | [PropertyCard.jsx](D:/idx_exchange/sde_project/frontend/src/components/PropertyCard.jsx:31)，第 31 行 | 使用 `L_ListingID`，并携带来源列表地址。 |
| 如何处理旧请求？ | [PropertyDetailPage.jsx](D:/idx_exchange/sde_project/frontend/src/pages/PropertyDetailPage.jsx:41)，第 43–52 行 | 使用 AbortController 取消请求，并检查请求序号。 |
| 没有开放日怎么办？ | [OpenHouses.jsx](D:/idx_exchange/sde_project/frontend/src/components/OpenHouses.jsx:30)，第 30 行 | 显示 `No open houses scheduled`。 |
| 地图什么时候显示？ | [PropertyMap.jsx](D:/idx_exchange/sde_project/frontend/src/components/PropertyMap.jsx:21)，第 21 行 | 经纬度有效且配置 key 时才渲染 iframe。 |

## 六、排练检查

- [ ] 健康检查通过，或已经选定备用代码展示版。
- [ ] 目标房源和展示页码已经选好，照片能够正常加载。
- [ ] 地图口播符合当前真实配置状态。
- [ ] VS Code 标签已固定，行号和代码可见。
- [ ] 测试与构建已经运行，结果与口播一致。
- [ ] 完整计时一次，包含所有切换与点击。
- [ ] 现场超时优先减少停顿和指示次数，不现场运行测试或排查服务。
