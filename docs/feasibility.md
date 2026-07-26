# SitePulse MVP 可行性与实现方案

## 结论

MVP 技术可行，核心能力都能由 Manifest V3、`chrome.webNavigation` 与 `chrome.storage.local` 在本地完成。项目不需要服务端、登录、Content Script 或页面 DOM 访问。

## 架构

```text
webNavigation.onCommitted
        │
        ▼
URL 标准化 → 统计开关/排除判断 → 1 秒去重
        │
        ▼
Promise 串行队列 → chrome.storage.local
        │
        ├── Popup：全量读取 → 搜索/排序 → 前 100
        └── Options：统计开关、排除列表、清空数据
```

页面标题在 `webNavigation.onCompleted` 后通过 `tabs.get` 补全，不增加访问次数。访问地址只保存标准化站点根地址，避免记录路径、查询参数和 hash。

## 技术选型

- React 19 + TypeScript 严格模式
- Vite 多入口构建 Popup、Options 与 Background
- Tailwind CSS 作为样式构建入口
- Lucide React 图标
- Vitest、ESLint、Prettier
- Chrome Extension Manifest V3

没有采用 `@crxjs/vite-plugin`。Vite 原生多入口已经能稳定生成所需目录，减少一个扩展构建层，也便于保证 `background.js` 的固定文件名。

## 数据一致性

每次访问都会执行读取、修改和写入。为避免多个导航事件并发覆盖，后台的所有访问写入与标题更新共用一个 Promise 队列。队列中的任务失败不会阻塞后续任务，调用方仍能得到错误并输出统一日志。

底层保存全部域名数据，排序和关键词过滤后才截取前 100，搜索可以命中默认榜单之外的记录。

## 权限取舍

- `storage` 与 `webNavigation` 是核心统计所必需。
- `favicon` 用于本地 Chrome favicon 接口。
- `tabs.create` 不需要 `tabs` 权限，但读取页面标题需要；由于 PRD 将最近标题定义为网站显示名称的第一优先级，MVP 保留 `tabs` 并明确披露用途。

若未来决定始终只显示 hostname，可以移除 `tabs` 权限和完成事件的标题补全逻辑。

## 风险与边界

1. Manifest V3 Service Worker 会休眠。访问统计已持久化，但 1 秒去重状态按 PRD 只保存在内存；Worker 在这一窗口内恰好重启时可能产生一次重复计数。
2. `chrome.storage.local` 在约 10,000 个域名规模下全量读取与排序仍适合 MVP；更大规模需要性能基准后再考虑 IndexedDB。
3. 页面标题属于标签页元数据，因此需要相对敏感的 `tabs` 权限。Chrome Web Store 上架材料应解释用途并附隐私声明。
4. 自动化测试覆盖纯业务逻辑与并发写入；导航事件、favicon 和 Chrome 安装流程仍需用真实 Chrome 做最终手工验收。

## 交付阶段

1. 工程与 Manifest：多入口构建、图标和加载目录。
2. 数据层：schema 初始化、标准化、排序、设置和健壮读取。
3. 后台：导航过滤、排除/开关、去重、串行累计和标题补全。
4. 界面：排行榜、搜索、菜单、设置与隐私说明。
5. 验收：单测、类型、Lint、生产构建与真实 Chrome 手测。
