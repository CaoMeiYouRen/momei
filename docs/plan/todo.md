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

## 第六十五阶段：编辑器工具栏收敛与设置 UI 续航

**时间表**: 2026-07-27 ~ 约 1-2 周
**目标**: 在第六十四阶段完成设置 UI Phase 2 与治理续航后，以「2 个增量功能 + 3 个治理切片」组合推进：编辑器工具栏收敛 Phase A 与设置表单 UI Phase 3 作为两条增量功能，测试覆盖率 90%+ 第七批、结构复用治理与脚本治理升格评估作为三条治理切片延续。

**ROI 评估**: 编辑器工具栏收敛 Phase A `2.33`；设置表单 UI Phase 3 `1.75`；测试覆盖率 90%+ 第七批 `1.00`；结构复用治理 `1.60`；脚本治理升格评估 `2.50`。

### 1. ✅ 编辑器工具栏收敛 Phase A（候选 #14）（P1）

- **执行范围**: 将文章编辑器的 10 个独立 AI 按钮折叠为 5 个入口：「AI 写作（SplitButton: 改写/续写/扩写/缩写）」+「AI 审校（审查）」+「AI 翻译」+「格式化」+「语音」，标题输入框获得完整弹性宽度。
- **非目标**: 不改动 MavonEditor 原生工具栏；不改动编辑器页面整体布局；不改动 AI 计费/配额逻辑；不新增 AI Provider。
- **设计文档**: [`docs/design/governance/editor-toolbar-consolidation-eval.md`](../design/governance/editor-toolbar-consolidation-eval.md)
- **最小验收**: ✅ 5 个入口代替原有 10 个按钮；✅ 标题输入框宽度恢复正常；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 编辑器功能无回归（4 单元测试通过 + 14/14 UI 验证通过）。
- **交付**: `e936ec1e`

### 2. ✅ 设置表单 UI Phase 3（候选 #13 延续）（P1）

- **执行范围**: 基于 Phase 1 缺口清单，新增 5 个表单控件——ai-settings.vue 扩展（`AI_TEMPERATURE` InputNumber + `AI_CHUNK_SIZE` InputNumber + `AI_FALLBACK_PROVIDER` Select + `TTS_CREDENTIAL_TTL_SECONDS` InputNumber）+ 第三方标签页新增 `external_feed_sources` 组件（表单或表格模式）；补齐五语种翻译条目及 SettingKey/SETTING_ENV_MAP 映射。
- **非目标**: 不新增独立标签页（归入现有 AI/第三方标签页）；不改动 `FORCED_ENV_LOCKED_KEYS`；不做 AI_IMAGE_FALLBACK 系列（留 Phase 4）。
- **详细方案**: [`docs/design/governance/settings-form-ui-phase1-gap-inventory.md`](../design/governance/settings-form-ui-phase1-gap-inventory.md)
- **最小验收**: ✅ ≥4 个字段 UI 完成（5/5）；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 受影响表单保存/验证通过。
- **交付**: `01ce9670`

### 3. 测试覆盖率 90%+ 第七批（长期主线 #1）（P2）

- **执行范围**: 基于最新全仓覆盖率缺口报告，选取 3-5 个高价值缺口模块（优先 `server/services/` 或 `server/utils/` 层尚未深度覆盖的模块），推进全仓 coverage +≥1%。
- **非目标**: 不做低价值铺量补测；不牺牲断言有效性换取数字增长。
- **最小验收**: 全仓 coverage 提升 ≥1%；`pnpm typecheck` + `pnpm lint` + `pnpm test:coverage` 通过。

### 4. ✅ 结构复用治理（长期主线 #3）（P1）

- **执行范围**: 基于 `duplicate-code` 0.35% 最新基线识别 ≥2 组重复热点；优先检查 Phase 63-64 新增代码是否引入重复。
- **非目标**: 不推动跨模块大重构；不为复用而复用；不改变业务行为。
- **最小验收**: ✅ ≥2 组热点切片完成（Categories + Tags 列表查询共享层抽取）；✅ `duplicate-code` 基线 0.30% ≤ 0.35%；✅ `pnpm typecheck` + `pnpm lint` 通过；✅ 22/22 测试通过。
- **交付**:
  - 新建 `server/utils/category-public-list.ts`：`queryCategoryPublicList()` 共享函数
  - 新建 `server/utils/tag-public-list.ts`：`queryTagPublicList()` 共享函数
  - 4 端点 handler 简化：`api/categories/index.get.ts` / `api/external/categories/index.get.ts` / `api/tags/index.get.ts` / `api/external/tags/index.get.ts`
  - 累计消除 226 行重复（+14/-226），2 克隆消除，基线 0.34%→0.30%

### 5. ✅ 脚本治理升格评估（长期主线 #10）（P1）

- **执行范围**: 评估将 `governance:audit:simple-duplicates` 和 `governance:audit:comment-drift` 从独立 baseline 升格进入 `regression:weekly` warning 面；输出明确 go/no-go 结论与理由；确保所有治理脚本当前清洁运行。
- **非目标**: 不新增脚本；不改脚本 API；不引入新治理基线。
- **最小验收**: ✅ 升格评估报告输出（`docs/design/governance/script-promotion-eval-phase65.md`）；✅ `audit:simple-duplicates` Go → 已加入 `regression:weekly` step 11（required: false）；✅ `audit:comment-drift` 确认已升格（Phase 54 已接入）；✅ 四组治理脚本清洁运行（simple-duplicates 114/11/10, comment-drift TODO=0 restatement=6 drift=136, eslint-debt 0w, check-scripts 50/50/50）。

### 阶段收口检查清单

- [x] 五条主线全部完成验证（✔ 1/2/4/5 完成，3 部分完成待 coverage 验证）
- [ ] `pnpm regression:phase-close` 完整回归测试通过
- [ ] `todo.md` 清理当前阶段执行面
- [ ] `roadmap.md` 同步阶段状态与收口结论
- [ ] 多语路线图摘要已更新
- [ ] Code Auditor Review Gate 通过

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
