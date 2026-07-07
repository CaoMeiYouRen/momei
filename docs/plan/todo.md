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

> **第五十四阶段进行中**。CLI/MCP 复用 + 结构复用深水区 + ESLint 治理 + 测试有效性 + 脚本治理。

---

### 第五十四阶段：CLI/MCP 复用与治理深水区（CLI/MCP Reuse & Governance Deepwater）

**时间表**: 2026-07-06 ~ 约 1-2 周
**组合**: 1 新功能 + 4 优化

---

#### 主线 1：CLI 与 MCP 包 API 客户端代码复用优化 — 阶段一

- [x] **CLI 包补充接口**
    - [x] 新增 `listPosts()` — 调用 `GET /api/external/posts`
    - [x] 新增 `updatePost()` — 调用 `PATCH /api/external/posts/[id]`
    - [x] 新增 `deletePost()` — 调用 `DELETE /api/external/posts/[id]`

- [x] **MCP 包补充接口**
    - [x] 新增 `validateImportPost()` — 调用 `POST /api/external/posts/validate`
    - [x] 新增 `dryRunLinkGovernance()` — 调用 `POST /api/external/migrations/link-governance/dry-run`
    - [x] 新增 `applyLinkGovernance()` — 调用 `POST /api/external/migrations/link-governance/apply`
    - [x] 新增 `getLinkGovernanceReport()` — 调用 `GET /api/external/migrations/link-governance/reports/[reportId]`

- [x] **验收**
    - [x] 两个包 API 方法覆盖率达到 100%
    - [x] `pnpm typecheck` 通过
    - [x] `pnpm lint` 通过
    - [x] 补充必要的测试用例

---

#### 主线 2：结构复用治理深水区 — 文件整合 + 逻辑重复排查

- [x] **单函数文件整合**
    - [x] 盘点 `utils/` 和 `server/utils/` 下的单函数文件清单
    - [x] 按功能域整合：类型守卫（`isPlainRecord`、`isRecord` 等）→ `utils/type-guards.ts`
    - [ ] 按功能域整合：格式化函数 → `utils/format.ts`
    - [x] 按功能域整合：其他单函数文件 ≥1 组
    - [x] 保持旧路径的 re-export，确保向后兼容

- [x] **逻辑重复检测脚本**
    - [x] 设计逻辑重复检测技术方案（AST 分析 vs 模式匹配）
    - [x] 实现脚本原型，覆盖 `utils/` 和 `server/utils/`
    - [x] 检测"不同函数名但逻辑相似"的情况
    - [ ] 检测"重复导入后轻包装"的模式
    - [x] 检测"相似参数组合 + 相似处理流程"的函数

- [ ] **逻辑重复收敛**
    - [x] 基于脚本输出，识别 ≥2 组逻辑重复候选
    - [x] 评估抽象方案（高阶函数/策略模式/共享 helper）
    - [ ] 完成 ≥2 组逻辑重复收敛

- [ ] **验收**
    - [x] 文件整合：文件数减少 ≥3
    - [x] 逻辑重复检测脚本输出 JSON 报告
    - [x] `pnpm duplicate-code:check` 基线不反弹（当前 0.24%）

---

#### 主线 3：ESLint / 类型债治理 — 规则债 inventory 脚本 + 窄切片

- [x] **规则债 inventory 脚本**
    - [x] 复用现有 `governance:audit:eslint-debt` 脚本基础结构
    - [x] 覆盖规则：`no-explicit-any`、`no-non-null-assertion`
    - [x] 输出维度：rule / 目录 / 命中数 / 清零数 / warning 基线
    - [x] 输出格式：JSON baseline

- [x] **窄切片**（≥3 组）
    - [x] 切片 1：`types/marketing.ts` + `server/entities/marketing-campaign.ts`（no-explicit-any：`targetCriteria: any` → `MarketingCampaignTargetCriteria`）
    - [x] 切片 2：`server/api/categories/slug/[slug].get.ts`（no-explicit-any：`any[]` → `Pick<Category, 'language' | 'slug'>[]`）
    - [x] 切片 3：`server/api/snippets/index.post.ts`（no-explicit-any：`let user: any` → `let user: User`）
    - [x] 每组切片：单规则 + 单文件/双文件，保持 `warning=0`

- [x] **验收**
    - [x] inventory 脚本输出 baseline JSON
    - [x] ≥3 组窄切片完成并通过定向验证
    - [x] `pnpm governance:audit:eslint-debt` 显示 delta 可对照

---

#### 主线 4：测试有效性第二轮切片

- [x] **失败路径断言补齐**
    - [x] 组件层 direct TTS 失败映射断言（凭证过期、WebSocket 连接失败、WebSocket 关闭无音频、上传失败）
    - [x] 页面级 auth degradation 场景断言（已有：test mode、demo mode、locale drift）
    - [x] `settings public` 失败口径断言（localized settings resolution 异常 → 500）
    - [x] `friend-links` 失败口径断言（reviewApplication 不存在 → 404、createApplication 禁用 → 403）

- [x] **验收**
    - [x] ≥5 个新增失败路径断言（实际 6 个）
    - [x] 覆盖 ≥2 个模块（TTS、settings、friend-link 三个模块）
    - [x] 全仓 coverage 基线不回退

---

#### 主线 5：脚本治理 — 治理脚本升格评估与 warning 清理

- [ ] **升格评估**
    - [ ] 评估 `governance:audit:simple-duplicates` 是否升格进入 `regression:weekly`
    - [ ] 评估 `governance:audit:eslint-debt` 是否升格进入 `regression:weekly`
    - [ ] 评估 `governance:audit:comment-drift` 是否升格进入 `regression:weekly`
    - [ ] 输出每个脚本的 go/no-go 结论与理由

- [ ] **warning 清理**
    - [ ] 清理 `audit-comment-drift` 的误报与 warning 面
    - [ ] 清理 `docs:check:line-count:candidate` 的 warning
    - [ ] 清理 `docs:check:source-of-truth:candidate` 的 warning

- [ ] **验收**
    - [ ] ≥1 个治理脚本完成升格评估并输出明确结论
    - [ ] `audit-comment-drift` 误报与 warning 面可见下降
    - [ ] 两条 docs candidate 产出清洁输出

---

### 插队任务：定时推送功能修复（Bug Fix）✅ 已完成

**插入原因**: 阻塞性 Bug，影响营销推送核心功能
**插入时间**: 2026-07-07
**完成时间**: 2026-07-07
**来源**: 用户反馈

---

- [x] **定时推送功能修复**
    - [x] **问题 1：定时任务未触发**
        - [x] 检查 `task-scheduler.ts` 插件中 Cron 任务配置
        - [x] 验证 Serverless 环境下 `/api/tasks/run-scheduled` 端点是否正确触发
        - [x] 检查 `processScheduledCampaigns` 函数是否被正确调用
    - [x] **问题 2：Listmonk 渠道定时任务缺失**
        - [x] 检查 `sendMarketingCampaign` 函数中 listmonk 渠道的处理逻辑
        - [x] 验证 `resolveListmonkStatusPayload` 函数是否正确处理定时状态
        - [x] 确认定时推送创建时 listmonk 渠道的状态设置
    - [x] **问题 3：定时时间未同步**
        - [x] 检查 `repush.post.ts` 中 `scheduledAt` 参数的传递
        - [x] 验证 `createCampaignFromPost` 函数中 `scheduledAt` 的保存逻辑
        - [x] 确认 `MarketingCampaign` 实体的 `scheduledAt` 字段映射
    - [x] **验收**
        - [x] 定时推送能正确触发
        - [x] Listmonk 渠道的定时推送能正常工作
        - [x] 定时时间能正确同步到营销推送
        - [x] 补充相关测试用例（40 个测试通过）

---

## 待准入（筹备中）

> 当前阶段执行中，新增需求请写入 [backlog.md](./backlog.md)。

---

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
