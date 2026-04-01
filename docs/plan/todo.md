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
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

当前进行中事项：
- Dependabot / Code Scanning 安全告警闭环建设（修复与延期治理闭环收口）

---

## 第二十阶段：质量门禁、发布自动化与安全治理闭环建设

> **当前阶段**: Phase 20
> **核心目标**: 以浏览器 / E2E 稳定性、Release 与 Review Gate 自动化整合、安全告警闭环，以及重复代码检测自动化为主线，先把质量放行链路做实，再考虑新的内容分发与商业化扩展。

### 1. 主线：浏览器与 E2E 稳定性治理 (P0)

- [x] **测试服务稳定性与关键链路收敛**
	- 验收: 明确并修复当前 Playwright 运行中测试服务中途失联、`Connection refused`、关键接口高并发触发 429 或等价问题的主要根因。
	- 验收: 至少为认证会话、后台受保护页访问、文章编辑器核心路径建立可复用的稳定验证口径，而不是依赖一次性人工补跑。
- [x] **最小关键路径浏览器基线固化**
	- 验收: 收敛 Chromium / Firefox / WebKit 与最小移动端 smoke 的执行范围、触发条件与失败归因规则。
	- 验收: 将“哪些改动必须补浏览器证据”写入回归记录或脚本入口说明，避免后续继续凭经验补跑。

### 2. 主线：Release 与 Review Gate 自动化整合 (P0)

- [x] **发布链路统一编排**
	- 验收: 在现有 `lint`、`typecheck`、`security:audit-deps`、文档检查与 Review Gate 基础上，补齐统一的发布前校验入口或等价脚本编排。
	- 验收: 明确发布、阶段归档与高风险改动收口时的最低验证矩阵，避免继续依赖分散的人肉命令顺序。
	- 实现: `scripts/release/pre-release-check.mjs` + `pnpm release:check` / `pnpm release:check:full`
- [x] **Review Gate 证据自动化补强**
	- 验收: 为常见治理型改动补齐可复用的证据模板、结果落点或脚本辅助，至少覆盖质量门状态、已执行验证、问题分级与未覆盖边界。
	- 验收: 相关收口流程需与 `regression-log.md`、`planning.md`、`documentation.md` 的现有规范保持一致，不新增第二套口径。
	- 实现: `scripts/review-gate/generate-evidence.mjs` + `pnpm review-gate:generate` / `pnpm review-gate:generate:check`

### 3. 主线：Dependabot / Code Scanning 安全告警闭环 (P0)

- [x] **Security 数据源接入与分类落点**
	- 验收: 评估并优先接入仓库 Dependabot alerts 与 Code Scanning alerts 的官方数据来源；若工具链受限，明确回退路径与证据口径。
	- 验收: 形成“可立即修复 / 需延期 / 仅观察”的分级规则，并与现有 release 安全门禁保持一致。
	- 实现: `scripts/security/check-github-security-alerts.mjs` + `pnpm security:alerts` + `.github/security/security-alert-exceptions.json`
- [ ] **修复与延期治理闭环**
	- 验收: 至少完成一轮真实告警的修复、验证、延期记录或 allowlist / 例外基线收敛，避免只做读取不做处置判断。
	- 验收: 将结果同步沉淀到回归记录与 Review Gate 结论中，确保后续发版前可直接复用。

### 4. 主线：重复代码检测自动化补强 (P1)

- [x] **重复代码检测脚本 / 工具落库**
	- 验收: 为重复代码治理补齐正式脚本入口或等价工具接入，优先支持 stable report 输出，而不是继续停留在纯人工检索。
	- 验收: 明确扫描范围、忽略目录、报告产物位置与 baseline / warn 策略，避免首轮就把治理扩写成全仓阻断式重构。
	- 实现: `.jscpd.json` + `scripts/review-gate/check-duplicate-code.mjs` + `pnpm duplicate-code:check` / `pnpm duplicate-code:check:strict` + `.github/review-gate/duplicate-code-baseline.json`
- [x] **检测结果与 shared 复用治理联动**
	- 验收: 首轮至少输出一份可追溯的重复片段检测报告，并结合 shared helper / 纯函数治理基线给出“立即处理 / 延后处理 / 保持局部实现”分类。
	- 验收: 将重复代码检测结果纳入回归记录、Review Gate 或质量门说明，形成持续可复用的治理入口。
	- 验证记录: 已生成 `artifacts/review-gate/2026-04-01-duplicate-code.json` / `.md`，并将首轮分类、baseline 与 strict 回归结果同步到 `docs/plan/regression-log.md`。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

