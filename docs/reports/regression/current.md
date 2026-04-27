# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

兼容期内，既有历史正文仍可通过 [docs/plan/regression-log.md](../../plan/regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。

## 2026-04-27 `composables` 子桶 `no-non-null-assertion` 收口

### 范围

- 目标：完成第三十一阶段 `ESLint / 类型债治理（composables 子桶） (P1)` 的收口，冻结 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 生产源码中的真实命中，并打通目录级 ESLint 与类型验证闭环。
- 本轮覆盖：`composables/use-post-editor-io.ts` 的 Markdown frontmatter 导入分支、`composables/use-asr-direct.ts` 的重复 PCM helper 收敛、`utils/web/audio-compression.ts` 的现有复用点，以及 `eslint.config.js`、当前阶段待办与治理设计文档的事实源同步。
- 非目标：不把 `composables/**` 整体提升为 `no-non-null-assertion` 治理目录，不扩写到 `any`、`unsafe-*` 或其他规则主线，也不把 `use-asr-direct.ts` 拆成多文件重构工程。

### 实施结论

- 重新复核 `composables/` 生产源码后，`@typescript-eslint/no-non-null-assertion` 的真实命中已收敛到 `composables/use-post-editor-io.ts` 单文件，共 `8` 处，集中在 frontmatter 多别名字段导入链路。
- 这 `8` 处已统一改写为局部变量、显式守卫与类型分支：`slug`、`summary`、`coverImage`、`copyright`、`language`、`audio url`、`audio size` 与 `audio mimeType` 的读取路径不再依赖后缀 `!`。
- `eslint.config.js` 已新增只作用于 `composables/use-post-editor-io.ts` 的 `@typescript-eslint/no-non-null-assertion` warning override，确保规则回滚边界仍保持在“单文件 + 单条配置”。
- `composables/use-asr-direct.ts` 末尾的重复 PCM 转换 helper 已改为直接复用 `utils/web/audio-compression.ts` 中现有的 `float32ToPcmInt16()`，文件长度回到阈值内，未再引入新的运行时分支。
- 目录级扫描未再发现 `composables/` 生产源码里的剩余非空断言形态，`pnpm exec eslint composables --max-warnings 0` 已恢复通过。

### 已执行验证

- 定向 ESLint：`pnpm exec eslint composables/use-post-editor-io.ts --rule '{"@typescript-eslint/no-non-null-assertion":"error"}'`
	- 结果：通过；首轮修复后该文件的 `8` 处非空断言命中已清零。
- 定向 Vitest：`pnpm exec vitest run composables/use-post-editor-io.test.ts`
	- 结果：通过；`9` 个测试全部通过，frontmatter 导入与音频元数据映射行为保持稳定。
- 定向 Vitest：`pnpm exec vitest run composables/use-asr-direct.test.ts`
	- 结果：通过；`8` 个测试全部通过，ASR 直连重连、发送音频与停止逻辑保持稳定。
- 根仓类型检查：`pnpm exec nuxt typecheck`
	- 结果：通过；未发现本轮类型回归。
- 目录级 ESLint：`pnpm exec eslint composables --max-warnings 0`
	- 结果：通过；`composables` 子桶当前无 warning / error。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；`no-non-null-assertion` 的真实命中已在 `composables` 子桶中清零，目录级 ESLint、类型检查与受影响链路测试均通过。

### 未覆盖边界

- 当前 `composables` 子桶的 `no-non-null-assertion` 只正式上收到 `use-post-editor-io.ts`；后续若继续推进，仍应保持单一 composable 切片策略，而不是直接把规则外溢到整个 `composables/**`。
- `use-asr-direct.ts` 本轮只做了重复 helper 复用与行数收敛，没有顺手扩写为更大规模的 ASR helper 下沉或协议层重构；相关长线优化仍应独立评估。

## 2026-04-24 第三十一阶段国际化运行时加载与文案复用治理切片

### 范围

- 目标：完成第三十一阶段 `国际化运行时加载与文案复用治理 (P0)` 的当前切片，确认缺词 blocker 继续为 `0`，把运行时回归入口正式扩到一条公开页装配链路与一组跨公开页 / 后台共享字段场景，并清理一批已确认的 `unused` 国际化字段。
- 本轮覆盖：`package.json` 中 `i18n:verify:runtime` 的定向测试矩阵、`pages/about.test.ts` 的公开页真实文案装配断言、`pages/admin/friend-links/index.vue` 与 `components/settings/settings-notifications.vue` 的有限集合动态 key 显式化，以及 `i18n/locales/*/settings.json` 中确认废弃字段的删除。
- 非目标：不调整 `locale-runtime-loader` 实现，不发起全仓 locale 模块重构，不把后续新增 `unused` 清理扩写为独立长线 blocker 工程，也不继续扩大为更多公开页的铺量补测。

### 实施结论

- `i18n:verify:runtime` 现在除了 locale 模块解析、运行时加载器、后台壳层、登录页和商业化设置组件外，还固定覆盖 About 公开页与友链公开页 / 后台页共享字段链路。
- About 页测试已从“页面结构存在”升级为“真实翻译装配命中”，会直接拦截 `pages.about.*` raw key 泄漏到公开页 UI。
- 友链共享字段链路继续沿用 `components.friend_links.fields.*` 作为领域共享命名空间，固定验证公开页与后台页不会回退到页面私有 key。
- 友链后台页与通知设置页中原本依赖模板字符串拼接的有限集合动态 key，现已改为显式静态 key 映射；`i18n:audit:unused` 不再把这些真实在用字段误判为未使用。
- `settings` 模块内已删除一组确认废弃的浏览器通知字段：`browser_type_desc.marketing`、`web_push`、`web_push_desc`，五种 locale 保持同步收敛。
- 共享 key 上收准入标准、`missing` 优先于 `unused` 的缺词定级口径，以及长期热点切片顺序，继续以 `docs/design/governance/i18n-field-governance.md` 与 `docs/plan/backlog.md` 为事实源。

### 已执行验证

- `pnpm i18n:audit:unused -- --summary-limit=20`
	- 结果：通过；`Unused candidate summary: total: 0`。
- `pnpm i18n:audit:missing -- --summary-limit=12`
	- 结果：通过；`Missing parity summary: total: 0`。
- `pnpm i18n:verify:runtime`
	- 结果：通过；`8` 个测试文件、`55` 条断言全部通过，覆盖公开页装配链路、共享字段链路与既有运行时加载边界。
- `pnpm exec nuxt typecheck`
	- 结果：通过；显式成功标记 `NUXT_TYPECHECK_OK`。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：无 blocker；本轮新增验证面直接命中当前阶段验收要求，且未引入新的运行时加载实现分叉。

### 未覆盖边界

- `pnpm i18n:verify:runtime` 当前公开页只新增了 About 链路；后续若继续上收，优先补 `app-footer` 友链区域与 `archives` / `categories` / `tags` 等公开列表页装配链路，而不是继续增加同类静态页面结构断言。
- 共享组件命名空间当前继续聚焦友链字段与商业化设置场景；下一批高风险历史热点仍优先观察 `admin-settings`、`admin-ai`、`admin-snippets` 与未来新增的跨模块共享字段，而不是回头做全仓 `unused` 清扫。

## 2026-04-22 第三十阶段归档放行复核

### 范围

- 目标：为第三十阶段“远程仓库同步与治理基线细化推进（Hexo 风格导出）”补齐阶段归档动作本身的独立放行证据，确保规划状态从“执行中”切换到“已审计归档”时，具备可直接引用的 phase-close 记录。
- 本轮覆盖：`docs/plan/todo.md`、`docs/plan/todo-archive.md`、`docs/plan/roadmap.md`、`docs/plan/backlog.md` 的阶段状态一致性；`docs/i18n/*/plan/roadmap.md` 的摘要同步；以及 `docs/reports/regression/current.md` 与 `docs/reports/regression/archive/**` 的证据链挂接完整性。
- 非目标：不重做第三十阶段六条主线的实现级 review；各主线实现、验证矩阵与 Review Gate 结论仍以上述 2026-04-21 近线记录及历史归档记录为准。

### 归档结论

- 第三十阶段六条主线均已具备独立收口证据：远程仓库同步（Hexo 风格 / GitHub / Gitee）候选落地、文档翻译 freshness 清偿、国际化字段治理、重复代码与纯函数复用治理、存量代码注释治理，以及 ESLint / 类型债与规则收紧治理，均已在本文件近线窗口或历史归档分片中形成实现结论、最小验证矩阵、Review Gate 与未覆盖边界。
- 中文事实源已完成阶段切换：`todo.md` 已清理第三十阶段执行正文，`todo-archive.md` 已追加完整归档块，`roadmap.md` 已改为“已审计归档”，`backlog.md` 已同步更新长期主线的最近一次上收阶段与状态说明。
- 多语摘要已同步：`en-US`、`zh-TW`、`ko-KR`、`ja-JP` 的 roadmap 摘要已改为第三十阶段“已审计归档”，并与中文事实源对齐“存量代码注释治理”主线表述。
- 回归证据链已闭环：活动窗口维持在可控规模内，历史归档分片的日期窗口与正文内容已重新对齐，第三十阶段归档动作本身现可由本条记录直接放行引用。

### 最低验证矩阵

- 验证层级：`V0 + V1 + RG`。
- V0：核对阶段归档最小清单，包括中文事实源、backlog、多语 roadmap 摘要，以及阶段主线证据链与历史归档索引。
- V1：执行规划 / 回归文档的编辑器诊断检查、`pnpm docs:check:source-of-truth`、`pnpm docs:check:i18n`、`pnpm lint:md`，并复核活动回归窗口未超过当前归档阈值。
- RG：本轮 Review Gate 结论为 `Pass`。

### 已执行验证

- 编辑器诊断：`docs/plan/todo.md`、`docs/plan/todo-archive.md`、`docs/plan/roadmap.md`、`docs/plan/backlog.md`、`docs/reports/regression/current.md`、`docs/reports/regression/archive/index.md`、`docs/reports/regression/archive/2026-04-18-to-2026-04-21.md`、`docs/i18n/*/plan/roadmap.md`
	- 结果：通过；上述文件无新增错误。
- `pnpm docs:check:source-of-truth`
	- 结果：通过；中文事实源与多语摘要 freshness / source-only 契约保持一致。
- `pnpm docs:check:i18n`
	- 结果：通过；未发现旧目录回流或重复翻译页。
- `pnpm lint:md`
	- 结果：通过；阶段归档与回归分片调整未引入 Markdown 结构错误。
- 活动窗口体量复核：`docs/reports/regression/current.md`
	- 结果：当前窗口为 `254` 行（补档前测量），维持在健康范围内；本轮仅补充阶段放行记录，不涉及旧正文回流。

### Review Gate

- 结论：Pass
- 问题分级：none
- 主要问题：此前唯一 blocker 是“第三十阶段归档动作缺少独立 phase-close 放行证据”；当前已由本条记录补齐，规划状态切换与证据链挂接可以正式闭环。

### 未覆盖边界

- 本条记录只为第三十阶段归档动作提供统一放行入口，不替代六条主线各自的实现级回归记录；后续复查具体链路时，仍应回到对应的 2026-04-21 主线条目或历史归档切片。
- 第三十一阶段尚未正式落盘；后续只允许以候选方案形式评估“一个新功能 + 若干优化”，不得引用本条记录直接替代下一阶段准入。

## 近线窗口外历史入口

- 2026-04-21 的历史治理记录已整体迁移到 [archive/2026-04-21-governance-rollup.md](./archive/2026-04-21-governance-rollup.md)。
