# 待办归档分片：第六十四阶段（设置 UI Phase 2 与治理续航）

> 本分片承接 `docs/plan/todo-archive.md` 主窗口迁出的第六十四阶段完整归档块（2026-11-05 第七十阶段收口时迁出，为主窗口保留 65–70 共 6 个近线块腾出余量）。



---



## 第六十四阶段：设置 UI Phase 2 与治理续航（已审计归档）

> 归档说明: 第六十四阶段「1 个新功能 + 4 个优化」已于 2026-07-27 完成五条主线交付与阶段收口。设置表单 UI Phase 2（首批 UI 组件）将 Phase 63 的 SoT 映射落地为 5 个可交互表单控件（EMAIL_SECURE/EMAIL_EXPIRES_IN/TEMP_EMAIL_DOMAIN_NAME/AI_MAX_TOKENS/TTS_DEFAULT_VOICE）并补齐五语种翻译；reactive→ref Step 5 收尾剩余 3 个表单/弹窗类文件（admin-taxonomy-page/marketing-campaign-form/comment-form）；结构复用治理完成 2 组热点切片（safeDeleteCategory + handleExternalLinkError），duplicate-code 基线保持 0.35%；测试覆盖率第六批为 privacy.ts 新增 7 个边缘 case 测试；ko-KR/ja-JP 文档治理完成 freshness 审计报告、ko-KR 13 文件 last_sync 刷新、ja-JP 语种升格为已支持、补齐 features/variables 翻译。所有主线均通过 typecheck + lint + test 质量门。

> **ROI 评估**: 设置表单 UI Phase 2 `1.60`；reactive→ref Step 5 `1.60`；结构复用治理 `1.80`；测试覆盖率 90%+ 第六批 `1.50`；ko-KR/ja-JP 文档治理 `1.50`。

### 1. 设置表单 UI Phase 2 — 首批 UI 组件（P1）

- **执行范围**: 为 Phase 63 新映射的 5 个 SettingKey 开发 PrimeVue 表单控件：email-settings.vue（EMAIL_SECURE ToggleSwitch、EMAIL_EXPIRES_IN InputNumber、TEMP_EMAIL_DOMAIN_NAME InputText）、ai-settings.vue（AI_MAX_TOKENS InputNumber、TTS_DEFAULT_VOICE Select + ttsVoiceOptions computed）。types/setting.ts AISettingsFields 补齐新字段。
- **非目标**: 不新增标签页；不改动 FORCED_ENV_LOCKED_KEYS。
- **实现对照**:
  - `components/admin/settings/email-settings.vue`：新增 3 个表单控件
  - `components/admin/settings/ai-settings.vue`：新增 2 个表单控件 + ttsVoiceOptions computed
  - `types/setting.ts`：AISettingsFields 新增 2 字段
  - `i18n/locales/*/admin-settings.json`：五语种各 5 个翻译条目
- **验收对照**: ✅ 5 字段 UI 完成；✅ 五语种 20 个翻译条目；✅ `pnpm typecheck` + `pnpm lint` + `pnpm test` 通过。

### 2. 响应式状态模型收敛 — reactive→ref Step 5（P1）

- **执行范围**: 补齐 Phase 63 延期的 3 个表单/弹窗类文件 `reactive` → `ref` 迁移。
- **迁移明细**:
  - `components/admin/admin-taxonomy-page.vue`：deleteDialog reactive → ref（6 处 .value）
  - `components/admin/marketing-campaign-form.vue`：form reactive → ref（15+ 处 .value）
  - `components/comment-form.vue`：form reactive → ref（8 处 .value）
- **验收对照**: ✅ 3 文件迁移完成；✅ 所有 template v-model 零改动；✅ `pnpm typecheck` + `pnpm lint` + 9 tests 通过。

### 3. 结构复用治理 — 下一轮热点切片（P1）

- **执行范围**: 基于 duplicate-code 0.35% 基线做增量切片收敛。
- **收敛切片**:
  - Slice 1：`server/utils/category-delete.ts` 新建 `safeDeleteCategory()`，内部/external categories/[id].delete 双端点共用，消除 26 行重复
  - Slice 2：`server/utils/external-links-shared.ts` 新建 `handleExternalLinkError()`，POST + PUT external-links 双端点共用，消除 21 行重复
- **验收对照**: ✅ 2 组切片完成；✅ duplicate-code 基线 0.35%（47 clones，不反弹）；✅ `pnpm typecheck` + `pnpm lint` + 7 tests 通过。

### 4. 测试覆盖率 90%+ 第六批（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告选取高价值模块。
- **测试新增**:
  - `utils/shared/privacy.test.ts`：新增 7 个边缘 case（custom maskString/undefined/maskEmail/@/maskPhone 短值/maskIP IPv4 短段）
  - `server/utils/logger.test.ts`：维持已有 508 行全面覆盖
- **验收对照**: ✅ 75 tests 全部通过；✅ `pnpm typecheck` + `pnpm lint` 通过。

### 5. ko-KR/ja-JP 文档治理（P2）

- **执行范围**:
  - Phase A：产出翻译文档 freshness 审计报告 `docs/design/governance/i18n-docs-freshness-audit-ko-ja.md`
  - Phase B：ko-KR 13 个文档 last_sync 从 2026-03 刷新至 2026-07-27；ja-JP 由 seo-ready 提升为已支持语种
  - Phase C：创建 ja-JP guide/features.md（7 节）和 guide/variables.md（3 节 + 映射表）翻译；documentation.md 矩阵同步 ja-JP 范围升级至与 ko-KR 一致
- **验收对照**: ✅ 审计报告输出；✅ 13 个文档问题修复；✅ ja-JP 升格 + 2 新翻译文件；✅ `docs:check:source-of-truth` 通过。

### 阶段收口检查清单

- [x] `todo.md` 当前阶段条目已完成并清理执行面
- [x] `roadmap.md` 已同步阶段状态与收口结论
- [x] 多语路线图摘要已更新（`docs/i18n/*/plan/roadmap.md`）
- [x] 文档检查已执行：`pnpm typecheck` + `pnpm lint` 通过
- [x] 主干质量门通过（typecheck + lint + test）

---
