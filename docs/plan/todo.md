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

## 当前进行中阶段

### 第七十七阶段：体验与债务收口（筹备中，2026-11-15 立项）

**阶段目标**: 收口字号（字阶）归一、认证会话 SSR/CSR 单一来源、零引用面板清理、归档文档链接治理、覆盖率第十八批与 devcontainer 运行时对齐。

**准入结论**: 用户于 2026-11-15 确认「方案 A」6 条组合；ROI 均 ≥ `1.40`（字阶 1.60 / 会话 1.40 / 死代码 2.50 / 归档链接 1.75 / 覆盖率 1.75 / devcontainer 2.00）。

**阶段基线**: 同源 statements `85.34%`（32,568 / 38,163）；`duplicate-code` 0.47%（48 clones / 811 行）；i18n missing 0 / duplicates 64 组；字号 460 声明（token 47 / 口径内 229 / 非字阶 150 / scss 变量 34）；归档失效链接 791 处 / 163 文件；`coreEntryJs` 280.63KB / 335KB、`keyCss` 59.12KB / 62KB。

**排程与移出顺序**: `3 → 2 → 1 → 6 → 5 → 4`；超时按 `4 → 6 → 1` 移出。

- [x] **1. 字号归一第一批（P2）**: 首批取 `components/admin/posts` 的前 ≤10 个文件（按 inventory JSON 声明数降序；目录内 72 处声明，筛口径内字面量），完成后滚动至 `components/admin/settings`（35 处声明）；同时产出 150 条非字阶取值的归一评估报告（只评估、不改值）；目录声明数随条目 3 删除面板后须复算。
    - **验收标准**: 逐元素 `getComputedStyle` 的 `font-size` / `line-height` 零差异；`test:visual` 32/32、parity 83/83 未归因差异 0；`inventory-font-sizes` 口径内待替换数按批次下降；评估报告落 `docs/design/governance/`。
    - **非目标**: 不动 scss 变量与已 token 化项；不一次性替换全仓；不改视觉设计与 `--m-font-size-*` 定义。
    - **验证 / 证据**: V0 + V1 + V2 + RG；V3 由 parity / visual / 逐元素对账覆盖，差异不可归因时补 `@ui-validator` 探针；对账输出与 visual/parity 结果写入 `artifacts/review-gate/`。
    - **回滚边界**: 按目录批次独立 revert。

- [x] **2. 认证会话 SSR/CSR 单一来源（P2）**: 扩展 `server/middleware/1-auth.ts` 到「带会话 cookie 的页面 GET」，SSR 把会话种入 `auth:route-session:*`；移除 `components/settings/settings-profile.vue` 的 `ClientOnly` 与占位，并加「会话驱动型 `ClientOnly` 不得扩散」守卫。
    - **验收标准**: `/settings` SSR 首帧含头像 / 昵称 / 角色；无 hydration mismatch，切页签不触发 `insertBefore`；会话驱动型 `ClientOnly` 为 0 且被守卫锁定；同机同构建已登录页面 SSR 响应时间增幅 ≤10%。
    - **非目标**: 不改 Better-Auth 与登录 / 注销 / 刷新语义；不改头像上传；不新增每请求 session 查询；不动非会话原因的 `ClientOnly`。
    - **验证 / 证据**: V0 + V1 + V2 + V3；浏览器探针与响应时间对比写入 `artifacts/review-gate/`。
    - **回滚边界**: 中间件判定、SSR 种子与兜底移除同批 revert。**kill-switch**: SSR 增幅 >10% 且无法在不新增查询下消除时，退回客户端种子并把残余 mismatch 登记 backlog。

- [x] **3. 零引用面板清理与组件扫描守卫（P3）**: 删除 `post-editor-review-panel.vue`（212 行）与 `post-editor-perspective-panel.vue`（257 行），新增 `scripts/governance/find-unused-components.mjs` 与 `pnpm governance:audit:unused-components` 报告型入口（allowlist）与假阳性单测。
    - **验收标准**: 删除后 `build` / `typecheck` / 编辑器定向测试通过；脚本在当前 HEAD 输出 0 未登记项；单测含动态解析等负向用例。
    - **非目标**: 不清理第三方组件；不把脚本升为阻断门禁；不改编辑器 AI 能力与两个 AI API。
    - **验证 / 证据**: V0 + V1 + RG；删除前后引用计数与脚本输出落盘。
    - **回滚边界**: 两文件删除与新脚本独立 revert。

- [x] **4. 归档文档链接治理（P2）**: 失效链接基数以入库扫描脚本为单点（自写存在性口径 791 处 / 163 文件：plan 231 / regression 421 / governance 139；`docs:check:links` 同款口径 765 处，差值 26 处须逐条归因；脚本入口 `scripts/docs/scan-archive-links.mjs`（`pnpm docs:scan:archive-links`，报告模式）；完成判据只认 `docs:check:links` 覆盖 archive 后 0 失效，扫描脚本不要求归零）；分类处置：同级上跳（124）、已迁移文档改路径（含 180 处已删除目标映射）、代码路径改可解析相对路径或行内代码（445）、其余逐条（42）；完成后把 `archive` 纳入 `docs:check:links`。
    - **验收标准**: 扫描脚本入库并能复现申报基数（或输出逐条差量）；链接门禁覆盖 archive 后 0 失效；每类抽样 5 处人工复核；diff 仅涉及链接目标与反引号化；`docs:check:markers` / `line-count` 保持通过。
    - **非目标**: 不改归档正文语义与阶段结论；不删除归档文件；不伪造目标文件。
    - **验证 / 证据**: V0 + V1 + V2 + RG；修复脚本输出与抽样清单落盘。
    - **回滚边界**: 三批目录独立 revert，门禁改动单独提交位。

- [x] **5. 覆盖率第十八批（P2）**: 取 `packages/cli/src/import-command.ts`（137 / 145）、`components/admin/admin-taxonomy-page.vue`（111 / 284）、`scripts/security/security-alert-gate-shared.mjs`（98 / 263）、`packages/mcp-server/src/lib/api.ts`（73 / 73），目标同源 `+0.3pp`（约 115 条）或模块级 `+15pp / ≥85%`。
    - **验收标准**: 干净全量跑（移 `.vitest-cache` / `.vitest-cache-coverage` + `--maxWorkers=4`）基线 / 收口 delta 落 `artifacts/coverage/`；定向测试通过；flaky 归因。
    - **非目标**: 不测模板分支凑数；不重构 `admin-taxonomy-page.vue`；不新增测试依赖。
    - **验证 / 证据**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

- [x] **6. devcontainer 运行时对齐（P3）**: 基础镜像升至 `typescript-node:26-*`（与 `.nvmrc` 同主版本），`corepack enable` 换成 Node 26 兼容的 pnpm 引导；扩展 `tests/scripts/node-runtime-baseline.test.ts` 钉住镜像主版本与 `corepack` 不回流。
    - **开工前置**: 先确认 mcr 存在 Node 26 变体 tag；不存在则保留 backlog 并改用可自证的替代基线。
    - **验收标准**: `devcontainer.json` JSONC 解析通过；守卫对「镜像降级」「corepack 回流」判红；Codespaces 内 `pnpm install` 无 `Unsupported engine`（无法实测时标注「未实测」并以守卫为下限）。
    - **非目标**: 不改 `.nvmrc` / `engines` / CI / Docker 基线；不引入双版本矩阵。
    - **验证 / 证据**: V0 + V1；守卫单测与核对记录。
    - **回滚边界**: 单文件与守卫扩展独立 revert。

> 阶段收口门禁: `pnpm regression:phase-close`；任何条目开工前先确认工作区干净并拉取远端。

> 上一阶段归档：第七十六阶段「内容与编辑体验收口、首页缓存决策与质量基线」已完成全部 6 条条目并归档（2026-11-15 立项与收口），正文见 [roadmap 归档分片](./archive/roadmap-phases-76.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十六阶段归档结论最近归档阶段)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
