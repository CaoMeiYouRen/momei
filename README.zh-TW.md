<h1 align="center">
  <img src="./public/logo.png" alt="墨梅部落格" width="128" />
  <br />
  墨梅部落格
</h1>
<p align="center">
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/momei.svg" />
  <a href="https://hub.docker.com/r/caomeiyouren/momei" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/momei">
  </a>
  <a href="https://app.codecov.io/gh/CaoMeiYouRen/momei" target="_blank">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/CaoMeiYouRen/momei">
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/momei/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-blue.svg" />
  <a href="https://docs.momei.app/zh-TW/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/momei?color=yellow" />
  </a>
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">
    <img alt="License: CC BY-NC-SA 4.0" src="https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg" />
  </a>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> |
  <a href="./README.zh-TW.md">繁體中文</a> |
  <a href="./README.en-US.md">English</a> |
  <a href="./README.ko-KR.md">한국어</a> |
  <a href="./README.ja-JP.md">日本語</a>
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 主站</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/zh-TW/"><strong>📚 文檔站</strong></a>
</p>

> **墨梅部落格 - AI 驅動、原生國際化的開發者部落格平台。**
>
> **AI 賦能，全球創作。**

## 📖 簡介

墨梅部落格是一個基於 **Nuxt** 建構的現代化部落格平台。它旨在透過 AI 與深度國際化支援，為技術開發者與跨境內容創作者提供高效率、智慧化的創作體驗。無論是智慧翻譯、自動摘要，還是多語言路由管理，墨梅都能幫助你輕鬆連結全球讀者。

## ✨ 核心特色

-   **AI 驅動**: 深度整合 AI 助手，支援全自動翻譯、智慧標題、摘要生成等功能，大幅提升創作效率。
-   **多模態內容工作流**: 已支援 AI 配圖、ASR、可重用語音輸入、Memos / WechatSync 手動分發與定時任務自動化，覆蓋從靈感採集到發佈的完整鏈路。
-   **原生國際化 (i18n)**: 內建多語言支援，從 UI 到內容管理皆深度整合，協助你輕鬆觸達全球讀者。
-   **現代化技術棧**: 基於 Nuxt（Vue 3 + TypeScript）建構，支援 SSG / SSR 混合渲染，效能出色。
-   **平滑遷移**: 支援自訂 URL Slug（路徑別名），確保從舊部落格遷移時 SEO 幾乎零損失。
-   **Markdown 創作**: 提供簡潔高效的 Markdown 編輯器，支援即時預覽與圖片拖曳上傳。
-   **內容編排與品牌語義**: 首頁「最新文章 + 熱門文章」雙區塊、文章置頂與頁腳版權設定鏈路已收斂，便於營運與站點品牌管理。
-   **多層級訂閱**: 支援全域、分類與標籤的多維度 RSS 訂閱，並具備多語言探測能力。
-   **評論唯讀翻譯**: 評論區支援依目前介面語言查看 AI 譯文，同時保留原文切換、語言標記、快取復用，以及既有配額 / 頻率限制治理。
-   **可配置的系統治理**: 系統設定中心、環境變數鎖定、設定稽核日誌與部署指引已打通，便於在自部署與 Serverless 場景中統一管理。
-   **雲端資產交付**: 已支援 S3 / R2 直傳授權、資產公共位址治理，以及按使用者 / 文章歸屬收斂的物件鍵策略，便於切換 CDN 與儲存後端。

## 🏠 線上體驗

-   **示範站點**: [https://demo.momei.app/](https://demo.momei.app/)

    -   你可以透過信箱 `admin@example.com` 與密碼 `momei123456` 登入示範管理員帳號。

-   **正式站點**: [https://momei.app/](https://momei.app/)

    -   你可以註冊自己的帳號，從一般使用者視角體驗產品。

-   **文檔站點**: [https://docs.momei.app/zh-TW/](https://docs.momei.app/zh-TW/)
-   **問題回饋與交流群**:
    -   QQ 群: [807530287](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=K3QRQlxv_y7KqLhdEZmfouxKv9WHLN_v&authKey=pfdJX4EkvKGQXQrtM5BR968EbtFc9WnVvz8AtLiSUTGZRgw3P1wBWESSDcEjoCZB&noverify=0&group_code=807530287)
    -   Discord: [草梅友仁的交流群](https://discord.gg/6bfPevfyr6)

**頁面截圖**

![QQ截圖20251221215342](https://oss.cmyr.dev/images/20251221221052130.png)

![QQ截圖20251221221235](https://oss.cmyr.dev/images/20251221221240366.png)

![QQ截圖20251221215644](https://oss.cmyr.dev/images/20251221221300973.png)

## 🛠️ 技術棧

-   **核心框架**: [Nuxt](https://nuxt.com/)
-   **UI 框架**: [Vue 3](https://vuejs.org/)
-   **程式語言**: [TypeScript](https://www.typescriptlang.org/)
-   **樣式預處理**: [SCSS](https://sass-lang.com/)
-   **套件管理器**: [PNPM](https://pnpm.io/)
-   **程式規範**: ESLint + Stylelint + Conventional Commits

## 📂 專案結構

-   `components/`: 可重用的 Vue 元件
-   `pages/`: 基於檔案的頁面路由
-   `layouts/`: 頁面版型模板
-   `server/`: Nitro 服務端 API 介面與實體
-   `database/`: 資料庫初始化腳本與資源
-   `i18n/`: 國際化語言設定檔
-   `utils/`: 共享工具函式與通用邏輯
-   `styles/`: 全域 SCSS 樣式定義
-   `types/`: TypeScript 介面與型別定義
-   `docs/`: 專案詳細文檔與規範說明
-   `packages/cli/`: Hexo 遷移工具 CLI（獨立專案）

## 🤖 AI 協同開發 (AI Synergy)

本專案深度整合了 AI 輔助開發流程，無論你是人類開發者還是 AI 代理，都能在這裡找到最高效的協作方式。

- **如果你是開發者 (Human)**:
  - 🚀 **[現代 AI 開發指南](https://docs.momei.app/zh-TW/guide/ai-development)** - 了解如何指揮 AI 智能體完成 80% 的重複性工作。
  - 🛠️ **[環境搭建（傳統方式）](https://docs.momei.app/zh-TW/guide/development)** - 詳細的本機環境配置與手動開發說明。
- **如果你是 AI 代理 (AI Agent / LLM)**:
  - 📜 **[AGENTS.md](./AGENTS.md)** - 唯一的專案級 AI 事實來源，先讀它，再執行其他入口說明。
  - 🧭 若當前平台存在專屬適配檔案或 Rules，請只將它們視為工具差異補充；若與 `AGENTS.md` 衝突，一律以 `AGENTS.md` 為準。
  - 🗺️ **[專案地圖](./docs/index.md)** - 快速建立專案上下文。
  - 遵循專案內建的 **PDTFC+ 循環** 執行任務。

## 📚 文檔

詳細的開發與設計文檔請訪問：[**墨梅部落格文檔站**](https://docs.momei.app/zh-TW/)

主要章節：

-   [**快速開始**](https://docs.momei.app/zh-TW/guide/quick-start) - 一鍵部署與啟動
-   [**方案比較**](https://docs.momei.app/zh-TW/guide/comparison) - 為什麼選擇墨梅？
-   [**部署指南**](https://docs.momei.app/zh-TW/guide/deploy) - Vercel / Docker / 私有伺服器
-   [**環境與系統設定**](https://docs.momei.app/zh-TW/guide/variables) - 環境變數、設定中心映射與鎖定策略
-   [**開發指南**](https://docs.momei.app/zh-TW/guide/development) - 環境搭建與貢獻
-   [**API 設計**](https://docs.momei.app/zh-TW/design/api) - 介面規範與定義
-   [**資料庫設計**](https://docs.momei.app/zh-TW/design/database) - 表結構與關聯

## 📦 依賴要求

-   Node.js >= 20
-   PNPM（推薦）

## ☁️ 部署說明

### 支援情況

建議使用 Vercel、Netlify、Docker 或自託管 Node 環境進行部署。若你需要接入 Cloudflare，當前僅建議用於 R2 物件儲存與 Scheduled Events 等外圍能力。受 TypeORM 與 Node 執行時依賴限制，現版本暫不支援將應用主體完整部署到 Cloudflare Pages / Workers。

當前版本的部署配置以環境變數為主，建議優先閱讀 [部署指南](https://docs.momei.app/zh-TW/guide/deploy) 與 [環境與系統設定](https://docs.momei.app/zh-TW/guide/variables)，先完成核心變數，再按需啟用 AI、物件儲存、ASR、Webhook 定時任務等增強能力。

點擊下方按鈕可一鍵部署到 Vercel。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### 資料庫支援

墨梅原生支援以下資料庫：

-   **SQLite**: 預設選項，無需配置伺服器，適合個人部落格。建議設定 `DATABASE_URL=sqlite://database/momei.sqlite`。
-   **MySQL / PostgreSQL**: 適合有更高資料管理需求的使用者，透過 `DATABASE_URL` 協議頭自動推斷。
-   **Cloudflare D1**: 規劃中。此規劃不代表現版本已支援 Cloudflare 執行時整站部署；現階段仍建議使用外部資料庫，並將應用主體部署在 Vercel、Docker 或自託管 Node 環境。

詳情請參考 [部署指南](https://docs.momei.app/zh-TW/guide/deploy)。

## 🔄 Hexo 遷移工具

墨梅提供了獨立的 CLI 工具，幫助你從 Hexo 部落格系統快速遷移文章。

### 功能特色

- ✅ 遞迴掃描目錄中的所有 Markdown 檔案
- ✅ 精確解析 Hexo Front-matter（YAML 格式）
- ✅ 保留發佈時間、分類、標籤等中介資料
- ✅ 支援透過 API Key 批量匯入
- ✅ 支援並行匯入，提高效率
- ✅ 支援 Dry Run 模式預覽

### 快速使用

```bash
# 進入 CLI 目錄
cd packages/cli

# 安裝依賴
pnpm install

# 建構工具
pnpm build

# 預覽匯入（不實際匯入）
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose

# 正式匯入
pnpm start import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here
```

詳細使用說明請查看 [packages/cli/README.md](./packages/cli/README.md)。

## 🚀 快速開始

### 安裝依賴

```bash
pnpm install
```

### 啟動開發伺服器

```bash
pnpm dev
```

### 建構正式版本

```bash
pnpm build
```

### 執行測試

```bash
pnpm test
```

### 程式檢查

```bash
pnpm lint
pnpm lint:i18n
```

## 👤 作者

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 貢獻

歡迎貢獻、提問或提出新功能。
如有問題請查看 [Issues](https://github.com/CaoMeiYouRen/momei/issues)。
貢獻指南請查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 💰 支持

如果覺得這個專案有幫助，歡迎給一顆 ⭐️，非常感謝。

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="在愛發電支持我">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/momei&type=Date)](https://star-history.com/#CaoMeiYouRen/momei&Date)

## 📝 License

Copyright © 2025 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).

本專案採用雙重授權：
- 代碼部分：依 [MIT](./LICENSE) 授權。
- 文檔部分：依 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant) 授權。

**本專案的 Logo 不在上述 License 範圍內，圖片版權由專案所有者 [CaoMeiYouRen](https://github.com/CaoMeiYouRen) 保留。若要進行商業化使用，需更換 Logo。非商業化使用的情況允許在不影響專案所有者權益的前提下使用。**

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
