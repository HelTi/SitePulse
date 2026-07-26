# SitePulse（常访）

SitePulse 是一个只在本地运行的 Chrome 扩展。它从安装后开始按域名统计主页面导航次数，并在 Popup 中生成常访网站排行榜。

## 功能

- 按标准化 hostname 累计访问次数
- 访问次数、最近访问时间和域名的稳定排序
- 搜索全部已记录网站，最多展示 100 条结果
- 打开、排除或删除单个网站
- 访问统计总开关
- 清空统计并保留设置与排除列表
- 浅色/深色主题和键盘焦点样式
- 根据 Chrome 界面语言自动显示中文或英文，也可在设置中手动选择
- 数据仅保存在 `chrome.storage.local`

扩展不使用服务器、账号、Content Script 或第三方统计 SDK，也不会读取网页正文、输入内容或安装前的浏览历史。

## 开发

要求 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

常用检查：

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

## 在 Chrome 中安装

1. 运行 `npm run build`。
2. 打开 `chrome://extensions`。
3. 开启右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本项目生成的 `dist` 目录。

修改源码后重新构建，并在扩展管理页点击刷新按钮。

## 权限说明

| 权限            | 用途                                                     |
| --------------- | -------------------------------------------------------- |
| `storage`       | 在浏览器本地保存统计和设置                               |
| `webNavigation` | 监听主框架已提交导航，不统计 iframe 或标签切换           |
| `tabs`          | 在页面完成后读取最近页面标题；创建新标签本身不需要此权限 |
| `favicon`       | 在排行榜中显示网站图标                                   |

`lastUrl` 只保存协议与标准化 hostname，不保存路径、查询参数或 hash。

## 统计规则

- 只处理 HTTP/HTTPS 主框架导航。
- hostname 转为小写、去掉尾部点与默认 `www.`，保留其他子域名。
- 刷新、前进和后退计为新访问；纯 SPA 路由与标签切换不计。
- 同一标签页、同一 hostname 在 1 秒内连续提交只计一次。
- 保存全部域名累计值，默认排行榜和搜索结果分别截取前 100 条。

## 项目结构

```text
src/
├── background/   # MV3 Service Worker、导航监听与串行写入
├── options/      # 设置页
├── popup/        # 排行榜 Popup
├── shared/       # 存储、URL、排序、类型和格式化
└── styles/       # Tailwind 入口与全局样式
tests/            # 核心数据逻辑测试
public/           # Manifest 和扩展图标
```

更完整的技术评估见 [docs/feasibility.md](docs/feasibility.md)，产品定义见 [docs/prd.md](docs/prd.md)。
