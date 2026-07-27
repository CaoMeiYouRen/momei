# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 第六十四阶段：设置 UI Phase 2 与治理续航 ✅

> 本阶段以「1 个新功能 + 4 个优化」组合推进。详细规划见 [项目计划](./roadmap.md#第六十四阶段设置-ui-phase-2-与治理续航phase-64-settings-ui-phase-2--governance-continuation)。

### 1. 设置表单 UI Phase 2 — 首批 UI 组件 (P1) ✅

- [x] EMAIL_SECURE / EMAIL_EXPIRES_IN / TEMP_EMAIL_DOMAIN_NAME → Email 标签页表单控件
- [x] AI_MAX_TOKENS / TTS_DEFAULT_VOICE → AI 标签页表单控件
- [x] 每控件配 i18n 五语种翻译、值校验、env 锁定禁用逻辑
- [x] **验收**: typecheck + tests 通过（5 字段 + 5 语种翻译）

### 2. 响应式状态模型收敛 — reactive→ref Step 5 (P1) ✅

- [x] admin-taxonomy-page.vue — deleteDialog reactive → ref
- [x] marketing-campaign-form.vue — form reactive → ref
- [x] comment-form.vue — form reactive → ref
- [x] 每文件配定向测试验证回归
- [x] **验收**: 3 文件迁移完成；typecheck + 9 tests 通过

### 3. 结构复用治理 — 下一轮热点切片 (P1) ✅

- [x] 通知翻译 helper 收敛（实际已由 Phase 63 getErrorDetail 提取解决）
- [x] 检查 Phase 63 新增代码是否引入新重复
- [x] 完成 2 组热点切片（safeDeleteCategory + handleExternalLinkError）
- [x] **验收**: 2 组切片；duplicate-code 基线保持 0.35%；typecheck 通过

### 4. 测试覆盖率 90%+ 第六批 (P2) ✅

- [x] utils/shared/privacy.ts 补充边缘 case 测试（7 个）
- [x] server/utils/logger.ts 维持已有覆盖（~72%，508 行测试）
- [x] **验收**: 75 tests 通过

### 5. ko-KR/ja-JP 文档治理 (P2) ✅

- [x] Phase A：drift 审计报告 + ja-JP 语种升格（seo-ready → 已支持）
- [x] Phase B：ko-KR 13 文件 last_sync 刷新 + ja-JP features/variables 翻译补齐
- [x] Phase C：documentation.md 矩阵同步 + ja-JP 范围升级
- [x] **验收**: 审计报告 + 13 日期修复 + 2 新翻译文件 + 2 文档更新

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
