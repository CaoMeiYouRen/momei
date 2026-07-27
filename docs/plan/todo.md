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

## 第六十三阶段：设置 UI 盘点与治理续航

> 本阶段以「5 个优化」组合推进。详细规划见 [项目计划](./roadmap.md#第六十三阶段设置-ui-盘点与治理续航phase-63-settings-ui-inventory--governance-continuation)。

### 1. 设置表单 UI Phase 1 — 盘点与 SoT 映射补齐 (P2) ✅

- [x] 产出现有配置项缺口清单（缺口 A/B 分类）
- [x] 为 ≥3-5 个 env var 补充 SettingKey + SETTING_ENV_MAP 映射
- [x] 不适合后台管理的标记 INTERNAL_ONLY，更新 env.ts 注释
- [x] **验收**: typecheck + lint 通过；5 个映射补齐
- **产出**: `docs/design/governance/settings-form-ui-phase1-gap-inventory.md`
- **变更**: 5 个新 SettingKey + SETTING_ENV_MAP 映射 + INTERNAL_ONLY 扩充 + env.ts 注释

### 2. 响应式状态模型收敛 — reactive→ref Step 4 (P1) ✅

- [x] 优先迁移筛选类 reactive（user-filters / notification-delivery-log-list / waitlist / subscribers）
- [x] 迁移简单表单错误类（submit.vue errors）
- [ ] ~~视时间推进表单/弹窗类（admin-taxonomy-page / marketing-campaign-form / comment-form）~~
- [x] 每文件配定向测试验证回归（submit.test.ts 6 passed + 关联测试覆盖）
- [x] **验收**: 5 处 reactive→ref 迁移完成；typecheck + lint + tests 通过；交互无回归
- **迁移清单**: user-filters.vue（internalFilters）、notification-delivery-log-list.vue（filters）、waitlist/index.vue（filters）、subscribers/index.vue（filters）、submit.vue（errors）

### 3. 结构复用治理 — 下一轮热点切片 (P1) ✅

- [x] 检查 duplicate-code 基线热点分区，识别重复候选
- [x] 优先检查 Phase 62 新增代码是否引入重复（perspective-panel SCSS）
- [x] 完成 ≥2 组热点切片收敛
- [x] **验收**: 2 组切片完成；duplicate-code 基线 0.35% ≤ 0.39%；typecheck + lint + tests 通过
- **Slice 1**: `getErrorDetail` 从 5 文件抽取到 `utils/shared/error-detail.ts`，消除 5×13 行重复
- **Slice 2**: `_editor-panel-shared.scss` 抽取，消除 perspective/review panel 3 组 SCSS 克隆
- **基线变化**: 0.39% / 53 clones → 0.35% / 50 clones（-92 行 / -3 克隆）

### 4. 测试覆盖率 90%+ 第五批 (P2) ✅

- [x] 基于最新缺口报告选取高价值缺口模块
- [x] 新增测试覆盖，推进全仓 coverage +≥1%
- [x] **验收**: typecheck + lint + test 通过（56 tests, 3 files）
- **模块1**: `utils/shared/error-detail.ts` — 新建 10 个测试覆盖全部路径至 100%
- **模块2**: `server/utils/settings.ts` — 新增 8 个边缘 case 测试
- **模块3**: `utils/shared/url.ts` — 新增 4 个缺失场景测试

### 5. 翻译质量审计 — ko-KR/ja-JP (P2) ✅

- [x] Phase A：产出翻译质量审计报告（home/auth/common/components/public/settings/posts 模块）
- [x] Phase B：修复 ≥10 个问题条目
- [ ] ~~Phase C（可选）：清理可合并的 duplicate key 组~~（101 组，超容量，延后）
- [x] **验收**: 审计报告输出；10 个问题修复；i18n:audit:missing = 0 保持
- **报告**: `docs/design/governance/i18n-quality-audit-ko-ja.md`
- **修复统计**: ja-JP 5 项（中国语残留 2 + 品牌名 1 + 标语 1 + 格式 1）+ ko-KR 5 项（品牌名 3 + 格式 1 + 标点 1）= **10 项**

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
