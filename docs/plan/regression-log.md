# 墨梅博客 回归任务记录 (Regression Log)

本文档用于集中维护周期性回归、阶段基线、补跑计划与 Review Gate 证据链正文。规划摘要仍保留在 [待办事项](./todo.md) 与 [项目计划](./roadmap.md) 中，但长篇回归记录应统一沉淀在本文件，避免同一份记录在多个规划文档中重复维护。

## 维护规则

- 回归记录默认按时间倒序追加，便于后续比较基线漂移。
- 同一次回归的正文只保留在本文件；其他规划文档只保留摘要、状态与链接。
- 每条记录至少包含回归范围、触发条件、执行频率、timeout budget、已执行命令、输出摘要、Review Gate 结论、未覆盖边界与后续补跑计划。

## 文档、配置与数据库基线同步回归（2026-03-21，进行中）

### 回归任务记录

- 回归范围: 第十六阶段“README / 部署 / 翻译文档 / 配置说明同步回归”与“database/*/init.sql、实体与设计文档同步回归”的首轮事实核对；本轮优先检查根目录多语 README、部署与变量说明、文档站路径入口，以及 `docs/design/database.md`、`server/entities/**` 与三套 `database/*/init.sql` 的关键表结构。
- 触发条件: 第十六阶段“专项回归：文档、配置与数据库基线同步”启动，需要先建立一份可继续增量更新的回归记录，并区分已确认漂移与尚待验证项。
- 执行频率: 本阶段专项治理首轮基线；后续在本条记录上持续补充命令结果、修复结论与补跑情况，直至对应 Todo 验收完成。
- timeout budget:
    - 文档 / 结构核对: 15 分钟内完成首轮静态审计。
    - 文档校验命令: `pnpm lint:md` 按 10 分钟预算执行。
    - 数据库验证: 暂未升级到全量测试或初始化演练；本轮先补定向实体测试与 Web Push 相关最小验证证据。
- 已执行命令:
    - `pnpm lint:md`
    - `pnpm exec vitest run tests/server/services/web-push.test.ts`
    - `pnpm exec vitest run tests/server/database/post.entity.test.ts`
- 输出摘要:
    - 已执行验证:
        - 已核对 `README.md`、`README.en-US.md`、`README.zh-TW.md`、`README.ko-KR.md`、`README.ja-JP.md` 的主要文档入口。
        - 已核对 `docs/guide/deploy.md`、`docs/guide/variables.md`、`docs/guide/translation-governance.md`、`docs/.vitepress/config.ts`、`package.json` 与 `.env.full.example` 的主要配置口径。
        - 已抽查 `user`、`post`、`post_version`、`setting_audit_logs`、`web_push_subscriptions`、`friend_links`、`ad_campaigns`、`ad_placements` 的实体定义与三套 `init.sql`。
        - 已执行 Markdown 校验与两组数据库相关定向测试，其中一组用于确认实体唯一约束行为，一组用于补充 Web Push 相关最小验证。
    - 结果摘要:
        - 已确认根 README 中文、英文、日文版本中的“方案对比 / Comparison”入口存在过时路径，实际应指向 `guide/comparison`。
        - 日文 README 的 Cloudflare D1 说明缺少与中文、英文一致的运行时边界提示，容易误读为当前已支持 Cloudflare 运行时整站部署。
        - 已确认繁中、韩文根 README 仍混用仓库内 `docs/i18n/**` 本地路径作为人类入口；现已统一改回对应文档站入口。
        - 已确认英文文档首页 `docs/i18n/en-US/index.md` 中仍有 2 处特性入口漏写 `/en-US/` 前缀，点击后会回跳中文路由；现已补齐。
        - 已确认中文根 README 的 Human 入口此前仍直链仓库内 `docs/guide/**` 源文件；现已统一改回文档站入口，和其他语言 README 保持一致。
        - 已确认英文、繁中、韩文 AI 开发指南仍使用过时角色名 `@code-reviewer`，并存在旧的执行口径；现已按当前 `@code-auditor` 与 Review Gate 流程修正。
        - 已确认 MySQL `momei_web_push_subscriptions` 先前只对 `endpoint` 前 255 字符做唯一约束，和实体 / 设计文档要求的全值唯一语义存在漂移；已改为基于 `sha2(endpoint, 256)` 生成列的唯一约束实现。
        - 当前未验证出 `web_push_subscriptions`、`post_version`、`setting_audit_logs` 等关键表在三套 `init.sql` 中存在缺表或关键约束缺失；此前只读审计中的相关结论判定为误报，不纳入正式问题清单。
        - 继续扩面核对 `server/entities/**` 与三套 `database/*/init.sql` 后，本轮未再发现新的真实数据库基线漂移；先前候选项中的表名前缀差异、`theme_config.preview_image` 方言类型差异不纳入正式问题清单。
        - `tests/server/services/web-push.test.ts` 当前因测试环境无法解析 `server/services/web-push.ts` 对 `web-push` 包的导入而提前失败，属于现有测试环境问题；本轮将其记录为相邻风险，不作为数据库唯一约束修复失败的证据。
        - `tests/server/database/post.entity.test.ts` 已通过 2 个测试，确认 `post` 实体当前仍保持“同 slug + 不同语言允许、同 slug + 同语言拒绝”的唯一约束行为基线。
    - 测试结果（按需）:
        - `tests/server/services/web-push.test.ts`: 1 file failed / 0 tests executed；失败原因为 `Failed to resolve import "web-push" from "server/services/web-push.ts"`。
        - `tests/server/database/post.entity.test.ts`: 1 file passed / 2 tests passed。
    - Review Gate 结论:
        - 结论: In Progress
        - 问题分级: warning
        - 主要问题:
            - 日文 README 仍需继续按 `ui-ready` 实际范围压缩未翻译页面入口，目前已先修到不再指向不存在的日文 docs 页面。
            - 数据库基线尚未完成“实体事实源 -> init.sql -> 设计文档”三方全量校对，目前已完成高风险表抽查并修复 1 处已确认的 MySQL 唯一约束漂移。
            - Web Push 定向测试当前被既有测试环境依赖解析问题阻断，后续若要把 Web Push 纳入正式数据库回归证据，需先解决 `web-push` 包在该测试路径下的可解析性。
    - 未覆盖边界:
        - 尚未完成 5 类根 README 的逐段能力边界复核，目前已完成中文、英文、繁中、韩文、日文主要入口与 AI 协同入口核对。
        - 尚未对 `docs/i18n/**` 下除 AI 开发指南外的全部翻译文档做同等粒度回归。
        - 尚未执行数据库初始化演练；当前数据库最小验证仅覆盖 1 组实体唯一约束测试，尚未形成跨三套 `init.sql` 的初始化级证据。
    - 后续补跑计划:
        - 继续抽查其余实体与三套 init.sql 的收敛情况，并把剩余真实漂移按“代码事实源 / 初始化派生物 / 设计文档”分层记录。
        - 在修复 `web-push` 依赖解析问题后，重新运行 Web Push 相关定向测试，确认本轮唯一约束修复没有影响既有逻辑说明与最小行为基线。

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
