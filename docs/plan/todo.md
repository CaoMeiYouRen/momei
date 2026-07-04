# 墨梅博客 待办事项 （Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事（ (To）o) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 （Todo）
- [x] 已完成 （Done）
- [-] 已取消 （Cancelled）

---

## 当前待办

### 第五十三阶段：缓存架构与治理深化 （Cache Architecture & Governance Deepening）

> 2026-06-29 启动。在 Phase 52 完成治理补账后，以「0 个新功能 + 4 个优化 + 1 评估」组合推进：Vercel CDN 缓存 Tier 2 架构治理为 P0 最紧迫项（阻断 Bot→SSR→DB 连锁反应），ESLint/类型债与结构复用恢复切片节奏，文档治理阈值收紧执行 Phase 52 评估结论，AI 编辑增强功能套件进入评估态。

#### 1. Vercel CDN 缓存 + Bot 流量治理 — Tier 2 架构 （P0）

- **执行范围**: 基于 Phase 52 根因分析（Vercel 100% Cache MISS + 76% Bot 流量 → SSR 冷启动 → Neon compute 频繁启停），在 Tier 1 已执行基础上，实施 Tier 2 架构治理：`nuxt.config.ts` routeRules 配置 ISR/SWR + SSG 预渲染。
- **非目标**: 不做全量 SSG 预渲染、不引入新缓存框架、不改页面渲染逻辑。
- **最小验收**: ISR/SWR 配置生效；公开页面缓存命中率可验证；Neon compute 启停频率下降。
- [x] 分析当前路由结构，确定 ISR/SWR 策略
- [x] 配置 `nuxt.config.ts` routeRules + Vercel KV storage
- [ ] 验证缓存命中与页面更新机制（部署后验证）
- [ ] 监控 Neon compute 启停频率变化（部署后验证）

#### 2. 文档治理阈值收紧 （P1）

- **执行范围**: 执行 Phase 52 评估结论，将 `must-sync` 从 30 天收紧至 21 天、`summary-sync` 从 45 天收紧至 30 天。
- **非目标**: 不做翻译同步、不创建新文档。
- **最小验收**: 脚本阈值更新完成；`docs:check:source-of-truth` 通过。
- [x] 更新 `docs:check:source-of-truth` 脚本阈值（已在 Phase 52 实施：must-sync=21 天， summary-sync=30 天）
- [x] 同步受影响文档的 `last_sync` 字段（zh-TW/ko-KR/ja-JP guide/quick-start.md 更新至 2026-06-29）
- [x] 验证 `docs:check:source-of-truth` 通过

#### 3. ESLint / 类型债治理 — 清零剩余 3 处 as any (P1)

- **执行范围**: 继续清零剩余 3 处 `as any`（`benefits.vue` 2 处 + 其他 1 处），保持 `warning=0`。
- **非目标**: 不扩展范围、不引入新规则族。
- **最小验收**: 3 处 `as any` 清零；`pnpm typecheck` 通过。
- [x] `benefits.vue` 2 处 `as any` 清零
- [x] 定位并清零第 3 处 `as any`
- [x] `pnpm typecheck` + `pnpm lint` 验证

#### 4. 结构复用治理 — ≥5 组热点切片 （P1）

- **执行范围**: 继续聚焦重复类型声明、纯函数、工具函数收敛，至少完成 5 组热点切片。
- **非目标**: 不推动跨目录大重构、不为复用而复用。
- **最小验收**: ≥5 组热点切片完成；`pnpm duplicate-code:check` 基线不反弹。
- [x] 盘点当前热点候选
- [x] 完成 ≥5 组热点切片
- [x] 验证 `duplicate-code` 基线

#### 5. AI 编辑增强功能套件 — 评估态 （P1）

- **执行范围**: 对 backlog 短期候选 #9「AI 编辑增强功能套件」生成评估文档，覆盖技术方案、前置条件、验收标准、ROI 评估。
- **非目标**: 不进入代码实现、不修改现有 AI 管线。
- **最小验收**: 评估文档输出明确的 go/no-go 结论，至少覆盖「AI 额度计费策略」「prompt 多语言支持」「与现有 AI 管线复用度」三个维度。
- [x] 分析现有 AI 管线架构
- [x] 评估 7 个功能的技术可行性
- [x] 评估 AI 额度计费策略
- [x] 评估 prompt 多语言支持
- [x] 输出 go/no-go 结论与 ROI 评估（条件性 Go，ROI 1.50）

---

## 待准入（筹备中）

> 当前阶段进行中，下一阶段待候选池评估。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
