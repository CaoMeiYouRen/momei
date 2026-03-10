---
source_branch: master
last_sync: 2026-03-10
---

# 快速開始

::: warning 翻譯說明
本頁由中文原文與英文頁面交叉整理而成；若內容有差異，請以 [中文原文](../../guide/quick-start.md) 為準。
:::

歡迎使用墨梅。這份指南會帶您用最快的方式部署並執行部落格。

## 1. 一鍵部署到 Vercel（推薦）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 點擊上方按鈕。
2. 依照 Vercel 指引建立或選擇 GitHub 儲存庫。
3. 視需要設定環境變數。
4. 點擊 `Deploy`。

## 2. 使用 Docker 快速部署

### 2.1 基本執行

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

### 2.2 使用 Docker Compose（推薦）

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key
        volumes:
            - ./database:/app/database
            - ./uploads:/app/public/uploads
```

接著執行：

```bash
docker-compose up -d
```

## 3. 本機開發

```bash
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei
pnpm install
pnpm dev
```

開發模式支援零設定啟動：

- 自動使用本機 SQLite
- 自動產生開發用 `AUTH_SECRET`
- 不需要 `.env` 就能跑起來

若要啟用完整能力，請從 `.env.full.example` 開始設定。

## 4. 下一步

- 前往 `/admin` 登入後台。
- 設定 `AI_API_KEY` 啟用 AI 功能。
- 設定 `MEMOS_ENABLED=true`、`MEMOS_INSTANCE_URL`、`MEMOS_ACCESS_TOKEN` 啟用 Memos 同步。
- 設定 `NUXT_PUBLIC_DEMO_MODE=true` 以體驗示範模式。
