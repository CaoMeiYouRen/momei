# 国际化字段治理与共享文案边界收敛

本文档是 [国际化系统](../modules/i18n.md) 的专项治理补充，聚焦第三十阶段“国际化字段治理 (P1)”的关闭口径：明确 missing blocker、运行时加载边界、共享文案上收准入标准，以及本轮已覆盖模块与后续切片顺序。

本专题不重复描述完整 Locale Registry、SEO 或配置项国际化设计；它只回答“哪些字段应该归谁、哪些验证失败必须阻断、当前这轮治理到底收到了哪里”。

## 1. 背景

本仓库已经具备 locale 模块拆分、按路由动态加载 message module 与缺词审计脚本，但近期问题表明，以下三件事必须分开治理：

1. 翻译字段是否存在。
2. 当前页面是否真的加载了对应模块。
3. 跨页面复用的字段是否放在了正确的命名空间。

如果只做散点补词，仍然可能出现两类回归：

- 语言包里明明有字段，但页面运行时未加载对应模块，最终直接显示 raw key。
- 两个页面文案相同，却被错误地复用到不稳定的共享命名空间，后续再度引入模块归属漂移。

## 2. 本轮范围与非目标

### 2.1 本轮范围

本轮关闭口径只覆盖高频且已明确有运行时风险的链路：

- 后台壳层导航对可选 admin 模块的依赖边界。
- `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 与公开页装配链路的高频字段治理。
- 公开友链元信息接口的显式 locale 覆盖行为。
- 公开友链页与后台友链页的共享字段标签归属。
- 缺词 blocker、运行时验证与定向 parity 的最小验证矩阵。

### 2.2 非目标

- 不新增语种，也不把本轮扩写为全仓 locale 资源重构。
- 不把仍具页面语义差异的字段强行上收到共享命名空间。
- 不把 `unused` 字段清理与 `missing` 缺词阻断混为同一优先级。
- 不把长期 i18n 治理主线从 backlog 中移除；本轮关闭的是第三十阶段切片，不是长期主线终止。

## 3. 字段归属准入标准

本轮正式固化以下四层口径：

### 3.1 页面私有 key

- 仅在单一页面或单一流程中成立。
- 文案虽然字面相同，但仍明显依赖当前页面语义、占位提示、流程说明或局部上下文。
- 应继续保留在页面所属模块中，例如 `pages.links.form.logo_placeholder`、`pages.admin.friend_links.logo_placeholder`。

### 3.2 模块级共享 key

- 会在同一运行时加载边界内被多个页面或组件复用。
- 复用范围仍稳定落在单个 locale module 中。
- 应保留在该模块所属语言包，而不是为了去重提前提升到 `components` 或 `common`。

### 3.3 组件 / 领域共享 key

- 需要跨公开页与后台页、或跨多个 route module 复用。
- 字段语义稳定、字段名稳定、展示语义不再依赖页面局部流程。
- 只有在确认多个入口都应共享同一文案且运行时模块所有权明确时，才允许上收到 `components.<domain>`。

本轮已确认可上收的例子：

- `components.friend_links.fields.site_url`
- `components.friend_links.fields.logo`
- `components.friend_links.fields.rss_url`
- `components.friend_links.fields.contact_email`

### 3.4 `common` 级公共文案

- 仅适用于真正的全局动作、状态或基础名词。
- 必须满足“脱离具体业务领域仍成立”的条件。
- 不能把任何领域字段标签仅因高频出现就提升到 `common`。

## 4. 运行时加载边界

### 4.1 后台壳层

全局后台壳层只允许依赖始终预装的 `admin` 核心词条。即使 `admin-settings`、`admin-ai`、`admin-snippets`、`admin-friend-links` 中存在同名字段，也不能让壳层导航直接引用这些可选模块，否则会在未加载目标模块的页面上泄露 raw key。

本轮已通过 `components/app-header.vue` 与对应测试锁定这条边界。

### 4.2 显式可选模块

若组件职责本身就依赖某个可选模块，必须显式加载目标模块，而不是假设调用方路由一定已经加载。例如后台商业化设置场景依赖 `admin-settings` 时，应继续通过 `useLocaleMessageModules()` 显式请求可选模块。

### 4.3 公开接口 locale 覆盖

面向公开页且支持客户端切换语言的 handler，若语义上允许 query 显式覆盖 locale，必须在 handler 中显式传入 `detectRequestAuthLocale(event, { includeQuery: true })`，并在测试里锁定该行为。

本轮已对友链元信息接口完成这条收敛。

## 5. blocker 矩阵

### 5.1 缺词 blocker

以下入口必须把 `pnpm i18n:audit:missing` 视为 blocker：

- 发布前检查。
- 周级回归入口。
- 阶段收口前回归入口。
- 任何大规模 locale 字段拆分或共享字段迁移后的专项复核。

当前口径：

- `missing` 是 blocker，因为它可能直接把 raw key 暴露到 UI。
- `unused` 不是本轮 blocker，只作为后续清理候选观察。

### 5.2 运行时命中验证

涉及以下任一情况时，必须补跑 `pnpm i18n:verify:runtime`：

- route module 注册或匹配规则调整。
- 共享组件新增可选 locale module 依赖。
- 全局壳层、后台导航、登录/安装等高频入口的文案来源变更。
- 页面私有 key 与共享 key 的上收 / 下沉。

### 5.3 定向 parity

当字段在模块间迁移、或新增共享命名空间字段时，必须按受影响模块补跑：

- `pnpm i18n:check-sync -- --locale=<locale> --module=<module> --fail-on-diff`

本轮至少要求校验 `components`、`public` 与 `admin-friend-links`。

## 6. 本轮已覆盖模块与结果

### 6.1 已完成切片

1. 后台壳层导航边界收敛：壳层导航不再依赖可选 admin 模块词条。
2. 公开友链元信息 locale 覆盖测试：显式锁定 query 优先于 cookie / header 的公开链路行为。
3. 友链公开页 / 后台页共享字段上收：将跨公开页与后台页稳定复用的字段标签提升到 `components.friend_links.fields`。

### 6.2 已覆盖模块

- `admin-settings`
- `admin-ai`
- `admin-snippets`
- `admin-friend-links`
- 公开友链装配链路
- 后台壳层导航

### 6.3 当前基线

截至 2026-04-21：

- `pnpm i18n:audit:missing -- --summary-limit=12` 结果为 `total: 0`。
- `pnpm i18n:verify:runtime` 通过。
- `components`、`public`、`admin-friend-links` 的定向 parity 检查通过。

## 7. 剩余风险与后续顺序

### 7.1 剩余风险

- 仍有部分页面私有 placeholder / hint 文案与字段标签并存，后续若继续上收，必须先确认它们是否真的跨页面同语义，而不是看到字面相近就继续合并。
- 未来若新增跨模块复用字段，最大的回归风险仍是“文案存在但未加载目标模块”，因此任何共享 key 上收都必须先复核运行时所有权。
- 当前 `missing` 已清零，但这不等于长期治理结束；后续模块新增字段时仍可能重新引入缺词债。

### 7.2 后续切片顺序

1. 继续优先处理公开页装配链路中真正跨模块稳定复用的字段，而不是散点补词。
2. 再评估是否存在下一组可上收到 `components.<domain>` 的稳定领域字段。
3. `unused` 字段清理保持单独切片，不与 blocker 治理混做。
