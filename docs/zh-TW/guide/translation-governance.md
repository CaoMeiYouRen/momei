---
source_branch: master
last_sync: 2026-03-10
---

# 翻譯治理與貢獻流程

::: warning 翻譯說明
本頁翻譯自 [中文原文](../../guide/translation-governance.md)。若有差異，請以原文為準。
:::

## 1. 目標與範圍

本文定義墨梅多語言文案與文件的治理方式，避免出現 UI 已翻譯、但郵件、SEO 或回歸校驗尚未補齊的半完成語言。

涵蓋範圍：

- App UI locale 檔案
- 郵件 locale 文案
- 文件站公開頁面
- 語言發佈相關的 SEO、站點地圖與回退策略

## 2. 發佈分級

- `draft`：僅供本機驗證，不進入公開語言切換入口。
- `ui-ready`：完成核心 UI、語言入口、回退鏈與基礎品質校驗。
- `seo-ready`：在 `ui-ready` 基礎上補齊郵件、SEO、站點地圖與回歸檢查。

## 3. 五類門禁

1. 模組 parity：高頻模組鍵集完整。
2. UI 依賴：PrimeVue、Locale Registry、語言切換、日期與數字格式生效。
3. 郵件鏈路：驗證、重設密碼、安全提醒等郵件具備獨立 locale。
4. SEO 鏈路：語言路由、canonical、hreflang、sitemap 與 readiness 一致。
5. 文件入口：至少具備首頁、快速開始、翻譯治理頁。

## 4. 貢獻流程

1. 先定義目標語言與階段目標。
2. 優先補齊高頻頁面與關鍵後台流程。
3. 若某模組暫不翻譯，需連回原文，不得留空或保留英文占位。
4. 合併前至少執行：

```bash
node scripts/i18n/audit-locale-keys.mjs --fail-on-missing
pnpm lint
pnpm typecheck
```

## 5. 術語約束

- 專有名詞可保留英文，例如 `OpenAI`、`Cloudflare R2`、`VAPID`。
- 繁體中文不得殘留簡體字。
- 同一術語在同一語種內保持一致。
