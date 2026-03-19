# 墨梅 (Momei) 待办事项 (Todo List)

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

- [ ] 第十五阶段 / AI Agent / Skills 治理、Rules 边界与复用收敛：先恢复完整治理子议题，收敛权威文件、职责矩阵、Rules 边界与复用治理，再进入自动化验证矩阵实现。


## 第十五阶段：AI 协作治理与国际化文档收敛

> 执行原则: 先收敛 AI 协作规则事实源、验证矩阵与回归清单，再推进文档目录迁移与 `ja-JP` 准入；阶段内不额外并入与治理主线无关的探索型需求。

### 1. AI Agent / Skills 治理、Rules 边界与复用收敛 (P0)

- [x] **权威文件收敛与冲突顺序明确**
	- 进展: 已在 `AGENTS.md` 中明确唯一权威事实源与冲突处理顺序；`CLAUDE.md` 已降为 Claude 专属适配说明；`docs/guide/ai-development.md` 与 `README.md` 已补齐入口分工与导览规则。
	- 验收: 明确以 `AGENTS.md` 作为平台无关的唯一权威事实源；`CLAUDE.md`、`docs/guide/ai-development.md` 与其他平台适配文档仅承担适配与补充说明，不再与 `AGENTS.md` 并列定义核心规则。
	- 验收: 明确冲突处理顺序：`AGENTS.md` 优先于平台专属说明；若平台能力受限，仅允许补充“工具差异”，不允许覆盖项目级行为准则。
	- 验收: 补齐文档与入口审计，至少覆盖权威文件、平台适配文件与开发入口说明 3 类场景。
- [x] **工作流细化与推荐矩阵**
	- 进展: 已在 `AGENTS.md` 中补齐核心智能体的适用场景、输入输出、必经交接点与不应承担职责，并新增默认推荐路径、阶段去重规则与主定义/镜像治理约束；`docs/guide/ai-development.md` 已同步面向开发者的推荐路径与避免重复派单说明。
	- 验收: 为 `@full-stack-master`、`@product-manager`、`@test-engineer`、`@code-auditor`、`@documentation-specialist` 等核心智能体明确适用场景、输入输出、必经交接点与不应承担的职责边界。
	- 验收: 明确默认推荐路径：需求澄清优先交给产品经理，代码实现由全栈 / 前后端开发者承担，代码改动收尾必须进入 `code-auditor` Review，测试补强交由 `test-engineer`，文档沉淀交由 `documentation-specialist`。
	- 验收: 禁止多个智能体在同一阶段重复承担同类职责，并补齐最小示例或矩阵说明。
- [ ] **库存对齐、Skills 复用与冗余裁剪**
	- 进展: 已确认 `.github/agents|skills` 与 `.claude/agents|skills` 当前库存同名同量，并明确以 `.github/` 为主定义、`.claude/` 为兼容镜像；已同步收敛 `full-stack-master`、`product-manager`、`code-auditor`、`test-engineer`、`documentation-specialist` 5 个核心 agent 的内容形态，改为“角色定位 + skills / 规范引用 + 输入输出 / 交接点 / 禁区”，减少重复抄写的工作流与门禁说明。
	- 验收: 对齐 `AGENTS.md`、`CLAUDE.md`、`docs/guide/ai-development.md`、`.github/agents/`、`.github/skills/` 与 `.claude/agents/`、`.claude/skills/` 的实际清单，消除角色名、路径、fallback 约定与推荐用法漂移。
	- 验收: 清理未使用、重复、失效或职责高度重叠的 agent / skill，优先收敛为“一套主定义 + 平台适配镜像”的结构，避免双份说明长期分叉。
	- 验收: 要求 agent 优先复用既有 skills 与规范文档，不再把相同的执行门禁、质量要求与流程说明复制到多个 agent 文件中；优先通过 `references` 或等效引用机制声明依赖，实现 skills / 规范按需加载，避免每次初始化一次性吞入整套规则上下文。
- [ ] **Rules 层最小化与平台适配**
	- 验收: 为 Cursor / Codex / Copilot Workspace 等工具补齐轻量 `Rules` / `Instructions` 入口，但内容必须复用 `AGENTS.md`、规划规范、开发规范与安全规范，优先引用或摘要，而不是重复维护大段文本。
	- 验收: 建立 Rules 作用边界：仅补充工具差异、触发顺序与最小执行门禁，不在 Rules 层重新发明业务规范、项目流程或安全红线。
	- 验收: 补齐平台差异清单，至少覆盖 GitHub Copilot、Claude 系工具与一类 Rules-only 工具 3 种入口。
- [ ] **配置体检与最小验证闭环**
	- 验收: 清理无效 Frontmatter、失效链接与不再存在的技能引用，补齐最小校验流程，避免 agent / skill 因解析错误而失效。
	- 验收: 为 agent / skill 治理补充最小自动化检查，确保目录变动后能发现孤儿文件、无引用定义与文档漂移。
	- 验收: 补齐输出格式，至少包含问题清单、影响范围、修复建议与可延后事项 4 类字段。

### 2. 自动化验证分级、周期性回归与 Review Gate (P0)

- [ ] **验证矩阵与 Review Gate 收敛**
	- 验收: 建立逻辑、接口、跨模块流程、UI 浏览器验证、Lighthouse / Bundle 预算与 Review Gate 的统一分级矩阵，并明确不同改动类型的最低验证要求。
	- 验收: 任何代码、配置、脚本与文档改动完成后都需保留对应的检查清单与 Review 结论，不再以“已验证”替代证据链。
	- 验收: 补齐规范与模板，至少覆盖功能改动、修复型 Hotfix、文档/配置变更 3 类场景。
- [ ] **周期性回归清单与漂移治理**
	- 验收: 整理需要定期回归的事项，至少覆盖代码优化与复用收敛、ESLint warning / 类型债治理、`database/*/init.sql` 与实体/设计文档同步、README / 部署 / 翻译文档同步、i18n 翻译大文件拆分后的初始化字段完整性、测试用例补齐与性能基线漂移。
	- 验收: 明确这些事项默认属于独立治理任务，不自动膨胀进普通功能需求；仅在阻塞交付或构成功能回归时允许插队。
	- 验收: 补齐回归任务模板，至少覆盖回归范围、触发条件、执行频率与输出格式 4 个字段，并将 `max-lines` 超限文件与 `/* eslint-disable max-lines */` 等临时豁免纳入周期性清理清单，优先通过合理拆分收敛大文件而不是长期保留注释。
- [ ] **覆盖率门槛与全量测试 timeout budget**
	- 验收: 回归任务必须补充或修正测试用例，维持全项目覆盖率不低于现行门槛，且不得让核心模块覆盖率基线继续下滑。
	- 验收: 回归任务允许执行全量 `pnpm test`、`pnpm test:coverage` 与 `pnpm verify`，但必须声明显式 timeout budget，不得使用无限等待。
	- 验收: 补齐最小执行约定，至少覆盖定向测试、全量测试、coverage 与 verify 4 类命令的预算或升级条件。

### 3. 文档国际化目录重构 (P1)

- [x] **翻译文档目录与 URL 约束收敛**
	- 进展: 已完成首页、文档规范页、guide 全量、`standards/` 全量、`design/` 全量与 roadmap 翻译页迁移；原有 `docs/<locale>/` 目录已全部移除，活动文档与 README 已不再引用旧物理目录，当前仅保留 `todo-archive.md` 中的历史阶段描述作为归档记录。
	- 验收: 形成 `docs/i18n/<locale>/` 的目录迁移方案，同时保持外部文档站继续使用 `/<locale>/...` 路由，不将仓库路径结构直接暴露为公共 URL。
	- 验收: 明确过渡期兼容映射与分批迁移策略，避免一次性硬切导致死链与编辑入口失效。
	- 验收: 补齐迁移审计，至少覆盖历史引用、构建产物与相对路径 3 类场景。
- [x] **文档站配置与规范同步**
	- 进展: VitePress rewrites / `editLink` 已切到真实源文件路径，文档规范与翻译治理已同步到 `docs/i18n/<locale>/`，并新增重复页阻塞检查脚本防止旧目录回流或 `docs/<locale>/` 与 `docs/i18n/<locale>/` 双写漂移；剩余 guide 与 roadmap 翻译页的相对回链和治理规则也已补齐。
	- 验收: 同步更新 VitePress locale 配置、导航/侧边栏、编辑链接映射、Translation Notice 与文档规范中的路径说明。
	- 验收: 明确新增翻译页的 Frontmatter、原文回链与相对路径生成约束，不再允许新旧目录混用。
	- 验收: 补齐文档构建与死链检查，至少覆盖英文、繁体中文、韩语 3 类现有翻译目录。

### 4. 日语界面与文档支持 (P1)

- [x] **`ja-JP` 准入与 UI 范围收敛**
	- 进展: 已接入 `Locale Registry`、PrimeVue / 日期 locale、安装向导语言入口、公开界面 / 认证 / 设置 / 安装引导日语词条与核心邮件模板；待补 `locale key parity` 审计闭环与关键页面回归记录。
	- 验收: 在 `Locale Registry` 中为 `ja-JP` 建立正式准入项，首轮优先覆盖公开界面、认证、设置、安装引导与核心邮件模板。
	- 验收: 沿用“先 `ui-ready`、后 `seo-ready`”的开放节奏，在关键链路未稳定前不提前开放索引。
	- 验收: 补齐 locale key parity 与关键页面回归检查，至少覆盖首页、登录、设置 3 类页面。
- [x] **日语文档范围与质量门禁**
	- 进展: 已新增 `README.ja-JP.md`、文档站 `ja-JP` 首页、快速开始、翻译治理与路线图摘要，并补充术语表与同步节奏说明；待补死链 / 术语一致性校验记录。
	- 验收: 日语文档首轮仅覆盖 README、核心 Guide、路线图摘要与必要贡献入口，不默认要求 `docs/design/modules/` 全量翻译。
	- 验收: 建立术语表、翻译声明模板与同步节奏，不让 `ja-JP` 的引入破坏现有 `zh-TW`、`ko-KR` 的收口质量。
	- 验收: 补齐文档死链与术语一致性检查，至少覆盖 README、快速开始、部署指南 3 类入口。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

