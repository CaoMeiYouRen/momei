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

## 第六十四阶段：设置 UI Phase 2 与治理续航

> 本阶段以「1 个新功能 + 4 个优化」组合推进。详细规划见 [项目计划](./roadmap.md#第六十四阶段设置-ui-phase-2-与治理续航phase-64-settings-ui-phase-2--governance-continuation)。

### 1. 设置表单 UI Phase 2 — 首批 UI 组件 (P1)

- [ ] EMAIL_SECURE / EMAIL_EXPIRES_IN / TEMP_EMAIL_DOMAIN_NAME → Email 标签页表单控件
- [ ] AI_MAX_TOKENS / TTS_DEFAULT_VOICE → AI 标签页表单控件
- [ ] 每控件配 i18n 五语种翻译、值校验、env 锁定禁用逻辑
- [ ] **验收**: ≥2 组 UI 组件完成；typecheck + lint 通过

### 2. 响应式状态模型收敛 — reactive→ref Step 5 (P1)

- [ ] admin-taxonomy-page.vue — reactive → ref 迁移
- [ ] marketing-campaign-form.vue — reactive → ref 迁移
- [ ] comment-form.vue — reactive → ref 迁移
- [ ] 每文件配定向测试验证回归
- [ ] **验收**: ≥3 处迁移完成；typecheck + lint + 定向测试通过

### 3. 结构复用治理 — 下一轮热点切片 (P1)

- [ ] 通知翻译 helper 收敛（translateNotificationType / translateChannel / translateStatus）
- [ ] 检查 Phase 63 新增代码是否引入新重复
- [ ] 完成 ≥2 组热点切片收敛
- [ ] **验收**: ≥2 组切片；duplicate-code 基线 ≤0.39%；typecheck + lint 通过

### 4. 测试覆盖率 90%+ 第六批 (P2)

- [ ] server/utils/logger.ts 补充测试（当前 ~72%）
- [ ] utils/shared/privacy.ts 补充测试（当前 ~0%）
- [ ] 基于最新缺口报告选取其他高价值模块
- [ ] **验收**: 新增覆盖 ≥1%；typecheck + lint + test 通过

### 5. ko-KR/ja-JP 文档治理 (P2)

- [ ] Phase A：产出现有翻译文档 freshness 审计报告（docs/i18n/ko-KR + docs/i18n/ja-JP）
- [ ] Phase B：修复翻译文档 last_sync 落后项与内容漂移
- [ ] Phase C：检查 docs/standards/、docs/guide/ 下规范文档的术语一致性
- [ ] **验收**: 审计报告输出；≥5 个文档问题修复；docs:check:source-of-truth 通过

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
