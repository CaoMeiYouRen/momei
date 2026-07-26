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

### 1. 设置表单 UI Phase 1 — 盘点与 SoT 映射补齐 (P2)

- [ ] 产出现有配置项缺口清单（缺口 A/B 分类）
- [ ] 为 ≥3-5 个 env var 补充 SettingKey + SETTING_ENV_MAP 映射
- [ ] 不适合后台管理的标记 INTERNAL_ONLY，更新 env.ts 注释
- [ ] **验收**: typecheck + lint 通过；3-5 个映射补齐

### 2. 响应式状态模型收敛 — reactive→ref Step 4 (P1)

- [ ] 优先迁移筛选类 reactive（user-filters / notification-delivery-log-list / waitlist / subscribers）
- [ ] 迁移简单表单错误类（submit.vue. errors）
- [ ] 视时间推进表单/弹窗类（admin-taxonomy-page / marketing-campaign-form / comment-form）
- [ ] 每文件配定向测试验证回归
- [ ] **验收**: ≥5 处迁移完成；typecheck + lint 通过；交互无回归

### 3. 结构复用治理 — 下一轮热点切片 (P1)

- [ ] 检查 duplicate-code 基线热点分区，识别重复候选
- [ ] 优先检查 Phase 62 新增代码是否引入重复
- [ ] 完成 ≥2 组热点切片收敛
- [ ] **验收**: ≥2 组切片完成；duplicate-code 基线 ≤0.39%；typecheck + lint 通过

### 4. 测试覆盖率 90%+ 第五批 (P2)

- [ ] 基于最新缺口报告选取高价值缺口模块
- [ ] 新增测试覆盖，推进全仓 coverage +≥1%
- [ ] **验收**: coverage +≥1%；typecheck + lint + test:coverage 通过

### 5. 翻译质量审计 — ko-KR/ja-JP (P2)

- [ ] Phase A：产出翻译质量审计报告（home/auth/common/components/public/settings/posts 模块）
- [ ] Phase B：修复 ≥10 个问题条目
- [ ] Phase C（可选）：清理可合并的 duplicate key 组
- [ ] **验收**: 审计报告输出；≥10 个问题修复；i18n:audit:missing = 0 保持

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
