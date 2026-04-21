---
source_branch: master
last_sync: 2026-04-21
translation_tier: summary-sync
---

# 翻譯治理與貢獻流程

::: warning 翻譯說明
本頁翻譯自 [中文原文](../../../guide/translation-governance.md)。若有差異，請以原文為準。
:::

本文定義墨梅多語言文案與文件的協作規則，目標是避免出現「頁面已翻譯，但系統鏈路、郵件、SEO 或回歸驗證尚未補齊」的半完成語言狀態。

## 1. 目標與適用範圍

本流程適用於以下內容：

- 應用前端詞條與模組文案
- 郵件模板文案
- 文件站公開頁面
- 文件倉庫路徑與公共 URL 映射
- 與語言發佈相關的 SEO、站點地圖與回退策略

治理的核心不是只把文字換成另一種語言，而是確保新增語言可以在產品、通知、文件與搜尋入口中形成閉環。

## 2. 語言發佈分級

新增語言採用分級准入：

- `draft`：僅允許本機驗證，不進入公開語言切換入口。
- `ui-ready`：完成核心 UI、語言入口、回退鏈與基礎品質校驗，可對外展示。
- `seo-ready`：在 `ui-ready` 基礎上補齊郵件、SEO、站點地圖與回歸檢查，可視為正式全球語言發佈。

### 發佈原則

- 預設先達成 `ui-ready`，避免一次追求過度完美而拖慢主線交付。
- 未通過回歸驗證的語言，不得升級為 `seo-ready`。
- 針對快速迭代模組，可暫時回退到原文，但必須在待辦與文件中明確標註。

## 3. 模組覆蓋清單

每次新增語言至少要確認以下五類門禁：

1. **模組 parity**：`common`、組件、公共頁、認證、設定、首頁、法律頁等高頻模組具備完整鍵集。
2. **UI 依賴**：PrimeVue locale、語言切換入口、Locale Registry、日期與數字格式均正確生效。
3. **郵件鏈路**：註冊、驗證碼、重設密碼、安全提醒等郵件文案具備獨立 locale，不依賴錯誤回退。
4. **SEO 鏈路**：語言路由、canonical、`hreflang`、sitemap 與 readiness 保持一致。
5. **文件入口**：文件站首頁、快速開始、翻譯治理頁至少具備可訪問版本。

## 3.1 文件 freshness 分層

文件翻譯不再使用一條通吃的 30 天規則，而是依 tier 分層治理：

| tier | freshness | 適用形態 |
| :--- | :--- | :--- |
| `must-sync` | 30 天 | 與中文原文保持操作等價的公共入口頁 |
| `summary-sync` | 45 天 | 可以較短，但必須同步現行規則的摘要頁 |
| `source-only` | 無天數 SLA | 只保留 locale URL 與中文原文入口，不承諾持續維護正文 |

目前 `zh-TW` 對外承諾的主要範圍是首頁、快速開始、部署指南、翻譯治理、功能特色、變數與設定映射與路線圖摘要。深層 guide / standards / design 頁面已改為 `source-only`。

## 4. 術語約束

翻譯時需遵循以下基本規則：

- 保留產品名、協議名、雲服務商名與主流技術名，例如 `OpenAI`、`Cloudflare R2`、`Live2D`、`VAPID`。
- 同一術語在同一語言中必須保持一致，不可同頁混用多種譯法。
- `Locale Registry`、`readiness`、`fallback` 等治理詞彙需盡量與設計文件保持一致。
- 繁體中文不得殘留簡體字。

建議在提交前抽樣檢查以下高風險詞：

- 狀態詞：啟用、停用、發佈、審核、失敗、成功
- 設定相關詞：上傳、郵件、友站連結、巡檢、音訊、圖像、同步
- AI 治理詞：額度、閾值、成本、併發、告警、供應商

## 5. 貢獻流程

### 5.1 開始前

1. 明確目標語言與階段目標，是補齊 `ui-ready` 還是推進到 `seo-ready`。
2. 檢查對應模組是否已有 locale 檔案、郵件 locale 與文件目錄。
3. 更新 [todo.md](../../../plan/todo.md) 中的當前階段狀態，避免重複勞動。

### 5.2 翻譯中

1. 優先補高頻路徑，例如首頁、認證、設定、法律頁與後台關鍵鏈路。
2. 新增文件頁時，優先同步首頁、快速開始與翻譯治理頁。
3. 翻譯文件的物理路徑統一放在 `docs/i18n/<locale>/`，對外文件站 URL 維持 `/<locale>/...`。
4. 目錄遷移已完成，不再保留或重新建立 `docs/<locale>/`；若發現遺留翻譯頁，必須在同一變更中移到 `docs/i18n/<locale>/`，並保持 rewrites / editLink 映射正確。
5. 若某模組暫不翻譯，應保留原文來源說明，而不是留空或放英文占位。
6. 若頁面降級為 `source-only`，必須補上 `translation_tier: source-only`、`source_origin`，並在頁面正文明示「中文事實源優先」。

### 5.3 提交前

至少執行以下檢查：

```bash
pnpm docs:check:source-of-truth
pnpm docs:check:i18n
pnpm lint
pnpm lint:i18n
pnpm i18n:audit:missing
pnpm typecheck
```

若本輪涉及郵件或關鍵業務鏈路，建議再執行對應定向測試。

## 6.1 文件 blocker 門禁

| 情境 | 最低命令 | blocker 規則 |
| :--- | :--- | :--- |
| 文件翻譯改動 | `pnpm docs:check:source-of-truth` + `pnpm docs:check:i18n` | tier 宣告、freshness 或來源頁對映不一致即為 blocker |
| locale 訊息 / runtime loading 改動 | 上述命令 + `pnpm lint:i18n` + `pnpm i18n:audit:missing` | 缺 key 與 runtime loading 回歸即為 blocker |
| 發版 / 階段收口 | `pnpm regression:pre-release` 或 `pnpm regression:phase-close` | 不得以臨時命令組替代固定回歸入口 |

## 6. 回歸檢查清單

每輪語言擴展完成後，建議依下列順序回歸：

1. 語言切換入口是否可見且能正確切換 locale。
2. 公共頁與後台關鍵頁是否仍有明顯未翻譯占位。
3. 郵件 locale 是否已獨立註冊，未復用其他語言對象。
4. i18n audit 是否通過，且沒有缺失 key。
5. 文件站對應語言首頁與快速開始頁是否可正常訪問。
6. 已降級為 `source-only` 的頁面是否不再佔用 locale 導航，且仍保留中文原文入口。

## 7. PR / 交付說明建議

提交翻譯相關變更時，建議在說明中至少包含：

- 本輪新增或補齊的語言與模組
- 是否涉及獨立郵件 locale
- 是否新增文件站頁面
- 已執行的驗證命令與結果
- 仍未覆蓋的模組或已知殘留
