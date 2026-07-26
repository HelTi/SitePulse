# SitePulse Chrome 扩展 PRD

## 1. 文档信息

- 产品名称：常访
- 英文名称：SitePulse
- 产品类型：Chrome 浏览器扩展
- 文档版本：V1.0
- 目标版本：MVP
- 目标浏览器：Google Chrome
- 扩展规范：Manifest V3
- 数据存储：Chrome 本地存储
- 是否需要服务端：否
- 是否需要登录：否

---

## 2. 产品概述

“SitePulse”是一款本地运行的 Chrome 浏览器扩展，用于记录用户访问网站的次数，并按照访问次数生成网站排行榜。

扩展从安装完成后开始统计用户访问的网站，不读取安装前的浏览历史。

用户点击 Chrome 工具栏中的扩展图标后，可以查看访问次数最高的网站，最多展示前 100 名。

所有数据只保存在用户本地浏览器中，不上传服务器。

---

## 3. 产品目标

### 3.1 核心目标

帮助用户了解自己最常访问的网站，包括：

- 哪些网站访问次数最多
- 每个网站累计访问了多少次
- 最近一次访问时间
- 网站在排行榜中的名次

### 3.2 MVP 成功标准

MVP 需要实现以下能力：

1. 自动监听页面访问。
2. 按网站域名累计访问次数。
3. 展示访问次数前 100 名。
4. 支持点击排行榜中的网站并打开。
5. 支持搜索已记录的网站。
6. 支持排除指定网站。
7. 支持清空所有统计数据。
8. 所有数据仅保存在本地。

---

## 4. 用户场景

### 场景一：查看常访问网站

用户点击 Chrome 工具栏中的“常访”图标，扩展弹出排行榜。

用户可以看到：

- 排名
- 网站图标
- 网站名称或域名
- 访问次数
- 最近访问时间

### 场景二：快速打开网站

用户点击排行榜中的某个网站，扩展在新标签页中打开该网站首页。

### 场景三：查找网站

当统计的网站数量较多时，用户可以输入关键词，根据网站名称或域名进行搜索。

### 场景四：排除不需要统计的网站

用户不希望统计公司内网、开发环境或某些私人网站，可以将网站加入排除列表。

加入排除列表后，扩展不再累计该网站的访问次数。

### 场景五：清空数据

用户可以在设置页面清空所有访问统计。

清空操作必须经过二次确认。

---

## 5. 统计口径

## 5.1 网站统计单位

V1 按 `hostname` 维度统计，不按完整 URL 统计。

例如以下地址统一统计为 `github.com`：

```text
https://github.com/
https://github.com/openai
https://github.com/openai/codex
https://www.github.com/settings
```

统一后的记录：

```text
github.com：4 次
```

## 5.2 域名标准化规则

收到页面 URL 后，按照以下规则处理：

1. 只统计 `http:` 和 `https:` 协议。
2. 将 hostname 转换为小写。
3. 去除 hostname 末尾的点。
4. 默认移除 `www.` 前缀。
5. 不保留路径、查询参数和 hash。
6. 不统计端口号。
7. 保留子域名。

示例：

```text
https://www.Example.com/article?id=1
```

标准化结果：

```text
example.com
```

以下两个域名默认分别统计：

```text
mail.google.com
docs.google.com
```

V1 不实现公共后缀解析，不自动将所有子域名合并到根域名。

## 5.3 一次访问的定义

满足以下条件时，网站访问次数增加 1：

- 浏览器主框架发生一次有效页面导航。
- 页面协议为 HTTP 或 HTTPS。
- 页面域名未被加入排除列表。

使用 `chrome.webNavigation.onCommitted` 监听页面导航。

只处理：

```ts
details.frameId === 0;
```

避免 iframe、广告和嵌套页面被计入统计。

## 5.4 刷新规则

用户刷新当前页面时，计为一次新的访问。

包括：

- 浏览器刷新按钮
- 快捷键刷新
- 页面重新加载

## 5.5 前进和后退

用户通过浏览器前进或后退打开页面时，计为一次新的访问。

## 5.6 标签页切换

仅在已有标签页之间切换，不计为新访问。

## 5.7 SPA 路由变化

V1 不统计只通过以下方式产生的前端路由变化：

- `history.pushState`
- `history.replaceState`
- URL hash 改变

例如用户在单页应用内部切换页面，但没有产生新的主页面导航，不增加访问次数。

## 5.8 重定向

一次页面打开过程中可能发生多次重定向。

V1 采用以下规则：

- 每一次主框架 `onCommitted` 事件均可以产生统计。
- 如果短时间内连续提交同一标准化域名，则进行防重复处理。
- 同一标签页、同一域名在 1 秒内重复提交，只统计一次。

---

## 6. 前 100 名规则

产品界面只展示访问次数最高的前 100 个网站。

排序规则：

1. 首先按照 `visitCount` 降序排序。
2. 访问次数相同时，按照 `lastVisitedAt` 降序排序。
3. 最近访问时间也相同时，按照 hostname 字母升序排序。

伪代码：

```ts
sites.sort((a, b) => {
  if (b.visitCount !== a.visitCount) {
    return b.visitCount - a.visitCount;
  }

  if (b.lastVisitedAt !== a.lastVisitedAt) {
    return b.lastVisitedAt - a.lastVisitedAt;
  }

  return a.hostname.localeCompare(b.hostname);
});
```

最终展示：

```ts
sites.slice(0, 100);
```

### 6.1 数据保存策略

为了保证排行榜准确，底层需要保存所有已访问域名的累计次数，界面只展示前 100 名。

不要在每次访问后删除第 101 名以后的数据，否则被删除的网站后续无法继续累计历史次数，排行榜会失真。

如果未来产品明确要求存储层只能保留 100 条，则需要引入近似高频统计算法，该能力不属于 V1 范围。

---

## 7. 功能需求

## 7.1 自动记录访问

### 功能说明

扩展安装后，在后台自动监听页面访问。

### 处理流程

1. 获取导航事件。
2. 判断是否为主框架。
3. 解析 URL。
4. 判断协议是否允许。
5. 标准化 hostname。
6. 判断 hostname 是否在排除列表。
7. 判断是否属于短时间重复提交。
8. 更新网站访问统计。
9. 将统计结果保存到本地。

### 验收标准

- 访问一个新网站后，产生一条网站记录。
- 再次访问同一网站时，访问次数增加。
- 访问同一网站的不同页面时，归并到同一 hostname。
- iframe 加载不会增加次数。
- Chrome 内部页面不会被统计。
- 排除列表中的网站不会增加次数。

---

## 7.2 网站排行榜

### 功能说明

Popup 首页展示访问次数最高的前 100 个网站。

### 每条记录展示内容

- 排名
- 网站 favicon
- 网站显示名称
- hostname
- 访问次数
- 最近访问时间

### 网站显示名称规则

优先级如下：

1. 最近一次访问时获取到的页面标题。
2. hostname。

页面标题需要进行清理：

- 去除首尾空格。
- 最大长度 50 个字符。
- 超出部分在界面中省略。
- 如果标题为空，则使用 hostname。

### favicon 获取方式

优先使用 Chrome favicon URL：

```text
chrome-extension://<extension-id>/_favicon/?pageUrl=<url>&size=32
```

manifest 中声明：

```json
{
  "permissions": ["favicon"]
}
```

如果 favicon 加载失败，显示默认地球图标。

### 空状态

没有任何数据时显示：

```text
还没有访问记录

打开几个网站后，这里会生成你的常访排行榜。
```

### 验收标准

- 最多展示 100 条。
- 排名与排序规则一致。
- 点击网站可以打开对应站点。
- favicon 失败时不影响列表展示。
- 没有数据时显示空状态。

---

## 7.3 打开网站

点击网站记录时，在新标签页打开网站。

默认打开地址：

```text
https://{hostname}
```

如果记录中保存了最近一次有效 URL，则优先打开最近一次 URL。

调用：

```ts
chrome.tabs.create({
  url: site.lastUrl,
});
```

### 验收标准

- 点击记录后新建标签页。
- 打开地址合法。
- 无效地址不会导致扩展崩溃。

---

## 7.4 搜索

Popup 顶部提供搜索框。

搜索范围：

- hostname
- 网站标题

搜索规则：

- 不区分大小写。
- 去除搜索词首尾空格。
- 搜索结果仍按照访问次数排序。
- 搜索范围为全部已记录网站，不限于前 100 名。
- 搜索结果最多展示 100 条。

搜索框为空时，展示默认排行榜。

### 验收标准

输入：

```text
github
```

能够匹配：

```text
github.com
GitHub
```

---

## 7.5 排除网站

设置页面提供排除列表管理。

用户可以：

- 添加域名
- 删除域名
- 查看当前排除域名

输入支持：

```text
example.com
www.example.com
https://example.com/path
```

保存前统一转换为标准 hostname：

```text
example.com
```

### 排除匹配规则

V1 使用精确 hostname 匹配。

例如排除：

```text
example.com
```

不会自动排除：

```text
docs.example.com
```

后续版本可以增加通配符支持。

### 历史数据处理

将网站加入排除列表后：

- 不再记录新的访问。
- 已有统计数据默认保留。
- 用户可以单独删除该网站的统计数据。

### 验收标准

- 添加排除域名后，不再累计访问次数。
- 重复添加同一 hostname 时不产生重复记录。
- 无效字符串不能保存。
- 用户可以移除排除项。

---

## 7.6 删除单条记录

每条排行榜记录提供更多操作菜单。

菜单内容：

- 打开网站
- 加入排除列表
- 删除统计记录

删除统计记录需要二次确认。

删除后：

- 对应域名的访问次数被清除。
- 后续再次访问该网站时，从 1 开始统计。

---

## 7.7 清空全部数据

设置页面提供“清空统计数据”按钮。

点击后弹出确认提示：

```text
确定要清空所有访问统计吗？

该操作无法撤销，排除列表不会被删除。
```

确认后只删除网站统计数据，不删除：

- 排除列表
- 用户设置
- 扩展版本信息

### 验收标准

- 未确认时不能删除数据。
- 清空后排行榜进入空状态。
- 排除列表保持不变。

---

## 7.8 统计开关

设置页面提供“启用访问统计”开关。

默认值：

```text
开启
```

关闭后：

- 不再记录新的页面访问。
- 已有数据仍可以查看。
- 不删除历史数据。

重新开启后继续累计。

---

## 8. 页面设计

## 8.1 Popup 首页

建议尺寸：

```text
宽度：420px
最小高度：520px
最大高度：600px
```

页面结构：

```text
Header
├── Logo
├── 产品名称
└── 设置按钮

Search
└── 搜索输入框

Summary
├── 已记录网站数量
└── 总访问次数

Ranking List
└── Website Item × N

Footer
└── 本地存储提示
```

### Header

展示：

```text
常访
看看哪些网站，占据了你的日常
```

右上角设置图标，点击后进入设置页面。

### Summary

展示两个数据：

```text
已记录网站：128
累计访问：3,286
```

### 排行榜列表项

```text
1  [favicon]  GitHub
              github.com
              326 次    最近访问：5 分钟前
```

交互：

- 点击主体：打开网站。
- 点击更多按钮：展示操作菜单。
- 鼠标悬浮时显示浅色背景。

---

## 8.2 设置页面

设置页面可以使用独立页面：

```text
options.html
```

页面模块：

1. 统计开关
2. 排除网站管理
3. 数据管理
4. 隐私说明
5. 关于扩展

---

## 9. 隐私要求

扩展涉及浏览行为数据，必须明确说明数据处理方式。

隐私原则：

- 不上传访问记录。
- 不接入第三方统计 SDK。
- 不收集用户身份信息。
- 不请求不必要权限。
- 不读取网页正文。
- 不读取用户输入内容。
- 不记录 URL 查询参数。
- 不记录完整浏览历史。
- 数据仅保存在 `chrome.storage.local`。

Popup 或设置页面展示以下说明：

```text
所有访问统计仅保存在你的浏览器本地，不会上传到任何服务器。
```

---

## 10. 技术方案

## 10.1 技术栈

- React 19
- TypeScript
- Vite
- Chrome Extension Manifest V3
- Tailwind CSS
- Lucide React
- ESLint
- Prettier
- Vitest

可使用：

```text
@crxjs/vite-plugin
```

简化 Chrome 扩展构建。

不使用：

- Next.js
- NestJS
- 服务端数据库
- 用户登录
- 云同步

---

## 10.2 项目目录

```text
changfang-extension/
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── manifest.json
├── src/
│   ├── background/
│   │   ├── index.ts
│   │   ├── navigation-listener.ts
│   │   └── visit-service.ts
│   ├── popup/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── popup.html
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── SearchInput.tsx
│   │       ├── SummaryCard.tsx
│   │       ├── SiteList.tsx
│   │       ├── SiteListItem.tsx
│   │       └── EmptyState.tsx
│   ├── options/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── options.html
│   │   └── components/
│   │       ├── TrackingSettings.tsx
│   │       ├── ExclusionSettings.tsx
│   │       ├── DataSettings.tsx
│   │       └── PrivacySection.tsx
│   ├── shared/
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   ├── storage.ts
│   │   ├── url.ts
│   │   ├── ranking.ts
│   │   ├── date.ts
│   │   └── validation.ts
│   └── styles/
│       └── globals.css
├── tests/
│   ├── url.test.ts
│   ├── ranking.test.ts
│   └── visit-service.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── README.md
└── PRD.md
```

---

## 10.3 Manifest 配置

```json
{
  "manifest_version": 3,
  "name": "常访",
  "description": "记录你最常访问的网站，并生成本地访问排行榜。",
  "version": "1.0.0",
  "permissions": ["storage", "webNavigation", "tabs", "favicon"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_title": "常访",
    "default_popup": "popup.html"
  },
  "options_page": "options.html",
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

Codex 在实现时应检查是否可以移除不必要的 `"tabs"` 权限。

如果只使用 `chrome.tabs.create` 打开新标签页，优先验证是否无需声明 `"tabs"` 权限，遵循最小权限原则。

---

## 11. 数据结构

## 11.1 网站统计

```ts
export interface SiteVisitStat {
  hostname: string;
  title: string;
  visitCount: number;
  firstVisitedAt: number;
  lastVisitedAt: number;
  lastUrl: string;
}
```

存储形式：

```ts
export type SiteVisitMap = Record<string, SiteVisitStat>;
```

示例：

```json
{
  "github.com": {
    "hostname": "github.com",
    "title": "GitHub",
    "visitCount": 326,
    "firstVisitedAt": 1785031200000,
    "lastVisitedAt": 1785124800000,
    "lastUrl": "https://github.com/"
  }
}
```

## 11.2 设置数据

```ts
export interface ExtensionSettings {
  trackingEnabled: boolean;
  excludedHostnames: string[];
}
```

默认值：

```ts
export const DEFAULT_SETTINGS: ExtensionSettings = {
  trackingEnabled: true,
  excludedHostnames: [],
};
```

## 11.3 防重复记录

```ts
export interface LastNavigationRecord {
  tabId: number;
  hostname: string;
  committedAt: number;
}
```

该数据可以仅保存在 Service Worker 内存中，不要求持久化。

---

## 12. Storage Key

统一定义 Storage Key，禁止在业务代码中散落硬编码字符串。

```ts
export const STORAGE_KEYS = {
  SITE_STATS: 'siteStats',
  SETTINGS: 'settings',
  SCHEMA_VERSION: 'schemaVersion',
} as const;
```

初始版本：

```ts
SCHEMA_VERSION = 1;
```

---

## 13. 核心方法定义

## 13.1 URL 标准化

```ts
export interface NormalizedSite {
  hostname: string;
  url: string;
}

export function normalizeSiteUrl(rawUrl: string): NormalizedSite | null;
```

行为要求：

- 无效 URL 返回 `null`。
- 非 HTTP/HTTPS 返回 `null`。
- hostname 转换为小写。
- 移除 `www.`。
- 返回不包含 query 和 hash 的 URL。
- 保留协议和 hostname。

示例：

```ts
normalizeSiteUrl('https://www.GitHub.com/openai?tab=repositories');
```

返回：

```ts
{
  hostname: 'github.com',
  url: 'https://github.com'
}
```

## 13.2 更新访问记录

```ts
export interface RecordVisitInput {
  rawUrl: string;
  title?: string;
  tabId: number;
  committedAt: number;
}

export async function recordVisit(input: RecordVisitInput): Promise<void>;
```

处理要求：

1. 检查统计开关。
2. 标准化 URL。
3. 检查排除列表。
4. 检查重复提交。
5. 获取现有数据。
6. 新增或更新记录。
7. 保存数据。

## 13.3 获取排行榜

```ts
export interface GetRankedSitesOptions {
  keyword?: string;
  limit?: number;
}

export async function getRankedSites(
  options?: GetRankedSitesOptions,
): Promise<SiteVisitStat[]>;
```

默认：

```ts
limit = 100;
```

## 13.4 删除网站记录

```ts
export async function deleteSiteStat(hostname: string): Promise<void>;
```

## 13.5 清空统计

```ts
export async function clearAllSiteStats(): Promise<void>;
```

该方法不得删除设置数据。

---

## 14. 并发与数据一致性

Chrome Service Worker 可能在较短时间内收到多个访问事件。

如果每个事件都按照以下流程执行：

```text
读取 storage
修改对象
写入 storage
```

可能出现并发覆盖，导致访问次数丢失。

实现时需要增加内存队列或 Promise 锁，确保同一时刻只有一个统计写入任务。

建议实现：

```ts
let writeQueue = Promise.resolve();

export function enqueueVisit(task: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(task).catch((error) => {
    console.error('[ChangFang] Visit task failed', error);
  });

  return writeQueue;
}
```

所有访问写入操作必须通过队列执行。

---

## 15. 错误处理

以下错误不能导致扩展崩溃：

- URL 解析失败
- Storage 读取失败
- Storage 写入失败
- favicon 加载失败
- 页面标题为空
- Service Worker 被唤醒或销毁
- 网站 URL 不合法
- 数据结构缺少字段
- 旧版本数据格式不兼容

错误日志统一格式：

```ts
console.error('[ChangFang] Error message', error);
```

生产版本不展示调试弹窗。

---

## 16. 数据迁移

所有本地数据必须包含 schema 版本。

首次安装：

```ts
schemaVersion = 1;
```

Service Worker 启动时执行：

```ts
async function initializeStorage(): Promise<void>;
```

处理逻辑：

1. 读取 schema 版本。
2. 不存在时初始化默认数据。
3. 版本低于当前版本时执行迁移。
4. 版本高于当前版本时避免破坏数据。

V1 只需要建立迁移框架，不需要真实迁移逻辑。

---

## 17. 性能要求

- Popup 首次打开时间小于 300ms。
- 100 条排行榜渲染保持流畅。
- 单次访问统计处理时间小于 100ms。
- 不在每次打开 Popup 时请求网络。
- 不在后台轮询。
- 不监听页面 DOM。
- 不注入 Content Script。
- 不读取页面正文。
- 不保存完整页面历史列表。

当网站数量达到 10,000 条时，基本功能仍应可用。

V1 可以通过读取完整对象排序实现。

如果未来数据规模显著增加，再考虑 IndexedDB。

---

## 18. 测试要求

## 18.1 URL 标准化测试

测试用例：

```text
https://www.example.com/path
=> example.com

http://example.com:8080/page
=> example.com

https://docs.example.com/a
=> docs.example.com

chrome://extensions
=> null

chrome-extension://abc/page.html
=> null

file:///Users/test/index.html
=> null

invalid-url
=> null
```

## 18.2 排名测试

输入：

```text
a.com：10 次，最近访问时间 100
b.com：20 次，最近访问时间 50
c.com：10 次，最近访问时间 200
```

输出顺序：

```text
b.com
c.com
a.com
```

## 18.3 访问累计测试

- 第一次访问时创建记录。
- 第二次访问时 `visitCount + 1`。
- 更新 `lastVisitedAt`。
- 不修改 `firstVisitedAt`。
- 更新 `lastUrl`。
- 有新标题时更新标题。
- 空标题不能覆盖已有有效标题。

## 18.4 排除列表测试

- 精确 hostname 被排除。
- 未排除的子域名仍然统计。
- 重复添加排除项不会重复保存。
- URL 输入可以正确转换为 hostname。

## 18.5 防重复测试

同一 tab、同一 hostname、1 秒内收到两次 committed 事件，只累计一次。

超过 1 秒后再次发生导航，可以再次累计。

## 18.6 清空测试

清空统计后：

```text
siteStats = {}
```

同时保证：

```text
settings
schemaVersion
```

仍然存在。

---

## 19. 验收用例

### 用例一：首次安装

1. 安装扩展。
2. 打开 Popup。
3. 显示空状态。
4. 打开 `https://github.com`。
5. 再次打开 Popup。
6. 显示 `github.com`，访问次数为 1。

### 用例二：同域名合并

1. 打开 `https://github.com`。
2. 打开 `https://github.com/openai`。
3. 打开 `https://www.github.com/settings`。
4. 排行榜只存在一条 `github.com`。
5. 访问次数为 3。

### 用例三：不同子域名

1. 打开 `https://mail.google.com`。
2. 打开 `https://docs.google.com`。
3. 排行榜显示两条独立记录。

### 用例四：排除网站

1. 将 `github.com` 加入排除列表。
2. 记录当前访问次数。
3. 再次打开 GitHub。
4. 访问次数不变。

### 用例五：关闭统计

1. 关闭统计开关。
2. 打开多个网站。
3. 排行榜数据不发生变化。
4. 重新开启统计。
5. 再次打开网站后开始累计。

### 用例六：排行榜限制

1. 构造 150 条网站数据。
2. 默认排行榜只显示前 100 条。
3. 搜索第 120 名网站。
4. 搜索结果能够显示该网站。

---

## 20. 非功能需求

### 20.1 可维护性

- TypeScript 开启严格模式。
- 不允许使用无意义的 `any`。
- 核心业务逻辑与 React 组件分离。
- Chrome API 调用统一封装。
- Storage Key 统一管理。
- 所有核心方法具有明确返回类型。
- 复杂逻辑添加必要注释。

### 20.2 可访问性

- 所有按钮提供 `aria-label`。
- 支持键盘 Tab 导航。
- 操作菜单支持键盘操作。
- 文本颜色满足基本对比度要求。
- 图标不能作为唯一的信息表达方式。

### 20.3 UI 适配

- 支持 Chrome 浅色主题。
- 支持 Chrome 深色主题。
- Popup 内不得出现横向滚动条。
- 长标题和长域名使用省略号。
- 列表滚动时 Header 和搜索框可以固定。

---

## 21. V1 不实现的功能

以下功能不属于 MVP：

- 云端同步
- 用户账号
- 多设备数据合并
- 导入 Chrome 历史记录
- 读取安装前的数据
- 日、周、月趋势图
- 访问时长统计
- 页面级 URL 排行
- AI 网站分类
- 网站标签管理
- 数据导入和导出
- Firefox 和 Edge 适配
- 移动端支持
- 公共后缀解析
- 子域名自动合并
- 隐身模式统计
- 团队共享排行榜
- 服务端数据分析

---

## 22. 后续版本规划

### V1.1

- 导出 JSON 或 CSV
- 今日、近 7 天、近 30 天统计
- 网站访问趋势
- 排名变化
- 手动编辑网站名称
- 根域名合并设置

### V1.2

- 网站分类
- 工作、学习、娱乐标签
- 每日浏览摘要
- 网站访问时间段统计
- 数据备份和恢复

### V2.0

- 可选云同步
- 多设备排行榜
- 跨浏览器支持
- 用户自定义统计规则

---

## 23. Codex 实现任务

Codex 应按以下顺序完成开发。

### 阶段一：项目初始化

1. 创建 React、TypeScript、Vite 项目。
2. 配置 Manifest V3。
3. 配置 Popup、Options 和 Background 三个入口。
4. 配置 Tailwind CSS。
5. 配置 ESLint、Prettier 和 Vitest。
6. 添加扩展图标占位文件。
7. 确保 `npm run build` 可以生成可加载的扩展目录。

### 阶段二：核心数据层

1. 创建类型定义。
2. 创建 Storage Key。
3. 实现 Storage 封装。
4. 实现 URL 标准化。
5. 实现排行榜排序。
6. 实现设置读取和写入。
7. 实现数据初始化。
8. 添加单元测试。

### 阶段三：后台统计

1. 注册 `chrome.webNavigation.onCommitted`。
2. 过滤非主框架事件。
3. 过滤非 HTTP/HTTPS URL。
4. 实现排除列表判断。
5. 实现统计开关判断。
6. 实现 1 秒防重复。
7. 实现写入队列。
8. 实现访问累计。
9. 添加核心逻辑测试。

### 阶段四：Popup

1. 实现 Header。
2. 实现统计摘要。
3. 实现搜索框。
4. 实现排行榜。
5. 实现 favicon。
6. 实现空状态。
7. 实现网站打开操作。
8. 实现删除和排除菜单。
9. 实现加载和错误状态。

### 阶段五：设置页面

1. 实现统计开关。
2. 实现排除列表。
3. 实现添加和删除排除项。
4. 实现清空统计。
5. 实现隐私说明。
6. 实现关于信息。

### 阶段六：验收和文档

1. 执行全部单元测试。
2. 执行 TypeScript 类型检查。
3. 执行 ESLint。
4. 构建生产版本。
5. 在 Chrome 扩展管理页面加载测试。
6. 按照验收用例完成手动测试。
7. 编写 README。
8. 在 README 中说明安装、开发、构建和隐私策略。

---

## 24. Codex 执行约束

Codex 在执行本项目时必须遵守：

1. 不增加服务端。
2. 不增加用户登录。
3. 不使用 Content Script。
4. 不读取网页正文。
5. 不上传任何浏览数据。
6. 不引入第三方数据统计 SDK。
7. 不改变本文定义的统计口径。
8. 不将完整 URL 作为排行榜聚合主键。
9. 不为了只展示前 100 名而删除其他网站统计。
10. 不使用 Manifest V2。
11. 不使用 `localStorage` 替代 `chrome.storage.local`。
12. 不忽略 Storage 并发覆盖问题。
13. 不在缺少测试的情况下完成核心数据逻辑。
14. 对无法确定的 Chrome API 权限采用最小权限原则。
15. 构建产物必须能通过 Chrome 的“加载已解压的扩展程序”直接安装。

---

## 25. 完成定义

只有同时满足以下条件，MVP 才能视为完成：

- Chrome 可以成功加载扩展。
- 页面访问可以正确累计。
- 同一 hostname 可以正确合并。
- 排除列表正常工作。
- 统计开关正常工作。
- Popup 能展示前 100 名。
- 搜索可以查找全部记录。
- 可以打开、删除和排除网站。
- 可以清空统计数据。
- 数据在浏览器重启后仍然存在。
- 不产生明显的重复计数。
- 单元测试全部通过。
- TypeScript 类型检查通过。
- ESLint 检查通过。
- 生产构建成功。
- README 文档完整。
- 无网络请求和浏览数据上传行为。
