# 墨梅博客 E2E 覆盖矩阵（第一轮）

本文档作为第二十七阶段 P1“E2E 覆盖矩阵第一轮”的事实源，用于统一记录页面 / 接口风险等级、当前 Playwright 覆盖状态、稳定基线入口与下一步补测优先级。运行期结果、命令输出与 Review Gate 结论继续统一沉淀到 [regression-log.md](./regression-log.md)。

## 1. 使用口径

- 目标: 把现有 Playwright 用例从“有零散文件”收敛为“有矩阵、有优先级、有升级规则”的可追踪基线。
- 基线入口: 最小浏览器基线统一使用 `pnpm test:e2e:critical`，Review Gate 场景统一使用 `pnpm test:e2e:review-gate --scope=<change>`。
- 状态说明:
    - `stable`: 已纳入当前稳定基线，适合作为默认回归入口。
    - `covered`: 已有可运行 Playwright 用例，但尚未纳入最小基线或仍依赖更大范围命令。
    - `partial`: 已有文件或 smoke，但关键断言 / 写链路 / 异常分支仍不足。
    - `planned`: 已识别为高 ROI 缺口，尚未落地稳定用例。

## 2. 页面与流程矩阵

| 风险 | 页面 / 流程 | 代表入口 | 当前状态 | 现有用例 / 证据 | 下一步 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| P0 | 认证会话治理 | `/login` -> `/settings` -> `/admin/posts` | stable | `tests/e2e/auth-session-governance.e2e.test.ts`，`pnpm test:e2e:critical` | 继续守线，后续仅在鉴权 / session 逻辑变化时扩断言 |
| P0 | 移动端后台关键链路 | `/admin/posts` -> `/admin/posts/new` | stable | `tests/e2e/mobile-critical.e2e.test.ts`，`pnpm test:e2e:critical` | 若编辑器结构变化，补移动端保存 / 草稿相关断言 |
| P1 | 首页与公共导航 | `/`、`/posts`、`/categories`、`/tags`、`/archives`、`/submit`、`/feedback`、`/friend-links` | covered | `tests/e2e/home.e2e.test.ts`、`tests/e2e/navigation.e2e.test.ts`、`tests/e2e/public-pages.e2e.test.ts` | 保持只读守线；若导航或壳层改动，再升级到 Review Gate |
| P1 | SEO / 公共展示回归 | 文章、分类、标签、公共静态页 | covered | `tests/e2e/posts.e2e.test.ts`、`tests/e2e/categories-tags.e2e.test.ts`、`tests/e2e/seo-regression.e2e.test.ts` | 与性能主线联动，避免公共页改动无浏览器证据 |
| P1 | 注册校验链路 | `/register` | covered | `tests/e2e/user-workflow.e2e.test.ts` 已锁定空字段、密码不一致、协议勾选与登录入口跳转 | 第二轮按邮件 / token 种子成熟度再评估“注册成功”闭环 |
| P1 | 投稿交易链路 | `/submit` | covered | `tests/e2e/submit.e2e.test.ts` 已锁定前端校验、成功提交、请求 payload 与表单重置 | 后续与后台审核链路串联，补投稿审核闭环 |
| P1 | 后台 taxonomy 管理 | `/admin/categories`、`/admin/tags` | partial | `tests/e2e/admin.e2e.test.ts` 已覆盖页面可达、分类搜索与聚合翻译开关交互；`tests/e2e/admin-workflow.e2e.test.ts` 仍有 `skip` | 第二轮优先补新建 / 更新中的 1 组稳定写链路 |
| P1 | 用户设置 | `/settings` | covered | `tests/e2e/user-workflow.e2e.test.ts` 已覆盖设置页、`apiKeys` / `notifications` 标签页加载 | 第二轮补齐最小资料保存或头像上传提示 |
| P2 | 投稿后台审核 | `/admin/submissions` 或等价入口 | planned | 暂无稳定 Playwright 基线 | 等分发 / 投稿主线继续推进时补审核闭环 |
| P2 | 用户注册成功 / 找回密码成功 | `/register`、`/forgot-password` | partial | 当前仅有展示或静态校验 | 需评估测试模式邮件与 token 种子后再上收 |

## 3. 接口与写链路矩阵

| 风险 | 接口 / 写链路 | 页面触发面 | 当前状态 | 当前证据 | 下一步 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| P0 | `/api/auth/get-session` 与受保护页访问 | 登录后设置页、后台页 | stable | `auth-session-governance.e2e` 已锁定刷新、跨标签页登出与失效会话回退 | 仅在 auth session 实现调整时补新断言 |
| P1 | `/api/posts/submissions` | 投稿页 | covered | `tests/e2e/submit.e2e.test.ts` 已锁定请求拦截、成功提交与表单重置 | 第二轮补后台审核与状态流转证据 |
| P1 | 注册表单前端校验 | 注册页本地校验 + 协议勾选 | covered | `tests/e2e/user-workflow.e2e.test.ts` 已锁定空字段 / 密码不一致 / 协议错误断言 | 第二轮再补注册成功与找回密码成功闭环 |
| P1 | taxonomy 创建 / 更新 | 分类、标签后台 | partial | 页面可达与筛选交互已覆盖，但保存流程未形成稳定 E2E | 第二轮选分类或标签先补 1 组创建写链路 |
| P1 | 用户设置更新 | 设置页 | partial | 已覆盖 profile / apiKeys / notifications 标签页加载 | 评估种子与接口稳定性后补保存成功或失败提示 |

## 4. 首轮优先级

1. 注册页校验链路
   原因: 公共入口、失败成本高、无需复杂种子即可稳定回归。
2. 投稿页校验与成功提交
   原因: 直接覆盖高风险公开写接口 `/api/posts/submissions`，且可通过拦截请求避免污染测试数据。
3. 后台 taxonomy 创建
   原因: 属于后台高风险写链路，但依赖管理员种子与弹窗表单稳定性，放在第一轮第二步更稳妥。
4. 用户设置保存
   原因: 有真实用户价值，但相对前两项更依赖当前测试数据和保存后回写状态。

## 5. 升级规则

- 涉及认证、会话、后台入口或移动端后台导航的改动: 默认复跑 `pnpm test:e2e:critical`。
- 涉及注册、投稿、taxonomy、用户设置等写链路的改动: 先跑对应定向 Playwright 文件；需要 Review Gate 证据时再升级到 `pnpm test:e2e:review-gate --scope=<change>`。
- 涉及公共页面结构、导航、SEO 或主题壳层的改动: 默认复跑对应定向公共页测试；若同时影响关键交互，再升级到 Review Gate。
- 未进入矩阵的探索性场景，不得直接塞进最小基线；先补定向文件并在本矩阵中登记状态与边界。
