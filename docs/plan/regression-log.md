# 墨梅博客 回归任务记录 (Regression Log)

本文档用于集中维护周期性回归、阶段基线、补跑计划与 Review Gate 证据链正文。规划摘要仍保留在 [待办事项](./todo.md) 与 [项目计划](./roadmap.md) 中，但长篇回归记录应统一沉淀在本文件，避免同一份记录在多个规划文档中重复维护。

## 维护规则

- 回归记录默认按时间倒序追加，便于后续比较基线漂移。
- 同一次回归的正文只保留在本文件；其他规划文档只保留摘要、状态与链接。
- 每条记录至少包含回归范围、触发条件、执行频率、timeout budget、已执行命令、输出摘要、Review Gate 结论、未覆盖边界与后续补跑计划。

## 专项回归记录（2026-03-21）

### 回归任务记录

- 回归范围: 第十六阶段 P0“代码质量与结构收敛”首轮收敛；覆盖实时 ESLint 基线重采样、活动 lint blocker 清理、`scripts/**` 目录入口与保留策略梳理、`max-lines` 豁免与类型债显式标记盘点。
- 触发条件: 第十五阶段归档后进入第十六阶段，旧 `artifacts/eslint-current.txt` 已不能代表当前真实状态，需要建立 2026-03-21 的专项回归基线并先清理活动阻塞项。
- 执行频率: 本阶段专项回归首轮；后续按“每次结构治理合并前 + 本阶段收口前”继续补写同一主题记录。
- timeout budget:
    - ESLint 基线与定向修复验证: 5 分钟内完成。
    - 治理脚本与 Markdown 文档验证: 3 分钟内完成。
    - 本轮不升级到全量 `pnpm lint` 或全量 `pnpm test`，避免在当前工作区触发与本次回归无关的改写或长时任务。
- 已执行命令:
    - `pnpm exec eslint . --max-warnings 999 --format json --output-file artifacts/regression-eslint-2026-03-21-full.json`
    - `pnpm exec eslint scripts/docs/check-source-of-truth.mjs --fix`
    - `pnpm exec eslint scripts/docs/check-source-of-truth.mjs server/services/ai/admin-drafts.ts`
    - `pnpm ai:check`
    - `pnpm lint:md`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: 重新生成 `artifacts/regression-eslint-2026-03-21-full.json` 作为本轮真实 ESLint 基线，并用定向 ESLint 验证回归文件。
        - V1 / 治理层: `pnpm ai:check` 最终通过，`pnpm lint:md` 通过。
        - 编辑器诊断: `scripts/docs/check-source-of-truth.mjs` 与 `server/services/ai/admin-drafts.ts` 均无残余报错。
    - 结果摘要:
        - 旧 `artifacts/eslint-current.txt` 已确认失真，不再作为本阶段判断依据；2026-03-21 JSON 基线成为新的专项回归输入。
        - 本轮真实活动 blocker 已清零：`scripts/docs/check-source-of-truth.mjs` 的可修复 lint 问题已清理，`server/services/ai/admin-drafts.ts` 的重复 import 已修复。
        - `scripts/**` 目录已补充入口索引与治理结论，新增 `scripts/README.md`，并将 `scripts/docs/check-source-of-truth.mjs` 接入 `package.json` 的稳定入口 `docs:check:source-of-truth`。
    - 分层清单:
        - blocker（本轮已关闭）:
            - `scripts/docs/check-source-of-truth.mjs`: 修复 `curly`、`prefer-template`、缩进与单行多语句等活动问题，并保留为长期治理脚本。
            - `server/services/ai/admin-drafts.ts`: 合并重复 `@/types/setting` 导入，清理 `no-duplicate-imports` error。
        - warning（当前不阻塞、已纳入治理记录）:
            - `scripts/setup/setup-ai.ps1`、`scripts/hooks/pre-tool.ps1`、`scripts/hooks/post-tool.ps1`、`scripts/hooks/session-end.ps1`: 保留为本地手工脚本，不纳入团队常规入口。
            - 生产代码显式 suppression 仍存在少量治理债，例如 `server/decorators/apply-decorators.ts` 的 `@typescript-eslint/no-unsafe-function-type` 与 `utils/shared/validate.ts` 的 `no-control-regex`。
        - 可延期（结构债，不作为当前活动 blocker）:
            - `server/services/migration-link-governance.ts`
            - `server/services/setting.ts`
            - `server/services/ai/text.ts`
            - `server/services/ai/post-automation.ts`
            - `composables/use-post-translation-ai.ts`
            - `components/admin/posts/post-distribution-button.vue`
            - `components/admin/settings/agreements-settings.vue`
            - `pages/posts/[id].vue`
            - `packages/cli/src/index.ts`
          以上文件当前以 `eslint-disable max-lines` 或配置 override 维持通过，属于下一轮拆分与职责下沉的优先候选。
        - 类型债说明:
            - 当前盘点到的大多数 `@ts-expect-error` 位于测试代码，用于 mock、非法输入或暴露内部绑定验证；本轮不视为生产阻塞。
            - 生产代码中仍有零星显式忽略，如 `pages/admin/submissions/index.vue` 的 `@ts-ignore`，需在后续专项中补做来源确认与收敛。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 活动 lint blocker 已关闭，但超长文件拆分与少量生产代码 suppression 仍未完成。
            - 本轮仅完成结构收敛首批落盘，不代表第十六阶段全部质量债已出清。
    - 未覆盖边界:
        - 本轮未执行全量 `pnpm lint`，避免触发仓库范围 `--fix` 带来的额外工作区噪音。
        - 本轮未执行全量 `pnpm typecheck`、`pnpm test`、`pnpm test:coverage` 或浏览器级验证；因此“类型债”以显式忽略标记盘点为主，不等同于全仓静态证明。
        - `max-lines` 豁免文件尚未进入逐文件拆分实施阶段，当前仅完成优先级梳理与延期归类。
    - 后续补跑计划:
        - 以本条记录为基线，下一轮优先拆分 `server/services/migration-link-governance.ts`、`server/services/setting.ts`、`server/services/ai/text.ts` 三个服务层超长文件。
        - 对 `pages/admin/submissions/index.vue` 的 `@ts-ignore` 与生产代码中的剩余 suppression 做逐项归因，区分“必要例外”与“应消除债务”。
        - 如后续涉及脚本流转或团队入口调整，继续同步更新 `scripts/README.md`、`package.json` 与本回归日志，保持入口事实源单点收敛。

## 首次回归基线记录（2026-03-20）

### 回归任务记录

- 回归范围: 第十五阶段“自动化验证分级、周期性回归与 Review Gate”收尾；覆盖 AI 治理体检、文档重复页体检、Markdown 文档规范、依赖安全审计、冻结安装验证、类型检查与定向 smoke tests；并记录当前未提交依赖覆盖项（fast-xml-parser 5.5.7、flatted 3.4.2、kysely 0.28.13、@nuxt/test-utils>h3-next -> h3 2.0.1-rc.17）的可运行性。
- 触发条件: 第十五阶段治理任务首次收口前，需要按新定义的验证矩阵与周期性回归模板建立第一条可复用基线。
- 执行频率: 首次基线；后续按“每次发版前 + 每周一次依赖安全与治理回归”复用同一模板更新。
- timeout budget:
    - 文档 / 治理脚本: 2 分钟内完成。
    - 定向 smoke tests: 按测试规范的 10 分钟预算执行；本次未升级到全量 `pnpm test`、`pnpm test:coverage` 或 `pnpm verify`。
- 已执行命令:
    - `pnpm ai:check`
    - `pnpm docs:check:i18n`
    - `pnpm lint:md`
    - `pnpm audit --registry=https://registry.npmjs.org/ --json`
    - `pnpm install --frozen-lockfile`
    - `pnpm typecheck`
    - `pnpm exec vitest run app.test.ts components/app-logo.test.ts server/api/tasks/tts/[id].get.test.ts`
    - `pnpm exec vitest run pages/login.test.ts`
- 输出摘要:
    - 已执行验证:
        - V1 / 治理层: `pnpm ai:check`、`pnpm docs:check:i18n`、`pnpm lint:md` 全部通过。
        - V1 / 静态层: `pnpm typecheck` 通过；`pnpm install --frozen-lockfile` 通过，确认当前 lockfile 可正常安装。
        - V2 / 逻辑运行层: 核心 smoke tests 共 3 个测试文件 10 个测试全部通过；登录页 smoke test 共 1 个测试文件 12 个测试全部通过。
    - 结果摘要:
        - 首次回归基线成立，可作为后续周期性回归的比较起点。
        - 当前工作区中的依赖覆盖项在冻结安装、类型检查与定向 smoke tests 下未见显式运行回归。
    - 测试结果（按需）:
        - `app.test.ts`、`components/app-logo.test.ts`、`server/api/tasks/tts/[id].get.test.ts`: 3 files passed / 10 tests passed。
        - `pages/login.test.ts`: 1 file passed / 12 tests passed。
    - 浏览器验证（按需）:
        - 本次未执行 V3 浏览器级验证，保留到后续关键链路回归。
    - 性能结果（按需）:
        - 本次未执行 V4 Lighthouse / Bundle 基线，保留到发版前或专项性能回归。
    - 依赖安全结果（按需）:
        - 数据来源: `pnpm audit --registry=https://registry.npmjs.org/ --json`；当前工具链未直接从 GitHub Dependabot 页面取数时，采用 npm 官方 registry 审计回退路径。
        - 可修复项与验证结果: 当前工作区已纳入 fast-xml-parser、flatted、kysely 与 `@nuxt/test-utils>h3-next` 的覆盖版本；安装、类型检查与定向 smoke tests 均通过。
        - 未修复的 high+ 风险: 仅剩 `html-minifier@4.0.0`（经 `mjml-cli` 引入）的 `high` 风险，GitHub Advisory 为 `GHSA-pfq8-rq6v-vf5m`，当前无官方补丁版本。
        - 延期或计划修复判断: 该 high 风险暂按 warning 记录并允许当前基线放行，理由是暂无上游补丁且本轮验证未见由此引发的运行回归；后续在上游发布修复、发版前安全复核或计划替换 MJML 链路时优先重新评估。`mjml` 的 `moderate` 与 `quill` 的 `low` 依照现行规则不纳入本次治理记录主体。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 不可修复的 `html-minifier` high 风险仍存在，但已记录影响与延期判断。
            - `pages/login.test.ts` 运行时存在 Sentry DSN 缺失的初始化错误日志，当前不影响测试通过，但会污染后续基线信号。
            - `app.test.ts` 安装页分支存在 `/api/install/status` 未 mock 的 FetchError 噪音；`server/api/tasks/tts/[id].get.test.ts` 存在 Better Auth social provider 配置 warning；均暂列非阻塞噪音。
    - 未覆盖边界:
        - 本次未执行全量 `pnpm lint`，避免在带 `--fix` 的脚本下污染当前工作区；Lint 证据需在隔离 worktree 或后续 CI 采集。
        - 本次未执行全量 `pnpm test`、`pnpm test:coverage`、`pnpm verify`、V3 浏览器级验证或 V4 性能验证。
        - 安装页的 `/api/install/status` 分支与登录页的 Sentry 初始化路径尚未形成“零异常日志”的干净基线。
        - Better Auth 社交登录真实配置路径与 Kysely / Better-Auth 深层数据库适配路径尚未在本次回归中被专门命中。
    - 后续补跑计划:
        - 为安装页补齐 `/api/install/status` mock，为登录页补齐 Sentry DSN 防御式 mock 或可选分支保护后，重跑当前 smoke 组合，形成更干净的第二版基线。
        - 在阶段归档前补一轮 coverage 回归，并按 timeout budget 记录预算与结果。
        - 发版前重新执行依赖安全审计，确认 `html-minifier` high 风险是否仍无补丁，并同步复核是否需要将 MJML 链路纳入计划替换。
