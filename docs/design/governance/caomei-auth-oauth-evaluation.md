# caomei-auth OAuth / OIDC 接入预研

本文档用于评估“是否把 `caomei-auth` 作为墨梅的新增第三方登录提供方接入”。它只冻结协议能力、字段契约、配置边界与风险清单，不直接承诺进入实现阶段。

## 1. 背景与本地接入锚点

当前仓库的认证主干仍由 `better-auth` 承担：

- 服务端入口：`lib/auth.ts` 已启用 `genericOAuth` 插件，但当前 `config` 仍为空数组。
- 客户端入口：`lib/auth-client.ts` 已启用 `genericOAuthClient()`，说明前端侧已有泛化 OAuth 调用能力。
- 配置边界：`docs/guide/variables.md` 与 `docs/design/modules/auth.md` 已明确 OAuth Client ID / Secret、`AUTH_BASE_URL` 等变量继续维持 ENV 锁定，不支持后台运行时热改。

这意味着 `caomei-auth` 若要进入下一阶段实现，优先级最高的工作不是 UI，而是先确认它能否被当前 `genericOAuth` 接入层稳定消费。

## 2. 已确认的上游能力

基于 `caomei-auth` 仓库当前公开文档与代码，可以先确认以下事实：

- 已公开 OpenID Connect Discovery 端点：`/.well-known/openid-configuration`。
- 已公开 OAuth / OIDC 核心端点：
  - 授权端点：`/api/auth/oauth2/authorize`
  - 令牌端点：`/api/auth/oauth2/token`
  - 用户信息端点：`/api/auth/oauth2/userinfo`
  - JWKS 端点：`/api/auth/jwks`
  - 动态客户端注册端点：`/api/auth/oauth2/register`
- Discovery 示例已声明支持：
  - `authorization_code`
  - `refresh_token`
  - `client_secret_basic`
  - `client_secret_post`
  - `none`
- 用户信息示例已包含：`sub`、`name`、`nickname`、`preferred_username`、`picture`、`email`、`email_verified`，并在示例中出现 `locale`。
- `offline_access` 已出现在 scopes 文档与 provider metadata 中，说明刷新令牌能力在协议层有公开口径。

## 3. 当前阻塞与未确认项

以下风险尚不能视为“已满足接入前提”：

- `PKCE`：`caomei-auth` 文档明确写着授权端点当前版本“不支持” `code_challenge` / `code_challenge_method`；若墨梅后续要求强制 PKCE，则当前不能直接上收实现。
- `locale` claim：虽然 `userinfo` 示例返回了 `locale`，但 Discovery `claims_supported` 当前公开口径仍主要是 `sub`、`name`、`email`、`email_verified`、`preferred_username`、`picture`。`locale` 是否属于稳定 claims 仍需实测确认。
- 令牌撤销 / 登出联动：当前公开材料中已清楚看到 consent revoke，但尚未确认是否提供标准 revocation endpoint，或是否能与墨梅现有 session 生命周期形成稳定闭环。
- 多环境回调地址治理：`caomei-auth` 支持应用级 redirect URI 管理，但仍需确认部署时是否能无痛覆盖本地、预发、正式环境三类回调地址。
- 同邮箱合并与老账号绑定：协议层能拿到 `email` / `email_verified` 并不等于业务层已明确“如何绑定现有账号”。该部分仍需在墨梅侧单独设计。

## 4. 本轮执行范围与非目标

### 4.1 执行范围

- 核对 `caomei-auth` 是否满足墨梅最小 OAuth / OIDC 接入前提。
- 明确与 `genericOAuth` 对接所需的 provider 配置、字段映射、回调地址与 ENV 锁定策略。
- 明确账户映射、账号绑定、错误回退与上游缺口清单。
- 输出“可进入实现 / 需上游补齐 / 暂缓接入”三选一准入结论。

### 4.2 非目标

- 不直接在本轮新增登录按钮、回调路由或账号绑定 UI。
- 不重构墨梅现有 GitHub / Google provider 配置。
- 不把 `caomei-auth` 的全部 OAuth 应用管理能力照搬进墨梅后台。

## 5. 协议能力核对清单

### 5.1 最小协议基线

下一阶段若要进入实现，至少需要确认以下项目：

| 维度 | 当前判断 | 说明 |
| :-- | :-- | :-- |
| Discovery | 已有公开口径 | 已公开 `/.well-known/openid-configuration` |
| Authorization Code | 已有公开口径 | 授权端点与授权码流程示例完整 |
| Token Exchange | 已有公开口径 | 文档明确支持授权码换 token 与刷新 token |
| UserInfo | 已有公开口径 | 已公开 `userinfo` 端点与字段示例 |
| JWKS | 已有公开口径 | 已公开 `jwks` 端点 |
| Dynamic Registration | 已有公开口径 | 已公开 `/api/auth/oauth2/register` |
| Refresh Token | 已有公开口径 | `offline_access` 与 `refresh_token` 已出现 |
| PKCE | 当前不足 | 文档明确当前版本不支持 |
| Revocation | 待确认 | 目前只看到 consent revoke，不等于标准 revocation endpoint |

### 5.2 字段映射基线

墨梅侧最关心的字段映射如下：

| 墨梅用户字段 | 预期来源 | 当前判断 |
| :-- | :-- | :-- |
| `id` | `sub` | 可行 |
| `email` | `email` | 可行 |
| `emailVerified` | `email_verified` | 可行 |
| `name` | `name` / `nickname` | 可行 |
| `username` | `preferred_username` | 可尝试，但需明确是否稳定 |
| `image` | `picture` | 可行 |
| `locale` | `locale` | 待确认是否为稳定 claim |

补充说明：

- 如果 `preferred_username` 并不稳定，墨梅不能把它当作必须字段。
- 如果 `locale` 不能稳定返回，接入阶段应继续回退到墨梅现有 locale 推断链，而不是把语言偏好强依赖在第三方登录上。

## 6. 墨梅侧配置与业务边界

### 6.1 配置边界

- `AUTH_BASE_URL`、站点 URL、OAuth Client ID / Secret 仍应通过 ENV 管理。
- 墨梅不应为了 `caomei-auth` 例外开放后台热修改认证配置。
- 若 `caomei-auth` 要求额外品牌字段、logo、隐私政策链接或条款链接，应视为部署期配置，而不是用户运行时设置。

### 6.2 业务边界

- 若接入真实实现，优先使用“新增 provider + 最小绑定策略”，不触发现有用户系统重构。
- 对已有账号的处理至少要明确：
  - 同邮箱且 `email_verified=true` 时是否允许合并。
  - 已有邮箱密码账号是否允许补绑 `caomei-auth`。
  - 第三方账号登录失败时是否允许降级回邮箱登录。
- 登录失败、缺少必需字段或回调参数异常时，必须沿用现有 Better-Auth 错误处理与 i18n 提示边界。

## 7. 准入结论格式

本轮预研完成后，结论只能落在以下三类之一：

- 允许进入实现：协议能力、字段映射、ENV 边界与账号绑定策略都已足够明确。
- 需上游补齐后再评估：例如必须依赖 PKCE、稳定 `locale` claim、标准 revocation endpoint 或更明确的 claims 契约。
- 暂缓接入：当前收益不足以覆盖接入与维护成本，或协议能力仍与墨梅边界显著不匹配。

## 8. 验收标准

- 已明确 `caomei-auth` 能否被当前 `genericOAuth` 接入层消费，而不是泛泛讨论“支持 OAuth”。
- 已明确最小 provider 配置所需的端点、scope、字段映射与回调地址约束。
- 已明确 `PKCE`、`locale` claim、令牌撤销、账号绑定这四类风险项的当前状态。
- 已明确墨梅侧哪些配置继续保持 ENV 锁定，哪些不应进入运行时设置。
- 已输出一份上游缺口清单，能直接指导后续是否正式进入实现阶段。

## 9. 最小验证矩阵

| 维度 | 最小验证 | 证据落点 |
| :-- | :-- | :-- |
| 本地集成入口 | 已确认服务端 / 客户端接入锚点 | `lib/auth.ts`、`lib/auth-client.ts` |
| 本地认证边界 | 已确认 ENV 锁定与 auth 模块约束 | `docs/design/modules/auth.md`、`docs/guide/variables.md` |
| 上游协议能力 | 已核对 Discovery、授权码、令牌、userinfo、JWKS、动态注册 | `caomei-auth` 仓库 `docs/api/oauth.md` |
| 上游集成指引 | 已核对授权码流程、token exchange 与 userinfo 调用示例 | `caomei-auth` 仓库 `docs/usage/app-integration.md` |
| 风险清单 | 已明确 PKCE 当前不支持、`locale` claim 稳定性待确认、revocation 待确认 | 本文档第 3 节 |

## 10. 后续上收条件

只有同时满足以下条件，才建议把本事项从候选预研上收到真实实现：

1. 已确认墨梅是否接受“当前不支持 PKCE”的第一阶段约束；若不能接受，则先推动上游补齐。
2. 已确认账号绑定与同邮箱合并策略，不会破坏现有登录体系。
3. 已明确 provider 所需 ENV 字段、scope 与回调地址方案，并通过一次最小样机或等价验证。
4. 已确认接入收益足以进入下一阶段容量，而不是挤占更高优先级治理主线。

## 11. 相关文档

- [第三十一阶段候选上收草案](./phase-31-candidate-draft.md)
- [项目长期规划与积压项](../../plan/backlog.md)
- [认证模块](../modules/auth.md)
- [环境变量与配置说明](../../guide/variables.md)
