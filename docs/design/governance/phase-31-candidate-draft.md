# 第三十一阶段候选上收草案

本文档用于把“下一阶段的 6 项候选事项”补齐为可正式上收的阶段草案。它是第三十一阶段在正式进入 `roadmap.md` 与 `todo.md` 前的冻结工件，负责写清范围、非目标、验收标准与最小验证矩阵。当前第三十一阶段已正式上收到规划文档；本文保留为准入时的历史冻结记录与后续回查入口。

## 1. 准入结论与阶段定位

- 当前阶段定位：第三十阶段已审计归档，第三十一阶段已正式写入 `roadmap.md` / `todo.md`，本文不再承担当前待办入口职责。
- 候选组合：`1` 个新功能预研 + `4` 个治理切片 + `1` 个战略评估，合计 `6` 项，处于规划规范允许上限。
- 准入结论：这 6 项已按本文字段正式上收为第三十一阶段；进入执行时仍需按规划规范补一次 Review Gate，确认没有新增更高优先级插队事项。

## 2. 本轮阶段目标与非目标

### 2.1 阶段目标

- 在不破坏当前已归档主线的前提下，为下一阶段冻结一组可执行、可验收、可验证的候选组合。
- 保持“单项窄切片、证据可落地、回滚边界清晰”的规划口径，避免再次把长期治理主线写成无边界的大任务。
- 为 `caomei-auth` 新功能候选先补齐预研设计工件，再决定是否进入实现阶段。

### 2.2 非目标

- 本文不再负责维护第三十一阶段的实时状态，当前执行状态以 `roadmap.md` 与 `todo.md` 为准。
- 不把 backlog 中的长期主线整体移除；本轮只是定义下一次切片，不代表长期治理主线结束。
- 不把当前 6 项再扩写成第 7 项或更大的并行包。

## 3. 候选事项明细

### 3.1 `caomei-auth` 第三方登录支持评估与接入预研

#### 执行范围

- 基于 `better-auth` 当前 `genericOAuth({ config: [] })` 的空配置入口，定义 `caomei-auth` 的最小接入契约。
- 核对 `caomei-auth` 是否稳定提供 Discovery、授权、令牌、用户信息、JWKS、动态客户端注册与刷新令牌能力。
- 明确账号映射字段、同邮箱合并策略、现有账号绑定策略、异常回退与部署期 ENV 锁定边界。
- 输出“是否允许下一阶段进入真实接入实现”的结论，以及对 `caomei-auth` 上游仍需补齐的能力清单。

#### 非目标

- 不在本阶段直接落地真实登录按钮、回调处理或账号绑定实现。
- 不把现有 GitHub / Google OAuth 配置抽象重构成全新的认证平台工程。
- 不强行承诺 PKCE、撤销接口或 `locale` claim 一定可用；若上游未稳定公开，则只能记为阻塞或后续条件。

#### 验收标准

- 已明确 `caomei-auth` 的 Discovery、授权端点、令牌端点、用户信息端点、JWKS 端点与动态客户端注册端点是否满足接入前提。
- 已明确当前仓库接入锚点位于 `lib/auth.ts`、`lib/auth-client.ts`、认证 ENV 锁定规则与登录页 OAuth 展示边界。
- 已明确 `sub`、`name`、`email`、`email_verified`、`preferred_username`、`picture` 等稳定字段是否足以映射到现有用户模型。
- 已明确 `PKCE`、`offline_access`、令牌撤销、`locale` claim、回调 URI 管理与多环境部署中哪些能力已满足、哪些仍是 blocker。
- 已形成一份专项预研文档，并能直接支撑后续是否正式上收到实现阶段的决策。

#### 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 本地接入锚点 | 已确认 `genericOAuth` 与 `genericOAuthClient` 是当前唯一接入入口 | `lib/auth.ts`、`lib/auth-client.ts` |
| 认证边界 | 已确认 Better-Auth OAuth 配置继续维持 ENV 锁定，不承诺后台热更 | `docs/design/modules/auth.md`、`docs/guide/variables.md` |
| 上游协议能力 | 已核对 Discovery、授权、令牌、用户信息、JWKS、动态注册与刷新令牌能力 | `caomei-auth` 仓库 `docs/api/oauth.md`、`docs/usage/app-integration.md` |
| 风险项清单 | 已明确 PKCE 当前不支持、`locale` claim 稳定性待实测等阻塞点 | [caomei-auth OAuth / OIDC 接入预研](./caomei-auth-oauth-evaluation.md) |

### 3.2 路线图 / Todo 深度归档治理

#### 执行范围

- 对 `roadmap.md` 与 `todo-archive.md` 执行首轮深度归档，优先剥离更早阶段的完整正文，只在主文档保留近线窗口、摘要与索引。
- 明确 `docs/plan/archive/` 的分片规则、阶段区间边界、索引入口与兼容跳转策略。
- 在深度归档完成后，重新核对主文档行数是否回到健康窗口，避免 warning 长期累积成 blocker。

#### 非目标

- 不重写历史阶段结论，也不改写已归档阶段的完成事实。
- 不顺手对所有 `docs/plan/` 文档做大规模目录迁移。
- 不把深度归档扩写成多语翻译同步工程。

#### 验收标准

- `roadmap.md` 在首轮归档后回到 `<= 800` 行健康窗口，或明确记录无法达标的阻塞原因与下一步拆分点。
- `todo-archive.md` 在首轮归档后回到 `<= 1800` 行健康窗口，或明确记录无法达标的阻塞原因与下一步拆分点。
- `docs/plan/archive/index.md` 已新增可追溯的区间索引、兼容入口与读写规则说明。
- 主文档中的阶段索引、归档链接与相对路径未被破坏。

#### 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 归档阈值 | 已执行首轮分片并重新量化主文档行数 | `docs/plan/roadmap.md`、`docs/plan/todo-archive.md` |
| 归档入口 | 已补齐区间分片索引与兼容回链 | `docs/plan/archive/index.md` |
| 链接完整性 | 主文档到分片、分片回主文档的相对路径均可用 | `docs/plan/archive/index.md` + 分片文件 |
| 文档质量门 | Markdown 格式与链接语法检查通过 | `pnpm lint:md` |

### 3.3 国际化运行时加载与文案复用治理

#### 执行范围

- 把 i18n 治理重点从“散点缺词修补”收敛到“运行时加载命中 + 共享命名空间准入 + 缺词 blocker 口径”三件事。
- 扩大 `i18n:verify:runtime` 的覆盖面，至少命中一条公开页装配链路和一组跨公开页 / 后台共享组件文案。
- 为共享 key 上收建立准入清单，明确页面私有、模块共享、真正公共命名空间三类边界。

#### 非目标

- 不重新发起全仓 i18n 大迁移。
- 不把 `unused` 字段清理升级为本轮主要 blocker。
- 不把所有相同中文文本都强制提取成共享 key。

#### 验收标准

- `i18n:audit:missing` 在本轮结束时仍保持 `0` blocker。
- `i18n:verify:runtime` 已扩到公开页装配链路与共享组件文案，不再只覆盖后台局部场景。
- 已明确 shared key 上收准入标准，并在治理文档中保留 raw key / 缺词问题的定级口径。
- 已列出下一批高风险历史热点，而不是继续靠单次修补关闭长期主线。

#### 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 缺词阻断 | `pnpm i18n:audit:missing` 继续为 blocker 且结果为 `0` | `pnpm i18n:audit:missing` |
| 运行时命中 | `pnpm i18n:verify:runtime` 覆盖公开页与共享组件场景 | `pnpm i18n:verify:runtime` |
| 治理口径 | 共享 key 准入清单、缺词分级与回退口径已更新 | `docs/design/governance/i18n-field-governance.md` |
| 回归沉淀 | 本轮执行结果与剩余风险进入阶段回归窗口 | `docs/reports/regression/current.md` |

### 3.4 ESLint / 类型债治理

#### 执行范围

- 把下一轮收敛目标冻结为 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶中的窄切片治理。
- 在真正开工前先产出命中清单、回滚边界与替代写法策略，避免扩写成全仓规则收紧。
- 仅在与该子桶直接相邻、且能共享同一空值防御模式时，才允许少量带出辅助文件。

#### 非目标

- 不并行开启第二条 ESLint 规则的全仓治理。
- 不把 `any`、`unsafe-*`、`max-lines` 等其他治理主线打包进同一项。
- 不为了清零规则而牺牲可读性，写出更难维护的防御样板。

#### 验收标准

- 已冻结本轮 `composables/` 子桶命中清单，并说明为什么这批文件适合在同一轮推进。
- 目标子桶中的非空断言已替换为显式守卫、默认值、类型收窄或提前返回，而不是简单静默豁免。
- 本轮回滚边界明确，未把规则收紧外溢到非目标目录。
- ESLint 与类型检查在受影响范围内通过。

#### 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 命中清单 | 已先列出目标文件与预计处理方式 | `docs/design/governance/eslint-type-debt-tightening.md` |
| 规则验证 | 受影响目录的 `no-non-null-assertion` 命中已清零 | `pnpm exec eslint composables --max-warnings 0` |
| 类型安全 | 窄范围修改后不引入新的类型回退 | `pnpm exec nuxt typecheck` |
| 收口记录 | 本轮切片与回滚边界已落盘 | `docs/design/governance/eslint-type-debt-tightening.md` |

### 3.5 测试覆盖率与有效性治理

#### 执行范围

- 以高风险运行时链路为优先，围绕认证配置边界、locale 归一化 / i18n 运行时加载，以及共享组件文案命中补齐高价值测试。
- 同步强调“失败时真会报错”的红绿有效性，而不是只堆覆盖率数字。
- 在不扩大成全仓补测工程的前提下，维持全仓 coverage 基线不回退，并对目标链路做定向提升。

#### 非目标

- 不把本轮写成全仓 coverage 冲 `80%` 的铺量工程。
- 不接受只有 snapshot、缺少行为断言的低价值补测。
- 不用“测试太贵”为理由跳过对高风险链路的失败用例。

#### 验收标准

- 全仓 coverage 基线不低于当前 `76%+` 水位。
- 至少补齐一组“命名空间漂移 / raw key 暴露 / 认证配置退化时会失败”的行为断言。
- 已明确本轮补测命中的是高风险链路，而不是低价值展示组件平均铺量。
- 回归记录已说明新增覆盖与未覆盖边界。

#### 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 全仓基线 | coverage 不低于当前阶段既有基线 | `pnpm test:coverage` |
| 运行时回归 | i18n 运行时与共享组件链路测试仍保持通过 | `pnpm i18n:verify:runtime` |
| 认证边界 | 与 OAuth / locale 归一化相关的目标测试已补齐 | 受影响 `vitest` 文件 + `docs/reports/regression/current.md` |
| 有效性说明 | 已写明新增失败用例覆盖的真实风险 | `docs/reports/regression/current.md` |

### 3.6 商业化转型可行性重评

#### 执行范围

- 在既有框架文档基础上完成一次真正可决策的商业化重评，输出继续推进、暂缓推进或降级观察三选一结论。
- 明确主卖点是否应收敛为“开源核心 + 付费增强功能”，并指出当前最关键阻塞点更偏向卖点、承接层还是付费信号。
- 明确下一步若继续推进，候选实施面应是什么；若不推进，则应停止到哪一层。

#### 非目标

- 不在本轮直接实现支付、价格页、会员中心或营销后台增强。
- 不把评估再次扩写成广告联盟、SaaS 托管、咨询交付等多条并行商业模式研究。
- 不在没有主卖点结论时提前开启商业化实现阶段。

#### 验收标准

- 已按统一评分维度完成一次明确打分，并得到三选一结论。
- 已明确一个最值得继续验证的付费增强能力，或明确说明当前尚不存在该主卖点。
- 已指出统一承接入口应优先落在哪个页面 / 入口层，而不是继续停留在泛化讨论。
- 已把下一阶段是否允许继续上收商业化实现写成清晰条件，而非模糊建议。

#### 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 评估框架 | 三路径比较、五维评分与结论格式保持一致 | `docs/design/governance/commercialization-reassessment-framework.md` |
| 承接入口核对 | 已核对首页、Demo、About 与项目说明入口 | `pages/index.vue`、`components/demo-banner.vue`、`pages/about.vue` |
| 规划同步 | backlog 与阶段草案口径保持一致 | `docs/plan/backlog.md` + 本文档 |
| 决策结果 | 已输出继续推进 / 暂缓推进 / 降级观察之一 | `docs/design/governance/commercialization-reassessment-framework.md` |

## 4. 正式上收前的最后闸门

以下条件是本文在正式上收时采用的最后闸门，保留用于后续审计回查：

1. 六项候选没有再被更高优先级的 blocker 挤占阶段容量。
2. `caomei-auth` 预研结论已经明确“可接入 / 需上游补齐 / 暂缓接入”的判定。
3. 长期治理主线的切片边界、命中清单与最小验证命令已被执行角色接受。
4. 至少完成一轮针对本文的 Review Gate，确认字段完整性与证据落点没有漂移。

## 5. 相关文档

- [项目长期规划与积压项](../../plan/backlog.md)
- [项目路线图](../../plan/roadmap.md)
- [项目规划规范](../../standards/planning.md)
- [caomei-auth OAuth / OIDC 接入预研](./caomei-auth-oauth-evaluation.md)
- [商业化转型可行性重评框架](./commercialization-reassessment-framework.md)
- [国际化字段治理与共享文案边界收敛](./i18n-field-governance.md)
- [ESLint / 类型债与规则收紧治理](./eslint-type-debt-tightening.md)
