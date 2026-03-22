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
- `ja-JP` 正式对齐治理：已建立 zh-CN 基准 parity 校验脚本，完成后台壳层、`admin-external-links` / `admin-ad` / `admin-friend-links` / `admin-ai` / `admin-marketing` / `admin-settings` / `admin-posts` 对齐，以及 ja-JP deploy / README / roadmap 文档口径同步；当前剩余 `admin-snippets`、`admin-submissions`、`admin-taxonomy`、`admin-users`、`demo`、`feed` 6 个模块共 221 个缺口。

## 第十八阶段：验证基线深化与国际化维护能力收敛

> 执行原则: 先补齐会阻塞放行的浏览器 / 性能 / 依赖安全基线，再推进后台国际化资源治理与 `ja-JP` 正式对齐，最后在阶段容量允许下处理重复代码与共享类型复用治理。

### 1. 主线：浏览器验证与性能预算基线深化 (P0)

- [ ] **补齐 Firefox / WebKit / 移动端关键链路验证，并收敛异步大包预算**
	- 验收: 将认证会话治理、后台受保护页面访问与文章创作主链路的浏览器验证从 Chromium 扩展到 Firefox / WebKit；至少覆盖多标签同步、刷新恢复、未登录跳转、空白新建草稿切换语言与已录入草稿保护 5 类关键场景。
	- 验收: 明确移动端或窄视口下的最小关键路径验证口径，至少覆盖登录入口、后台导航与文章编辑器核心交互，不再只停留在桌面 Chromium。
	- 验收: 收敛当前 `maxAsyncChunkJs` 超预算问题，并补齐 bundle budget、Lighthouse 或等价性能验证记录，明确剩余边界与后续补跑条件。

### 2. 主线：MJML 依赖链高风险替换与 release 安全基线收敛 (P0)

- [ ] **处理 `html-minifier` high 风险的上游链路替换或可验证缓解**
	- 验收: 明确 `mjml` / `mjml-cli` -> `html-minifier` 风险的替换方案、影响范围、回退策略与阶段边界，不再长期仅依赖 allowlist 放行。
	- 验收: 若可在本阶段完成升级或替换，需补齐 release 门禁、邮件模板渲染、构建与定向测试验证；若仍需延期，必须形成更严格的处置结论、缓解口径与触发条件。
	- 验收: 不将该事项扩写为整仓库依赖大升级工程，范围仅围绕当前 release 阻塞链路与其直接影响面。

### 3. 主线：后台 admin locale 大文件拆分与加载注册表治理 (P0)

- [x] **拆分 `i18n/locales/*/admin.json` 并收敛后台 locale 模块注册**
	- 验收: 将后台大文件按稳定域拆分为多个 locale module 文件，例如设置、用户、文章、AI、邮件模板等域，避免继续维持单一超大事实源。
	- 验收: locale 加载层、消息合并策略与注册表同步适配新的 admin 模块结构，不破坏现有 `t()` key 路径与后台页面读取方式。
	- 验收: 至少补齐一次 i18n audit、后台相关定向测试或等价验证，确认拆分后无 key 丢失、覆盖顺序错误或 locale 漏载。
	- 结果: `admin.json` 已收敛为后台壳层模块，并新增 `admin-posts`、`admin-settings`、`admin-users`、`admin-ai`、`admin-email-templates` 等稳定子模块；`i18n/config/locale-modules.ts` 已按后台路由接入按需加载注册。
	- 验证: `CI=1 pnpm exec vitest --run --reporter=verbose i18n/config/locale-modules.test.ts` 通过；`CI=1 pnpm exec vitest --run --reporter=verbose i18n/config/locale-runtime-loader.test.ts` 通过；`pnpm i18n:audit` 通过。

### 4. 主线：`ja-JP` 正式对齐治理 (P1)

- [ ] **将 `ja-JP` 从 `ui-ready` 升格为正式对齐维护语种**
	- 验收: 补齐 `ja-JP` 与 `en-US` / `zh-TW` / `ko-KR` 在核心 i18n 字段、后台 locale 模块、邮件模板文案与初始化字段审计上的 parity 对齐。
	- 验收: 文档侧至少同步 README 镜像、`docs/i18n/ja-JP/**`、翻译治理说明与文档规范中的语言阶段描述，不再沿用“仅首轮覆盖”的历史口径。
	- 验收: 若实施过程中需要提升 locale registry、文档导航或审计脚本门禁，应同步补齐必要验证与说明，避免其他语种继续沿用旧分级假设。
	- 进展: 已新增 `scripts/i18n/check-locale-parity.mjs` 与 `pnpm i18n:check-sync`，统一以 `zh-CN` 为基准输出各 locale / module 的缺失字段与多余字段；已完成 `ja-JP` 后台壳层、设置来源徽标与 admin 高频标题首轮补齐，完成 `admin-external-links`、`admin-ad`、`admin-friend-links`、`admin-ai`、`admin-marketing`、`admin-settings`、`admin-posts` 等高价值后台模块，以及 `docs/i18n/ja-JP/guide/deploy.md`、`docs/i18n/ja-JP/plan/roadmap.md`、`README.ja-JP.md` 的日文同步。目前完整 parity 报告收敛到剩余 6 个模块、221 个缺口。

### 5. 插队修复：WechatSync 微博同步兼容与同步前预检收口 (P1)

- [ ] **修复 WechatSync 微博平台同步错误，并补齐同步前内容预检**
	- 插队原因: WechatSync 已属于当前已交付的多平台分发链路；微博平台同步错误会直接造成既有能力不可用，属于明确回归修复。
	- 验收: 明确微博平台当前报错的根因、影响范围与回退口径，修复已知的同步失败问题，不再仅停留在“已知限制”说明。
	- 验收: 在同步前补齐最小内容预检，至少覆盖账号选择、目标平台内容兼容性或已知限制提示，避免用户提交后才发现不可同步。
	- 验收: 补齐 WechatSync 相关定向验证或测试，确认微博修复与预检逻辑不会破坏其他平台的现有同步链路。

### 6. 扩展：后台翻译工作流标签进度展示补齐 (P1)

- [ ] **将标签翻译纳入后台翻译工作流进度条展示**
	- 验收: 后台翻译工作流在勾选 `tags` 范围时，进度条与字段状态展示必须体现标签翻译，而不再只覆盖标题、摘要与正文。
	- 验收: 标签翻译进度的计算、完成态与失败态需与现有翻译工作流保持一致，不破坏既有文本字段的流式或任务式翻译行为。
	- 验收: 补齐对应的定向测试、交互验证或等价检查，确认标签翻译进度展示与实际翻译结果一致。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

