# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办

### 第五十二阶段：治理补账与移动性能基线

> 2026-06-23 启动。五条主线均来自 backlog 长期主线。ESLint / 结构复用本轮刻意休息，聚焦最被忽视的治理欠账。

- [x] **主线 1：脚本治理 warning 清理与升格评估 (P0)**
    - [x] 清理 `audit-comment-drift` 误报与 warning 面（TODO 26→1，漂移 316→132）
    - [x] 清理 `docs:check:line-count:candidate` warning（调整候选阈值）
    - [x] 清理 `docs:check:source-of-truth:candidate` warning（更新 last_sync 日期）
    - [x] 升格评估：`audit-comment-drift` → `regression:weekly`（GO，已添加）
    - **验收**: 三条脚本输出清洁；升格评估完成并落盘

- [x] **主线 2：文档治理归档审计与阈值收紧评估 (P0)**
    - [x] 审计 `docs/design/governance/` 过期文档（5 个已完成评估文档）
    - [x] 按规则归档至 `archive/` 子目录（governance/ 条目 35→30）
    - [x] 评估 `must-sync` 30→21 天可行性（GO，已收紧）
    - [x] 评估 `summary-sync` 45→30 天可行性（GO，已收紧）
    - **验收**: governance/ 条目数下降；阈值评估 go/no-go 结论落盘；`docs:check:source-of-truth` 通过

- [x] **主线 3：移动端 CWV 性能基线采集与评估 (P1)**
    - [x] 采集移动端 LCP/CLS/INP 基线（首页 + 文章详情 + 分类/标签列表）
    - [x] 评估移动端 LCP 是否超过 3s 阈值（未超阈值，LCP 1.6s-2.2s）
    - [-] 若超阈值：至少一项可量化优化 + 前后对比数据（不适用）
    - **验收**: 基线数据落盘；阈值评估完成；LCP 均在 2.5s 以下

- [x] **主线 4：i18n 运行时验证扩面 (P1)**
    - [x] 盘点未纳入 `i18n:verify:runtime` 的公开页装配链路（14 个未覆盖页面）
    - [x] ≥2 组新页面链路纳入 runtime 回归（首页 + 文章详情）
    - [x] 修复新链路中发现的 raw key 泄漏或归属漂移（无泄漏）
    - **验收**: ≥2 组新链路通过 runtime 验证；`i18n:audit:missing` / `i18n:audit:duplicates` = 0

- [ ] **主线 5：测试有效性第二轮切片 (P1)**
    - [ ] 补组件层 direct TTS 失败映射断言
    - [ ] 补页面级 auth degradation 场景断言
    - [ ] 补 `settings public` 或 `friend-links` 失败口径断言
    - **验收**: ≥5 个失败路径断言；覆盖 ≥2 模块；coverage 基线不回退

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
