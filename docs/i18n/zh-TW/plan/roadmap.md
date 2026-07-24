---
source_branch: master
last_sync: 2026-07-24
---

# 墨梅專案路線圖

::: warning 翻譯說明
本頁對應 [中文原文](../../../plan/roadmap.md)。規劃內容更新頻繁，若有差異請以中文原文為準。
:::

本文檔展示墨梅的發展藍圖。更細的當前執行項請參考 [待辦事項](../../../plan/todo.md) 與 [待辦歸檔](../../../plan/todo-archive.md)；長期 backlog 已獨立維護於中文 [backlog 文件](../../../plan/backlog.md)。

## 1. 專案概況

- **專案名稱**：墨梅（Momei）
- **核心目標**：打造一套 **AI 驅動、原生國際化** 的開發者部落格平台
- **主要受眾**：開發者、技術作者、跨境內容創作者
- **核心價值**：多語內容治理、AI 創作輔助、現代化前後端體驗、平滑遷移與營運能力整合

## 2. 已完成階段概覽

### 第一至第三階段

- 完成 MVP 內容閉環、基礎國際化與後台能力
- 補齊 AI 摘要、標題、翻譯、標籤與 SEO 增強
- 推進主題系統、評論、渲染增強與部署優化

### 第四至第七階段

- 加入專業內容渲染、安裝精靈、CLI 遷移工具與版本化能力
- 深化多媒體、TTS / ASR、AI 配圖與閱讀體驗
- 強化安全審計、元資料治理與感官體驗增強

### 第八與第九階段

- 收斂系統設定、直傳資產、AI 成本治理與多語 SEO
- 建立 Locale Registry、設定說明層與全球化交付基礎設施

## 3. 最新進展與下一階段

- **第十六至第十七階段已完成審計歸檔**：規範事實源收斂、Review Gate 證據鏈固化、skills / agents 鏡像治理、配置事實源復用、認證會話治理、後台郵件模板、Serverless 長文本翻譯續跑、AI 視覺資產收斂與存量資源連結遷移工具均已收口。
- **第十七階段收口補充**：release 依賴風險門禁與後台新建文章空白草稿跨語言切換回歸也已完成修復，並已沉澱到回歸日誌，未另起新階段。
- **第十八階段已完成審計歸檔**：多引擎瀏覽器驗證、效能預算基線、`html-minifier` 高風險依賴鏈替換、後台 admin locale 大檔拆分、`ja-JP` 升格為 `seo-ready`，以及 WechatSync 微博相容 / 同步前預檢預覽、後台翻譯工作流標籤進度展示均已收口。
- **未納入本輪的治理項已回收到 backlog**：重複純函式 / 型別片段治理因階段容量控管未上收執行，後續仍以中文 [backlog 文件](../../../plan/backlog.md) 為準重新評估。
- **第十九階段已完成審計歸檔**：Skills 可見性分層、回歸日誌索引與對比入口、重複純函式 / 共享型別首輪復用，以及 PostgreSQL 流量熱點觀測與最小治理，均已完成收口；僅保留 serverless 直寫 fallback 的後續觀察，不再視為本階段阻塞項。
- **第二十階段已完成審計歸檔**：瀏覽器 / E2E 穩定性、Release 與 Review Gate 自動化整合、安全告警閉環與重複代碼檢測腳本化基線，均已在腳本、回歸證據與規劃文檔中完成收口；重複代碼的首批「下一輪處理」候選保留為後續治理事項，不再作為本階段阻塞。
- **第二十一階段已完成審計歸檔**：UI 真實環境驗證流程治理、腳本入口收斂、標籤翻譯前置化，以及預設封面文案壓縮與大字體策略，均已在中文事實源收口。
- **第二十二階段已完成審計歸檔**：測試有效性增強、週期性回歸任務實盤化、文章批量翻譯編排能力評估、ESLint 規則分階段收緊、時間 / 日期事實源收斂，以及後台文章管理入口前置到頂欄六條主線，已在中文事實源完成收口。
- **第二十三階段已完成審計歸檔**：多語社交 / 贊助平台擴展、Vercel 場景下的 AI 媒體超時補償、依賴風險每日巡檢自動化、即時 ASR 憑證有效期延長，以及文章詳情頁相關文章推薦，已在中文事實源完成收口。
- **第二十四階段已完成審計歸檔**：測試覆蓋率與 red-green 有效性、ESLint / 型別債分批收緊、重複代碼 / 純函式收斂，以及帶證據鏈的階段級回歸任務執行四條長期主線，已在中文事實源完成首輪切片與收口。
- **第二十五階段已完成審計歸檔**：部署與初始化體驗、編輯器與正文渲染第二輪收口、構建速度與包體性能深化、Cloudflare 運行時相容研究，以及 AI 初始化 / 配置問答助手評估五條主線，已在中文事實源與歸檔文檔完成收口。
- **第二十六階段已完成審計歸檔**：五條主線已在代碼、回歸記錄與運行期監控中完成收口。全倉 coverage 已達到階段目標（約 `72%`），且在查詢收斂與快取補強後，後台監控顯示 PostgreSQL 查詢與連接壓力已明顯緩解。
- **第二十七階段已完成審計歸檔**：渠道分發回歸、文章分享與圖標系統、快取復用擴面、首屏效能基線與 E2E 首輪驗證均已完成收口，並正式進入歸檔文檔。
- **第二十八階段已完成審計歸檔**：後台內容洞察看板、PostgreSQL CPU / 連線生命週期平衡治理、coverage 提升到 `76%+`、國際化執行期載入治理，以及編輯器 Markdown / 外觀一致性增強五條主線，已在中文事實源、回歸證據與歸檔文檔中收口。
- **第二十九階段已完成審計歸檔**：評論區翻譯、GEO / SEO / AI crawler 可見性補強、ESLint / 型別債分階段收緊、重複代碼 / 純函式復用收斂、國際化第二輪治理，以及文檔 / 回歸 / 深度歸檔治理六條主線，已在中文事實源、回歸證據與歸檔文檔中收口。
- **第三十階段已完成審計歸檔**：遠端倉庫同步（Hexo 風格 / GitHub / Gitee）候選落地已作為本輪唯一新增能力完成收口；文檔翻譯 freshness 清償、國際化字段治理、重複代碼 / 純函式復用、存量代碼註釋治理，以及 ESLint / 型別債規則收緊五條優化主線，也已在中文事實源、回歸證據與歸檔文檔中完成閉環。
- **第三十一階段已完成審計歸檔**：`caomei-auth` 第三方登入支援評估與接入預研、路線圖 / Todo 深度歸檔治理、國際化執行期載入與文案復用治理、`composables` 子桶 ESLint / 型別債收口、coverage `76%+` 關閉，以及商業化轉型重評六條主線，已在中文事實源、回歸證據與歸檔文檔中完成閉環。
- **第三十二階段已完成審計歸檔**：多語言內容資產化增強包的統一承接入口、重複代碼 / 純函式復用、單規則 ESLint / 型別債切片、Postgres 公開熱讀鏈路治理，以及 AITask stale compensation 派生切片，已在中文事實源與歸檔文檔中完成收口。
- **第三十三階段已完成審計歸檔**：創作者統計、`80%+` coverage 衝刺重啟、`composables` ESLint 回退切片、重複代碼收斂，以及候選組 B 存量代碼註釋治理，已在中文事實源與歸檔文檔中完成收口。
- **第三十四階段已完成審計歸檔**：以 Volcengine 為起點的前端直出 TTS + 直傳 OSS 原型、全倉 lines `80.05%` checkpoint、真實 `pnpm regression:phase-close`、下一輪 ESLint 切片、i18n 執行期擴面，以及文檔翻譯 freshness 清償，已在中文事實源、回歸證據與歸檔文檔中完成收口。
- **第三十五階段已完成審計歸檔**：AI task 計量口徑校準與 TTS 前端直連防回歸（含 Volcengine 前端直連計費閉環）、Postgres 熱點公開讀鏈路與資料庫喚醒繼續治理（含 `pg_stat_statements` 對照採樣證明首頁 popular posts 前置 settings 查庫已移除）、ESLint / 型別債下一輪窄切片（`server/utils/post-access.ts` 3 處 `any` 收窄）、結構復用治理（`isRecord` / `isPlainRecord` 與 `MaybeReactive<T>` 兩組型別收斂），以及存量代碼註釋治理候選組 A（`server/utils/locale.ts` + `server/middleware/1-auth.ts`），已在中文事實源、回歸證據與歸檔文檔中完成收口。
- **第三十六階段已完成審計歸檔**：`initializeDB()` 並發窗口與 Redis 連線超時治理、TTS 前端直連 / 直傳 OSS backlog 清理、ESLint / 型別債最新窄切片、TTS task 與 `LocaleOption` 結構復用收斂，以及公開讀接口註釋治理候選組 C，已在中文事實源與歸檔文檔中完成收口。
- **第三十七階段已完成審計歸檔**：Windows 本地 `nuxt dev` / `nuxt build` 效能治理、高風險測試有效性切片、下一輪 ESLint / 型別債窄切片、至少 3 處結構復用熱點，以及 PostgreSQL 長窗口複核切片，已在中文事實源、回歸證據與歸檔文檔中完成收口。
- **第三十八階段已完成審計歸檔**：`B 站 / Memos` 標籤尾注與預覽一致性、測試有效性第二輪切片、Postgres 公開熱讀單路徑止損與根因收斂、結構復用第二輪，以及下一輪 ESLint / 型別債窄切片，已在中文事實源、回歸證據與歸檔文檔中完成收口。
- **第三十九階段已完成審計歸檔**：微信公眾號格式預覽 / 導出輔助，以及結構復用、注釋治理、文檔 / 腳本治理、國際化文案復用四條治理切片，已在中文事實源完成收口，並同步完成歸檔與路線圖狀態更新。
- **第四十階段已完成審計歸檔**：release / test / docker 三條 workflow 已統一 pre-check 入口並固定守護順序；TypeORM `1.0.0` 兼容性評估已完成收口，結論維持 `NO-GO（直接升級）` 與 `GO（評估任務收口）`；相關證據已回填至中文回歸活動窗口與歸檔文檔。
- **第四十五階段已完成審計歸檔**：Umami 隱私自托管分析 Phase 1、Digital Garden go/no-go 評估、文檔治理收口、ESLint / 型別債窄切片與結構復用收斂五條主線，已在中文事實源完成收口並完成歸檔。
- **第四十六階段已完成審計歸檔**：Umami 隱私自托管分析 Phase 2 部署收口、ESLint / 型別債窄切片、結構復用熱點收斂、覆蓋率治理、週級回歸收口與資料庫初始化/文檔同步六條主線，已在中文事實源完成收口；最新週級回歸結論為 `Pass`（僅保留 `duplicate-code:check` warning）。
- **第四十七至第四十九階段已完成審計歸檔**：第四十七階段完成 ESLint/型別債、結構復用、API 路徑規範化、未使用 API 清單與 Schema 覆蓋六條治理主線；第四十八階段完成 ESLint 窄切片擴展、結構復用深度收斂、API Schema 全面覆蓋（→85%）、未使用 API 安全刪除與第二輪調研；第四十九階段完成 Postgres 流量治理（網路 89% 耗盡警戒）、formatDate 復用、延期測試回填與清理收口。
- **第五十階段已完成審計歸檔**：PWA 功能開啟（`@vite-pwa/nuxt` 啟用）、API 測試分層收斂（4 組遷移）、i18n 首屏翻譯穩定性治理（命中矩陣 + 3 處修復）、backlog 深度清理（Phase 32-41 歸檔壓縮）、友鏈前後部落格環導航評估（Go 結論）。已在中文事實源完成收口。
- **第五十一階段已完成審計歸檔**：types/utils 邊界收斂（衝突清單 + 治理文檔 + 3 組樣本遷移）、跨包複用評估（完整方案 No-Go / 輕量方案條件性 Go + 評估文檔）、ESLint / 型別債 ≥5 組窄切片（11 處 as any 消除）、結構複用 ≥5 組熱點切片（commercial-link-manager 參數化 + UploadType/ApiResponse 統一事實源 + use-voice-input 刪除 + formatDate 複用）、backlog 長期主線狀態同步（10 條主線更新至 ≥Phase 48）。已在中文事實源完成收口。
- **第五十二階段已完成審計歸檔**：腳本治理 warning 清理與升格評估（audit-comment-drift 誤報清理、line-count 閾值調整、source-of-truth 同步、audit-comment-drift→regression:weekly 升格）、文檔治理歸檔審計與閾值收緊評估（5 個評估文檔歸檔、must-sync 30→21 天、summary-sync 45→30 天）、移動端 CWV 性能基線採集與評估（LCP 1.6s-2.2s，均在 2.5s 以下）、i18n 運行時驗證擴面（首頁 + 文章詳情頁面新增）、測試有效性第二輪切片（9 個失敗路徑斷言，覆蓋 4 個模組）。已在中文事實源完成收口。
- **第五十三階段已完成審計歸檔**：Vercel CDN 快取 Tier 2 架構治理（routeRules ISR/SWR + Upstash Redis）、文檔治理閾值收緊（must-sync 21 天、summary-sync 30 天）、ESLint/型別債清零（最後 3 處 as any）、結構複用 5 組熱點切片（duplicate-code 0.39%→0.24%）、AI 編輯增強評估（條件性 Go）。
- **第五十四階段已完成審計歸檔**：CLI/MCP API 用戶端複用優化階段一（CLI +3、MCP +4）、結構複用深水區（單函數檔案整合 + 邏輯重複檢測腳本）、ESLint/型別債治理（規則債 inventory 腳本 + 3 組窄切片）、測試有效性第二輪（6 個新斷言、3 個模組）、腳本治理（eslint-debt 升格到 regression:weekly）。
- **第五十五階段已完成審計歸檔**：CLI/MCP 階段二外部介面擴展（4 組 REST + 靈感轉文章 + 文章版本、CLI +15、MCP +16）、AI 降級備用路線（fallback 鏈 + 透明切換）、結構複用邏輯重複收斂（2 組抽象切片、duplicate-code 0.33% < 基線 1.22%）、ESLint/型別債 3 組窄切片（消除 22 處）、測試有效性第三輪（7 個新斷言、3 個模組）。
- **第五十六階段已完成審計歸檔**：共享 API 客戶端庫提取（`packages/api-client` + `MomeiHttpClient` + 7 領域模組 + 29 測試、CLI/MCP axios 移除）、CLI 匯出命令（`momei export` + Hexo 相容 Front-matter + 篩選參數 + JSON 輸出）、ESLint/型別債 3 組窄切片（`submission.ts`、`settings.vue`、`commercial-link-manager.vue` no-explicit-any 消除）、結構複用 2 組熱點切片（`prepareSplitContent` + `parseTranslateBody` 共享函數、duplicate-code 0.30%）、測試有效性第四輪（6 個新錯誤路徑斷言、translate + tts-task-get 2 模組）。
- **第五十七階段已完成審計歸檔**：遷移體驗增強（本地圖片自動上傳、`updatedAt` 元資料欄位擴展）、測試有效性第五輪（13+ 失敗路徑斷言覆蓋 4 模組）、ESLint/型別債 3 組窄切片（validate-api-key、translation、types/ai）。結構複用延期至第五十八階段。
- **第五十八階段已完成審計歸檔**：MCP HTTP 傳輸與掛載（`server/plugins/mcp-http.ts` + `server/api/mcp/index.ts`）、RSS 美化（`feed-style.css` + `injectRssStylesheet`）、結構複用 2 組 api-client 型別收斂切片（duplicate-code 0.31%）、ESLint/型別債治理循環關閉（NO_EXPLICIT_ANY_FILES 全部清零）、測試有效性第六輪（12 個失敗路徑斷言覆蓋 3 模組）。
- **第五十九階段已完成審計歸檔**：AI 編輯增強改寫+審查（6 種風格 + 快取）、近期熱門文章列表（`post_view_hourly` 聚合 + `/api/posts/home` 三合一）、Demo Banner 暗色模式修復（透明度實色化）、E2E CI 限流修復 + GHA 分片（共享 build job + 4 矩陣分片，程式碼已提交 `b6b567a7`）、測試覆蓋率 90%+ 首批（缺口報告 + 兩批次 8 文件，~252 行 +1.09%）。
- **第六十階段已完成審計歸檔**：AI 編輯增強續寫（Continue）（`server/api/ai/continue.post.ts` + 編輯器工具欄按鈕 + Ctrl+Z 撤銷 + AI 計費續寫類型）、reactive→ref Step 1 遷移（5 文件：登錄/註冊/權益/個人設置/安全設置）、Zod Schema 復用 Ad Campaign + Ad Placement（`utils/schemas/ad.ts` 共享基對象 + `.partial()` 派生）、測試覆蓋率 90%+ 第二批（69 新測試覆蓋 3 個 AI Provider 模組）、Hugo 格式多平台遷移適配器（`ContentParser` 介面 + `HugoParser` TOML/YAML/JSON + `--format hugo` CLI 參數 + 17 單元測試）。全部主線通過 Code Auditor 審計。
- **翻譯頁範圍說明**：本頁保留近期已完成審計階段的摘要；詳細驗收標準與任務拆解仍以中文 `roadmap.md`、`todo.md` 為唯一事實源。

## 4. 長期積壓方向

> [!NOTE]
> 長期 backlog 已改由中文 [backlog 文件](../../../plan/backlog.md) 獨立維護；本頁不再重複展開清單，以避免翻譯摘要與實際優先級漂移。

## 5. 閱讀與使用建議

- 若你要了解最完整規劃，請直接閱讀 [中文原文](../../../plan/roadmap.md)。
- 若你準備參與當前階段工作，建議搭配 [規劃規範](../standards/planning.md) 與 [翻譯治理流程](../guide/translation-governance.md) 一起閱讀。
