---
source_branch: master
last_sync: 2026-11-14
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
- **第六十一階段已完成審計歸檔**：AI 編輯增強擴寫+縮寫（`/api/ai/expand` + `/api/ai/condense` 端點、編輯器工具欄按鈕、`AI_PROMPTS.EXPAND` + `CONDENSE` 模板、AI 計費擴寫/縮寫類型）、結構複用治理（CLI 包型別收斂：枚舉派生 + `@deprecated` 類型別名、`toDateOrNull`/`toDateOrUndefined` 抽取至 `server/utils/date.ts`）、reactive→ref Step 2 遷移（9 處後台列表頁 reactive 物件遷移）、測試覆蓋率 90%+ 第三批（4 個高價值模組：installation.ts 86.84%、comment.ts 86.82%、admin-drafts.ts 92.45%、post-automation-helpers.ts 全覆蓋）、Zod Schema 復用治理第二批（Category/Tag 冗餘清理、Post 4 字段共享、Marketing Campaign updateSchema）。全部主線通過 Code Auditor 審計。
- **第六十二階段已完成審計歸檔**：多平台遷移適配器 WordPress Parser（`602326cb`，WXR 解析 + `--format wordpress` CLI 參數 + 17 測試，Hexo/Hugo 無回歸）、測試覆蓋率 90%+ 第四批（`98d5268c`，26 測試覆蓋 4 個工具函數至 100%）、AI 編輯視角/讀者視角檢查（`f48f39b3`，`/api/ai/perspective-check` 端點支援 `mode: 'editor' | 'reader'` + 編輯器工具欄按鈕 + `PostEditorPerspectivePanel` + AI 計費）、reactive→ref Step 3 遷移（`405825cb`，3 文件 18 處深層巢狀 reactive 替代：settings-notifications/comments/submissions + 11 個定向測試通過）、腳本治理 warning 清理（`ab87cd32`，audit-comment-drift TODO 歸零 + 逐行複述誤報 15→6 -60% + docs candidate warning 清潔）。全部主線通過 lint/typecheck/test/docs:build 品質門（4198 測試通過）。
- **第六十三階段已完成審計歸檔**：設置表單 UI Phase 1 盤點（5 個 SettingKey+SETTING_ENV_MAP 映射）；reactive→ref Step 4 遷移（5 文件）；結構複用 2 組切片（getErrorDetail 抽取 + 編輯器 SCSS 共享，duplicate-code 0.39%→0.35%）；測試覆蓋率 90%+ 第五批（22 新測試覆蓋 3 模組）；翻譯品質審計 ko-KR/ja-JP（10 問題修復）。全部主線通過 typecheck+lint+test。
- **第六十四階段已完成審計歸檔**：設置表單 UI Phase 2 首批 UI 組件（EMAIL_SECURE/EMAIL_EXPIRES_IN/TEMP_EMAIL_DOMAIN_NAME/AI_MAX_TOKENS/TTS_DEFAULT_VOICE 5 字段 + 五語種翻譯）；reactive→ref Step 5 收尾（admin-taxonomy-page/marketing-campaign-form/comment-form 3 文件）；結構複用 2 組切片（safeDeleteCategory + handleExternalLinkError，duplicate-code 基線 0.35%）；測試覆蓋率第六批（privacy.ts 7 邊緣 case）；ko-KR/ja-JP 文檔治理（freshness 審計報告、ko-KR 13 文件日期修復、ja-JP 升級為已支援、features/variables 翻譯）。全部主線通過 typecheck+lint+test。
- **第六十五階段已完成審計歸檔**：編輯器工具欄收斂 Phase A（10→5 按鈕摺疊 + 標題欄彈性寬度，`e936ec1e`）；設置表單 UI Phase 3（AI_TEMPERATURE/AI_CHUNK_SIZE/AI_FALLBACK_PROVIDER/TTS_CREDENTIAL_TTL_SECONDS + ExternalFeedSourcesEditor，`01ce9670`）；結構複用治理（Categories/Tags 共享查詢層，消除 226 行重複，duplicate-code 基線 0.34%→0.30%）；腳本治理升格評估（simple-duplicates 升格至 regression:weekly warning 面）；測試覆蓋率 90%+ 第七批（新增 3 個測試文件，全倉 79.48% 未達 ≥1% 目標，轉入長期治理）。vitest.shared.ts 統一為 forks 池修復 `<repo-root>/tmp` 競態；新增 regression-weekly.yml 定時 CI 回歸工作流。所有已交付主線均通過 typecheck+lint+test。
- **第六十六階段已完成審計歸檔**：編輯器工具欄收斂 Phase B（續寫/擴寫/縮寫新增 `style` 參數，複用 6 種風格定義）；設置表單 UI Phase 4（AI_FALLBACK_API_KEY/MODEL/ENDPOINT 表單控件 + 五語種翻譯，AI Image Fallback 4 項留 Phase 5）；結構複用治理（`use-theme-color-models.ts` composable 抽取，duplicate-code 基線 0.31%→0.30%，`8fb91ecd`）；測試覆蓋率 90%+ 第八批（`85d69d7d`，5 個高價值模組補測 58 用例：text.ts 94.82% / tts.ts 88.63% / parser.ts 92.00% / aggregator.ts 97.56% / category.ts 98.63%，全倉 Statements 79.55%→80.63% 達到 ≥80.48% 目標）；腳本治理 comment-drift 升格複核（`1fc73e54`，結論 go 維持 Phase 52 已升格狀態，收口 7 處文檔漂移）。全部主線通過 typecheck+lint 並完成 Code Auditor Review Gate。
- **第六十七階段已完成審計歸檔**：PrimeVue → caomei-ui 遷移第一階段——接入基座重錨至 `caomei-ui@0.2.0`（`theme.css` 注入點唯一、`keyCss` 配額回落 70KB 並刷新基線）；三層視覺驗證回歸基座落地為獨立截圖工程（6 張基線 + 假陽性/假陰性雙向驗證 + CI `visual` job 初期 `continue-on-error`）；全局 token 語義層橋接以 unlayered `html:root` 落地並配級聯契約守衛；B2 試點頁 `/admin/comments` 完成整路由切換（在冊組件族零殘留守衛 + 三層回歸 + 視覺差異逐項歸因）。本階段另產出共享殼過渡組件替換清單與上游 caomei-ui 回饋問題清單；後續批次方向見[遷移方案 §7](../../../design/governance/2026-09-18-primevue-to-caomei-ui-migration-plan.md)。`caomei-ui@0.3.0` 已於 2026-09-24 發布且無破壞性變更，為目標基線；升級與基線複測已登記為該長期主線的待執行條目。
- **第六十八階段已完成審計歸檔**：PrimeVue → caomei-ui 遷移第二階段已收口——`caomei-ui` 0.3.0 升級與基線複測完成（版本口徑於 2026-10-13 對齊至 0.6.0，並補做 `BREAKING CHANGES` 閱讀、組件清單重數 81 項、三層視覺回歸 10/10 零像素差異與包體複測 `keyCss` 61,311 B / 70KB 未越線）；B2 剩餘 10 個資料列表路由 + 3 個組件型目標 host 路由完成整路由遷移（5 件共享殼過渡組件、`CAOMEI_UI_ROUTE_PREFIXES` 終態 15 項）；測試覆蓋率第九批 4 個模組全數達成，全倉 Statements 80.45% → 81.04%（全倉 +1pp 因候選池體量結構上不可達，已記錄原因並轉長期主線）。B3 表單與設置併浮層類延至第六十九階段，B4 收尾與 PrimeVue 卸載為第七十階段（舊軌跡；2026-11-01 已重切為 69–71，見下條）。
- **第六十九階段已完成審計歸檔（2026-11-03）**：`caomei-ui@1.0.0-rc.1` 精確鎖定並接通 6 個新 token 角色（視覺 18/18、parity 34/34、`keyCss` 62,382 B / 70KB、soft 8% 底狀態文字兩態均 ≥ 4.5）。浮層族（Dialog / Drawer / Popover / Menu / ConfirmDialog + Toast/Confirm 服務 + `v-tooltip` 84 處改由 `AppTooltip` 承接）整族遷移完成，並落地全倉零殘留守衛與 critical E2E 三瀏覽器通過。內建文案改由應用語言驅動（5 語種分頁文案實測、無 hydration mismatch，`coreEntryJs` 357.41KB / 360KB）。覆蓋率第十批閉合 `setting` / `text-translation-task` / `post-automation` 的 68 條未覆蓋語句（模組 statements 90.31% / 95.27% / 93.18%，全倉 80.98% → 81.17%，本批 +0.19pp）。範圍與驗收以中文規劃為準。
- **第七十階段已完成審計歸檔（2026-11-05）**：`caomei-ui@1.0.0` GA 精確升級並把 parity 擴到未安裝態第二 webServer、首次啟用 `reader` 檔；B3 表單與設置按 2a/2b/2c/3/4 完成管理端設置與通知（341 + 42 處）、安裝精靈（87 處）與用戶設置／認證／提交（16 檔案 / 119 處），`Stepper` / `Accordion` / `ColorPicker` / `DatePicker` / `FileUpload` 首次生產遷移；覆蓋率第十一批閉合 95 條（三模組 100% / 98.87% / 100%，全倉 80.40% → 80.66%，本批 +0.26pp）。剩餘遷移面 482 處組件 / 40 類、411 處圖示、1,442 處 token 留待第七十一階段。範圍與驗收以中文規劃為準。 階段收口結論為 **Pass（CI 終裁）**：Code Scanning #45 已隨修復推送重掃關閉，CI E2E 4/4 全綠；首屏包體與重複代碼基線按 2026-11-05 實測重定標（365KB、0.5% / 48 clones）。
- **第七十一階段已完成審計歸檔（2026-11-08）**：B4 剩餘路由與圖示全量已收口——管理端剩餘路由（編輯器 / 儀表板 / 日曆 / 片段 / AI 任務詳情）與公開頁 / 佈局殼整遷；`pi pi-*` 由 136 處清零（非品牌走 `@lucide/vue`，8 類品牌走 `mdi mdi-*`，tiktok / discord / paypal 內聯 Simple Icons）；過渡組件收斂為單一實作（V1 清零、6 組去 `-v2`）；E2E `p-*` 斷言清零、路由守衛覆蓋 35 條（含 `/` 與 `/goto`）；覆蓋率第十二批 +154 條 / +0.42pp；i18n 鍵層與 `friend-link` 歸一化修復。收口複算：組件 188 → **46 處 / 14 類**、圖示 **0**、token 1,420（留第七十二階段）；parity 83/83（41 條已遷移、0 待遷移）、`test:visual` 24/24、CI Test 15 job 全綠、本地 `release:check` 10/10，並經手動觸發的 Release workflow 發布 **v1.30.0**。`--p-*` token 1,420 處切換與 PrimeVue 卸載仍順延至第七十二階段（候選，未落盤）；範圍與驗收以中文 roadmap 與 todo 為準。
- **第七十二階段已審計歸檔（2026-11-09）**：PrimeVue → caomei-ui 遷移完成——1,420 處 `--p-*` token 全數切到 caomei 語意角色（`--caomei-*`）或專案調色盤層（`--m-*`）；剩餘 46 處 PrimeVue 組件歸零；PrimeVue 全家桶（含 `@primevue/*`、`@primeuix/*`、`primeicons`、`primelocale`、Aura 預設、i18n 外掛與路由擇庫機制）已卸載。`p-*` class 151 → 0、`.p-*` 選擇器 83 → 0，並以全倉零殘留守衛兜底；卸載後補回 `box-sizing` / `color-scheme` 兩條執行期全域基線。包體配額收緊：`coreEntryJs` 375,543 → **329,891 B**（335KB）、`keyCss` 64,103 → **60,482 B**（62KB）。覆蓋率第十三批 +140 條（+0.38pp；全倉 81.83%）；視覺 32/32、parity 83/83、E2E critical 17/1 + mobile 2 + 安裝精靈 2、typecheck/lint 全綠。階段收口 `regression:phase-close`：Pass（`regression:phase-close` 12 步中 11 步通过；补齐 Playwright 浏览器后 E2E 复跑 227 passed / 1 flaky / 58 skipped；CI 为最终裁决）。
- **第七十三階段已審計歸檔（2026-11-11）**：遷移後品質收尾與門禁強化——以共享 `AppEmptyState`（圖標 / 說明 / 主操作）統一 7 個檔案的空態、空表僅在 `total > 0` 時渲染分頁、修復三處層序失效；Code Scanning #43 重分類為 false positive 並移除 `--transition-mode`，發布安全門禁恢復完整阻斷；i18n 新增原文級重複鍵掃描與 PR 側缺鍵阻斷；覆蓋率第十四批把 4 模組未覆蓋 171/74/59/22 收斂到 6/3/6/1（全倉 81.79% → 82.63%，+311 條 / +0.84pp）；markdown-it **15.0.3** 遷移並以共享 linkify 相容層接入 5 處渲染器（PR #745 關閉）；nuxt **4.6.4** 與 14 張視覺基線逐處歸因（PR #1004 解阻）。範圍與驗收以中文歸檔為準。階段收口 `regression:phase-close`：Pass。
- **第七十四階段已審計歸檔（2026-11-13）**：工具鏈現代化、門禁轉阻斷與存量缺陷收口——js-yaml 5 與 stylelint 18 + 設定包配對升級、ESLint 嚴格規則首批升檔清零；視覺 parity 以 CI 重採參考態後轉為阻斷，Sentry 客戶端移出入口預載；修復 SQLite 統計分組、儀表板斷點與 TypeORM `_id` 回填；i18n 重複文案收斂並落 allowlist 門禁；`--m-font-size-*` 字階與 47 處等價替換（逐元素 `getComputedStyle` 零差異）；覆蓋率第十五批 +247 條 / +0.67pp（同源口徑）。6 條條目全部完成，範圍與驗收以中文歸檔為準。
- **翻譯頁範圍說明**：本頁保留近期已完成審計階段的摘要；詳細驗收標準與任務拆解仍以中文 `roadmap.md`、`todo.md` 為唯一事實源。

## 4. 長期積壓方向

> [!NOTE]
> 長期 backlog 已改由中文 [backlog 文件](../../../plan/backlog.md) 獨立維護；本頁不再重複展開清單，以避免翻譯摘要與實際優先級漂移。

## 5. 閱讀與使用建議

- 若你要了解最完整規劃，請直接閱讀 [中文原文](../../../plan/roadmap.md)。
- 若你準備參與當前階段工作，建議搭配 [規劃規範](../standards/planning.md) 與 [翻譯治理流程](../guide/translation-governance.md) 一起閱讀。
- **第七十五階段已立項（2026-11-13，2026-11-14 插入條目 7）**：依賴與靜態規則收口、Node 26 執行時基線單點化與治理口徑統一——minimatch / glob 定向 override 評估、deepmerge / quill 無補丁項受控台帳；ESLint #262 第二批 4 條規則（22 命中 / 17 檔案）升檔清零；i18n 64 組 allowlist 三類複核與公開頁 runtime 稽核；覆蓋率第十六批（4 模組，含腳本類大基數）；回歸視窗閾值與 coverage 分母口徑收斂為單點；Node 26.13.1 以 `.nvmrc` 單點宣告，`engines`、22 處 CI 與 Docker 基礎鏡像同源，並做原生模組重建與本機 / 容器雙探針。字級歸一於 2026-11-14 移出至 backlog，維持 6 條條目。
