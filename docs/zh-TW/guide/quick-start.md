---
source_branch: master
last_sync: 2026-03-10
---

# 快速開始

::: warning 翻譯說明
本頁依據 [中文原文](../../guide/quick-start.md) 完整整理；若內容有差異，請以中文原文為準。
:::

歡迎使用墨梅。這份指南會帶你用最快的方式部署並執行自己的部落格，無論你想先快速上線，還是準備進入本機開發，都可以從這裡開始。

## 1. 一鍵部署到 Vercel（推薦）

如果你希望在幾分鐘內取得一個可公開存取的站點，這是最簡單的入口。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen/momei)

1. 點擊上方按鈕。
2. 依照 Vercel 的引導建立或選擇 GitHub 儲存庫。
3. 視需求設定環境變數；若只想先驗證基本流程，可先使用最小配置。
4. 點擊 `Deploy`，等待建置完成。

若你打算正式上線，建議部署後立刻補齊 `AUTH_SECRET`、站點 URL 與資料庫連線資訊，避免後續登入與公開連結生成出現問題。

## 2. 使用 Docker 快速部署

墨梅提供官方 Docker 映像，適合希望在 VPS、家用伺服器或自有容器平台上部署的場景。

### 2.1 基本執行

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

這種方式適合先驗證容器是否能正常啟動，但未包含持久化卷與完整生產設定。

### 2.2 使用 Docker Compose（推薦）

在本機建立 `docker-compose.yml`：

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key # 生產環境必填
        volumes:
            - ./database:/app/database # 持久化 SQLite 資料
            - ./uploads:/app/public/uploads # 持久化上傳檔案
```

然後執行：

```bash
docker-compose up -d
```

若未來要改用 MySQL、PostgreSQL 或外部物件儲存，也可以在 Compose 中逐步補齊對應的環境變數，而不需要重寫整體部署方式。

## 3. 部署到 Cloudflare

如果你偏好更輕量、邊緣節點友善的 Serverless 體驗，可以採用 Cloudflare Pages / Workers 路線：

```bash
pnpm build
pnpm deploy:wrangler
```

更完整的 Cloudflare 相關注意事項，包括儲存搭配、排程觸發與部署模式差異，請參考 [部署指南](./deploy.md#5-部署到主流平台)。

## 4. 本機開發（零設定啟動）

如果你打算本機修改程式、驗證 UI 或參與專案開發，可以直接使用以下流程：

```bash
# 1. 複製儲存庫
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei

# 2. 安裝依賴
pnpm install

# 3. 啟動開發伺服器
pnpm dev
```

墨梅支援開發環境的零設定啟動：

- 自動使用本機 SQLite 資料庫。
- 自動產生開發用 `AUTH_SECRET`。
- 即使沒有 `.env` 也能直接啟動站點。

如需啟用完整能力，建議以 `.env.full.example` 為基礎，並優先對照設定服務與系統設定頁的鍵名映射，特別注意以下變數：

- `AI_QUOTA_ENABLED`
- `AI_QUOTA_POLICIES`
- `ASSET_PUBLIC_BASE_URL`
- `MEMOS_INSTANCE_URL`
- `MEMOS_ACCESS_TOKEN`

啟動完成後，瀏覽器開啟 `http://localhost:3000` 即可查看即時效果。

## 5. 下一步

- **進入後台**：造訪 `/admin` 登入管理端；全新安裝時，請留意終端或初始化流程給出的帳號資訊。
- **啟用 AI 助手**：在 `.env` 中設定 `AI_API_KEY` 等相關配置，即可啟用智慧標題、摘要與翻譯能力。
- **啟用 Memos 同步**：設定 `MEMOS_ENABLED=true`、`MEMOS_INSTANCE_URL`、`MEMOS_ACCESS_TOKEN`。
- **體驗 Demo 模式**：設定 `NUXT_PUBLIC_DEMO_MODE=true`，即可在記憶體資料庫中快速體驗管理後台。

---

::: tip 提示
若你準備正式部署，建議接著閱讀 [部署指南](./deploy.md) 與 [變數與設定映射](./variables.md)，先把核心變數配齊，再逐步啟用 AI、儲存、排程與通知能力。
:::
