# 墨梅博客 回归任务记录 (Regression Log)

本文档用于集中维护周期性回归、阶段基线、补跑计划与 Review Gate 证据链正文。规划摘要仍保留在 [待办事项](./todo.md) 与 [项目计划](./roadmap.md) 中，但长篇回归记录应统一沉淀在本文件，避免同一份记录在多个规划文档中重复维护。

## 维护规则

- 回归记录默认按时间倒序追加，便于后续比较基线漂移。
- 同一次回归的正文只保留在本文件；其他规划文档只保留摘要、状态与链接。
- 每条记录至少包含回归范围、触发条件、执行频率、timeout budget、已执行命令、输出摘要、Review Gate 结论、未覆盖边界与后续补跑计划。
- 本文件定位为“活动回归日志”，默认只保留最近 1 - 2 个阶段或最近 6 - 8 条完整回归记录，用于服务当前阶段收口、近期发版与最近基线对比。
- 当本文件超过 300 - 400 行、或最近记录已明显影响当前阶段阅读效率时，应将更早的历史记录迁移到 [regression-log-archive.md](./regression-log-archive.md)，并在本文件顶部保留必要索引与摘要入口。
- 回归记录归档采用“滚动归档”而非“阶段完成即整份搬空”的策略；主日志必须始终保留足够支撑最近一次基线比较和发版判断的近线记录。

## 归档规则

- 触发条件:
    - 活动日志超过 300 - 400 行。
    - 活动日志累计超过 6 - 8 条完整回归记录。
    - 当前阶段已归档，且最旧记录已不再服务最近 1 - 2 个阶段的基线比较。
- 归档范围:
    - 优先迁移最早且已不再参与当前阶段 / 下一阶段基线比较的完整记录。
    - 同一条回归记录必须整体迁移，不拆分其“命令 / 结果 / Review Gate / 后续计划”正文。
- 维护方式:
    - 活动日志保留最近记录与索引入口。
    - 历史记录迁移到 [regression-log-archive.md](./regression-log-archive.md)，按时间倒序维护。
    - 若后续单一归档文件继续膨胀，再按年份或半年进一步拆分归档文件。

## AI 视觉资产收敛回归（2026-03-22）

### 回归任务记录

- 回归范围: 第十七阶段 P1“AI 视觉资产收敛”首轮落地；覆盖五维提示词模型、视觉场景扩展、文章编辑器内封面 / 配图双入口、自动回填边界与 Post metadata 事实源扩展。
- 触发条件: 当前阶段扩展事项“合并封面五维提示词与图片生成扩面治理”进入收口，需要为新的视觉资产模型、服务端契约与编辑器行为沉淀回归证据。
- 执行频率: 本阶段专项回归首轮；后续仅在新增专题头图 / 活动图专属编辑器、调整图片自动回填策略或扩展视觉资产消费链路时补写增量记录。
- timeout budget:
    - 定向 Vitest: 15 分钟。
    - 编辑器诊断与 JSON 校验: 10 分钟。
    - 单文件组件补跑: 10 分钟。
- 已执行命令:
    - `pnpm exec vitest run components/admin/posts/post-editor-media-settings.test.ts`
    - `pnpm exec vitest run server/services/ai/image.test.ts`
    - `pnpm exec vitest run server/api/ai/image/generate.post.test.ts`
    - `pnpm exec vitest run server/utils/ai/prompt.test.ts`
    - `pnpm exec vitest run utils/shared/ai-visual-asset.test.ts`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: 新增与修改的 Vue、TypeScript、Schema 与 locale 文件均通过编辑器诊断；未发现 JSON、类型或模板错误。
        - V2 / 逻辑层: `server/services/ai/image.test.ts` 11 个测试通过，补充验证了 `post-illustration + manual-confirm` 不会误触发封面自动回填。
        - V2 / API 层: `server/api/ai/image/generate.post.test.ts` 6 个测试通过，确认新的 `assetUsage` / `applyMode` 默认值纳入请求校验与下游调用。
        - V2 / 共享模型层: `utils/shared/ai-visual-asset.test.ts` 3 个测试通过，确认五维模型的默认推导、手动覆盖与 Prompt 合成逻辑稳定。
        - V2 / 编辑器层: `components/admin/posts/post-editor-media-settings.test.ts` 4 个测试通过，确认封面场景 props 透传不回退、文章配图可以插入 Markdown 正文并同步记录 `metadata.visualAssets`。
        - V2 / Prompt 模板层: `server/utils/ai/prompt.test.ts` 22 个测试通过，确认图片提示词模板已改为五维 JSON 输出约束。
    - 结果摘要:
        - `AIImageOptions` 已扩展 `assetUsage`、`applyMode` 与 `promptDimensions`，图片生成链路不再默认为封面专用契约。
        - `utils/shared/ai-visual-asset.ts` 已成为五维提示词的唯一共享事实源，统一管理场景 preset、输入来源、默认回退与最终 Prompt 组合逻辑。
        - 编辑器内 `AdminPostsAiImageGenerator` 已从单段 prompt 输入升级为五维模型编辑器，并显示最终组合 Prompt 预览。
        - `components/admin/posts/post-editor-media-settings.vue` 已新增文章配图入口；确认后会把生成图插入 Markdown 正文，并记录到 `metadata.visualAssets`，而不是覆盖 `coverImage`。
        - `Post.metadata` 已新增 `visualAssets[]`，同时保留 `metadata.cover` 作为现有封面消费链路的兼容事实源。
    - 测试结果（按需）:
        - `components/admin/posts/post-editor-media-settings.test.ts`: 4 tests passed。
        - `server/services/ai/image.test.ts`: 11 tests passed。
        - `server/api/ai/image/generate.post.test.ts`: 6 tests passed。
        - `server/utils/ai/prompt.test.ts`: 22 tests passed。
        - `utils/shared/ai-visual-asset.test.ts`: 3 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 当前 UI 实际只接入了文章封面与文章配图；专题头图与活动图仍处于“契约已统一、专属编辑器待接入”状态。
            - 组件测试运行时仍会输出少量历史 i18n 缺键 warning，但不影响本轮视觉资产逻辑验证结论。
    - 未覆盖边界:
        - 未补跑浏览器级 UI 自动化，本轮主要依赖组件测试与静态诊断确认编辑器行为。
        - 未为专题头图 / 活动图新增独立 UI 页面，因此这两类场景目前只在类型、Schema、提示词和服务端契约层完成收敛。
    - 后续补跑计划:
        - 在专题页或活动页编辑器落地时，直接复用当前 `assetUsage` / `applyMode` 契约，并补一轮浏览器级验证。
        - 若未来允许某些后台视觉场景启用 `auto-apply`，需补充一轮服务端自动写回与权限边界回归。

## 认证会话获取频率治理回归（2026-03-21）

### 回归任务记录

- 回归范围: 第十七阶段 P0“认证会话获取频率治理”收口；覆盖 `/api/auth/get-session` 请求收敛、统一 route middleware 读取层、登录 / 注册 / 登出 / 资料更新 / 头像上传后的会话失效与刷新闭环，以及浏览器侧的多标签、刷新、登出同步、会话过期跳转验证。
- 触发条件: 第十七阶段主线条目进入收口，需要把已实施的会话治理逻辑与浏览器级回归证据集中沉淀，并将 `todo.md` 中的对应主线从进行中切换为已完成。
- 执行频率: 本阶段专项回归首轮；后续仅在认证链路、路由守卫、Better Auth 集成或会话失效策略再变更时补写增量记录。
- timeout budget:
    - 定向 Vitest 回归: 15 分钟。
    - 定向 Playwright Chromium 浏览器验证: 20 分钟。
    - 静态检查与编辑器诊断复核: 15 分钟。
- 已执行命令:
    - `pnpm exec vitest run pages/register.test.ts pages/login.test.ts composables/use-auth-session.test.ts components/settings/settings-profile.test.ts app.test.ts components/app-header.test.ts`
    - `pnpm exec playwright test tests/e2e/auth-session-governance.e2e.test.ts --project=chromium`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: 受影响文件编辑器诊断复核通过；`composables/use-auth-session.ts`、`lib/auth-client.ts`、`pages/login.vue`、`pages/register.vue`、`components/app-header.vue`、`components/settings/settings-profile.vue` 与对应测试文件未见错误。
        - V2 / 逻辑层: 定向 Vitest 共 6 个文件 42 个测试通过，覆盖 route cache 版本失效、当前标签页失效、登录 / 注册失败恢复、登出依赖联动、资料更新与头像上传刷新闭环。
        - V3 / 浏览器层: 新增 `tests/e2e/auth-session-governance.e2e.test.ts`，在 Chromium 下完成 4 条浏览器用例，覆盖刷新稳定性、多标签登出同步、当前标签页登出回访保护、清空会话 cookie 后的过期跳转。
    - 结果摘要:
        - `lib/auth-client.ts` 已建立 `/api/auth/get-session` 短时缓存、并发合并、当前标签页失效和多标签广播同步机制。
        - `composables/use-auth-session.ts` 已成为统一会话读取层，route middleware 通过共享 route cache 与显式回源策略处理认证，不再信任 stale live atom 的短路结果。
        - `app.vue` 已在启动阶段接入 `initializeAuthSessionSync()`、hydration prime 与受控生命周期刷新，避免重复请求与缓存层失配。
        - 登录、注册、登出、资料更新与头像上传链路均已接入统一的失效与刷新策略，并为失败分支补齐当前标签页会话恢复。
        - 浏览器侧新增的 4 条 Playwright 用例确认：
            - 已登录设置页刷新后仍保持登录态，且浏览器可见的 `/api/auth/get-session` 请求数受控在 2 次以内。
            - 一个标签页登出后，另一标签页再次访问受保护后台页面会被重定向到登录页。
            - 当前标签页登出后立即回访后台受保护页面会被阻止。
            - 已存在客户端登录态时，若会话 cookie 被清除，下一次访问后台受保护页面仍会跳转到登录页，说明 stale client state 不会被守卫错误信任。
    - 测试结果（按需）:
        - `pnpm exec vitest run pages/register.test.ts pages/login.test.ts composables/use-auth-session.test.ts components/settings/settings-profile.test.ts app.test.ts components/app-header.test.ts`: 6 files passed / 42 tests passed。
    - 浏览器验证（按需）:
        - `pnpm exec playwright test tests/e2e/auth-session-governance.e2e.test.ts --project=chromium`: 4 passed。
        - 用例文件: [tests/e2e/auth-session-governance.e2e.test.ts](../../tests/e2e/auth-session-governance.e2e.test.ts)
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 浏览器验证当前只覆盖 Chromium；Firefox / WebKit 与移动端场景仍未补跑。
            - 当前 E2E 以受保护页面访问与头部交互为主，未扩展到更多后台子页面的长链路回归。
    - 未覆盖边界:
        - 未补跑 Firefox / WebKit，因此多标签广播与 PrimeVue 菜单交互尚未在多引擎下复核。
        - 未做生产构建后的 E2E，仅覆盖 `TEST_MODE=true` 的开发服务环境。
        - 未增加“窗口重新聚焦后触发可见性刷新”的专门浏览器用例；当前主要通过逻辑层测试与刷新稳定性间接覆盖。
    - 后续补跑计划:
        - 在下次认证链路或 Better Auth 升级时，优先补跑 `tests/e2e/auth-session-governance.e2e.test.ts` 的 Firefox / WebKit 项目。
        - 若后续新增更多受保护入口，扩展当前用例组以覆盖作者页、更多后台设置页和匿名访问回退路径。

## 测试、性能与依赖安全干净基线回归（2026-03-21，V2）

### 回归任务记录

- 回归范围: 第十六阶段 P0“测试、性能与依赖安全干净基线”首轮收口；覆盖安装页 / 登录页 / TTS smoke 噪音收敛、Kysely 安全版本升级复核、全量 coverage、最小 Chromium 浏览器验证、构建与 bundle budget，以及发版前依赖安全复核。
- 触发条件: 首次回归基线记录中已明确存在 `pages/login.test.ts` 的 Sentry 初始化噪音、`app.test.ts` 的 `/api/install/status` 未 mock 噪音、TTS 测试链路的 Better Auth warning，且当时未完成 coverage、浏览器验证与性能证据补齐。
- 执行频率: 本阶段专项回归 V2；后续按“发版前 + 阶段收口前”至少再补跑一次依赖审计与性能预算，并在核心认证 / i18n 测试基建调整后重跑零异常日志 smoke。
- timeout budget:
    - 静态门禁（`pnpm lint` / `pnpm typecheck`）: 30 分钟。
    - 定向 smoke / 噪音收敛验证: 10 分钟。
    - 依赖安全审计: 10 分钟。
    - 生产构建: 20 分钟。
    - 全量 `pnpm test:coverage`: 30 分钟。
    - 最小 Chromium 浏览器验证: 20 分钟。
    - Bundle budget: 10 分钟。
- 已执行命令:
    - `pnpm lint`
    - `pnpm typecheck`
    - `pnpm exec vitest run app.test.ts pages/login.test.ts components/language-switcher.test.ts server/api/tasks/tts/[id].get.test.ts`
    - `pnpm audit --registry=https://registry.npmjs.org/ --json`
    - `pnpm build`
    - `pnpm test:coverage`
    - `pnpm exec playwright test tests/e2e/auth.e2e.test.ts --project=chromium --grep "should show login page correctly|should redirect unauthenticated users from admin pages"`
    - `pnpm test:perf:budget`
- 输出摘要:
    - 已执行验证:
        - V1 / 静态层: `pnpm lint` 通过；`pnpm typecheck` 首次补跑暴露 `composables/use-post-editor-voice.ts` 中错误的 `typeof ref<T>` 类型标注，修复为 `Ref<T>` 后再次通过。
        - V2 / smoke 层: `app.test.ts`、`pages/login.test.ts`、`components/language-switcher.test.ts`、`server/api/tasks/tts/[id].get.test.ts` 共 4 个文件 22 个测试通过。
        - V2 / 依赖安全层: npm 官方 registry 审计完成，Kysely high 风险已消失。
        - V3 / 浏览器层: Chromium 下认证链路最小验证 2 个用例通过。
        - V4 / 性能层: 生产构建通过，bundle budget 以 warn 模式完成一次预算比对。
        - Coverage: 全量 `pnpm test:coverage` 通过，235 个测试文件中 234 个通过、1 个跳过。
    - 结果摘要:
        - `nuxt.config.ts` 中前端 `socialProviders` 的显隐条件已与 `lib/auth.ts` 对齐，避免“仅配置 clientId、未配置 secret”时前端仍显示社交登录按钮但服务端未注册 provider 的不一致状态。
        - V1 中记录的三条 smoke 噪音已收敛：登录页 Sentry DSN 缺失不再产生日志，安装页 `/api/install/status` 分支已补 mock，TTS handler 导入链路不再输出 Better Auth social provider warning。
        - `components/language-switcher.vue` 通过显式透传 attrs 消除了安装页测试里的 fragment extraneous attrs warning，并以新增组件测试锁定行为。
        - `lib/auth.ts` 仅在 GitHub / Google 社交登录密钥完整时注册 provider，避免测试环境与未配置环境出现无意义 warning。
        - `sentry.client.config.ts` 改为容忍缺失 `public.sentry` 配置，确保测试环境和最小配置环境不会因空配置触发初始化噪音。
        - `composables/use-post-editor-voice.ts` 中遗留的 `Ref` 类型定义错误已在本轮修复，`pnpm typecheck` 不再因该文件非收敛退出。
        - `package.json` 与 `pnpm-lock.yaml` 中的 Kysely 已升级到 `0.28.14`，本轮审计未再出现此前的 2 条 Kysely high。
        - 全量 coverage 达到项目门槛：Statements `60.06%`、Branches `47.64%`、Functions `53.63%`、Lines `60.02%`。
        - 最小 Chromium 浏览器回归确认登录页可见性与后台未登录重定向链路正常。
        - Bundle budget 当前仍有 1 条超预算 warning：`maxAsyncChunkJs` 为 `477.72KB`，高于 `120KB` 预算；本轮以证据采集为主，未升级为性能治理任务。
    - 测试结果（按需）:
        - `app.test.ts`、`pages/login.test.ts`、`components/language-switcher.test.ts`、`server/api/tasks/tts/[id].get.test.ts`: 4 files passed / 22 tests passed。
        - `pnpm test:coverage`: 234 files passed / 1 file skipped / 1851 tests passed / 1 skipped。
    - 浏览器验证（按需）:
        - `tests/e2e/auth.e2e.test.ts`（Chromium / grep 2 cases）: 2 passed。
        - 验证点: 登录页基础可见性、未登录访问 `/admin/posts` 的跳转保护。
    - 性能结果（按需）:
        - `pnpm build`: 通过，可生成性能预算检查所需产物。
        - `pnpm test:perf:budget`: 完成 warn 模式预算检查；`coreEntryJs` 和 `keyCss` 未超预算，但 `maxAsyncChunkJs` 超预算，当前基线文件缺少 `prIncrementJs` 对比值。
    - 依赖安全结果（按需）:
        - 数据来源: `pnpm audit --registry=https://registry.npmjs.org/ --json`。
        - 可修复项与验证结果: Kysely high 风险已通过升级到 `0.28.14` 关闭；相关 smoke、构建与 coverage 未见显式回归。
        - 未修复的 high+ 风险: 仅剩 `html-minifier@4.0.0`（`mjml -> mjml-cli -> html-minifier`）的 `high` 风险 `GHSA-pfq8-rq6v-vf5m`，当前仍无官方补丁版本。
        - 延期或计划修复判断: `html-minifier` 继续按 warning 延期，理由是上游仍无补丁且本轮功能回归验证未见由该依赖引发的运行异常；后续在上游发布补丁、MJML 链路重构或发版前安全复核时优先重新评估。审计中同时出现的 `h3` moderate 与 `quill` low 不纳入本次 high+ 治理主体。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 全量 coverage 过程中仍有多组与本轮 smoke 范围无关的历史 stderr / warning，集中在 i18n mock、测试基建与个别翻译键缺失，不阻塞本轮基线放行，但会继续污染全量回归信号。
            - Bundle budget 仍存在超预算 warning，说明前端异步大包问题尚未治理，不适合作为“性能已达标”的证据。
            - `html-minifier` high 风险仍无补丁，需继续作为发版前安全复核项保留。
    - 未覆盖边界:
        - 浏览器验证只覆盖 Chromium 的 2 条认证基础链路，未扩展到 Firefox / WebKit、移动端、安装向导或主题切换场景。
        - 性能验证仅执行 bundle budget warn 模式，未升级到 Lighthouse / `pnpm test:perf` 真机指标采集。
        - 全量 coverage 暴露的 `pages/posts/index.test.ts`、`composables/use-admin-i18n.test.ts`、`composables/use-post-export.test.ts`、`composables/use-post-editor-voice.test.ts` 等旧噪音未在本轮继续扩 scope 修复。
    - 后续补跑计划:
        - 发版前重新执行 `pnpm audit --registry=https://registry.npmjs.org/ --json`，确认 `html-minifier` high 风险是否仍无补丁，并复核是否需要把 MJML 链路替换上收为新治理任务。
        - 将 coverage 全量运行中暴露的 i18n / mock 历史噪音单独规划为后续测试基建治理，不在当前 smoke 收敛任务中继续扩写。
        - 若本阶段后续涉及首页、认证或大型前端异步模块，再补跑更高粒度的 V3 浏览器验证与一轮 V4 Lighthouse / 严格预算检查。

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

## 文档、配置与数据库基线同步回归（2026-03-21，收口）

### 回归任务记录

- 回归范围: 第十六阶段“README / 部署 / 翻译文档 / 配置说明同步回归”与“database/*/init.sql、实体与设计文档同步回归”的首轮事实核对；本轮优先检查根目录多语 README、部署与变量说明、文档站路径入口，以及 `docs/design/database.md`、`server/entities/**` 与三套 `database/*/init.sql` 的关键表结构。
- 触发条件: 第十六阶段“专项回归：文档、配置与数据库基线同步”启动，需要先建立一份可继续增量更新的回归记录，并区分已确认漂移与尚待验证项。
- 执行频率: 本阶段专项治理首轮基线；本条记录已作为第十六阶段收口证据归档，后续仅在相关文档、配置或数据库事实再次变更时补写增量回归记录。
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
        - 已再次抽查当前仓库状态，确认根 README 的“方案对比 / Comparison”入口均已指向 `guide/comparison`，`docs/i18n/**` 下不再残留 `@code-reviewer` 旧角色名，日文 README 中 Cloudflare 相关边界说明已与中文、英文口径对齐。
        - 已确认 MySQL `momei_web_push_subscriptions` 先前只对 `endpoint` 前 255 字符做唯一约束，和实体 / 设计文档要求的全值唯一语义存在漂移；已改为基于 `sha2(endpoint, 256)` 生成列的唯一约束实现。
        - 当前未验证出 `web_push_subscriptions`、`post_version`、`setting_audit_logs` 等关键表在三套 `init.sql` 中存在缺表或关键约束缺失；此前只读审计中的相关结论判定为误报，不纳入正式问题清单。
        - 继续扩面核对 `server/entities/**` 与三套 `database/*/init.sql` 后，本轮未再发现新的真实数据库基线漂移；先前候选项中的表名前缀差异、`theme_config.preview_image` 方言类型差异不纳入正式问题清单。
        - `pnpm lint:md` 已在本轮收口复核中再次通过，说明文档改动后的 Markdown 结构仍满足当前门禁。
        - `tests/server/services/web-push.test.ts` 与 `tests/server/database/post.entity.test.ts` 已在本轮收口复核中再次通过；前者不再复现 `web-push` 导入问题，后者继续确认 `post` 实体保持“同 slug + 不同语言允许、同 slug + 同语言拒绝”的唯一约束行为基线。
    - 测试结果（按需）:
        - `pnpm exec vitest run tests/server/services/web-push.test.ts tests/server/database/post.entity.test.ts`: 2 files passed / 4 tests passed。
    - Review Gate 结论:
        - 结论: Pass
        - 问题分级: warning
        - 主要问题:
            - 本轮已满足“关键字段 / 索引对齐 + 最小验证”验收，但仍未升级到三套数据库初始化演练，因此更适合作为“基线已收口、后续继续周期复查”处理，而非“全量证明已完成”。
            - `docs/i18n/**` 除 AI 开发指南外未做同等粒度逐页回归，当前以根 README、部署入口、翻译治理与关键数据库事实源收口为准。
    - 未覆盖边界:
        - 5 类根 README 当前已完成主要入口、术语与平台能力边界核对，但尚未继续扩展到逐段逐链接全覆盖复查。
        - 尚未对 `docs/i18n/**` 下除 AI 开发指南外的全部翻译文档做同等粒度回归。
        - 尚未执行数据库初始化演练；当前数据库最小验证仍以关键表结构核对与定向实体测试为主，尚未形成跨三套 `init.sql` 的初始化级证据。
    - 后续补跑计划:
        - 后续若再调整数据库初始化脚本、实体索引或部署入口文案，应继续按“代码事实源 / 初始化派生物 / 设计文档”三层口径补写增量回归记录。
        - 在后续数据库初始化演练或 Web Push 逻辑调整时，继续补跑 Web Push 相关定向测试，确认本轮唯一约束修复没有影响既有逻辑说明与最小行为基线。

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
