# 首页 SWR 与 i18n 响应 cookie 冲突决策

> 第七十六阶段条目 4 的事实源与决策记录。背景见本文 §1–§2；执行范围与验收见 [项目计划](../../plan/roadmap.md)。

## 1. 背景

第七十三阶段把 nuxt 升级到 4.6.4，随之引入 nitropack 2.13.6 的缓存安全规则：**响应带 `Set-Cookie` 或 `Cache-Control: private|no-store|no-cache` 时不进入缓存**。

`@nuxtjs/i18n` 的 `detectBrowserLanguage.useCookie` 会让 `/` 每次 SSR 都写 `i18n_redirected`，因此首页 SWR 在 Nitro 侧失效。升级前 nitropack 2.13.5 不校验 `Set-Cookie`，缓存生效但会把该 cookie 复制给所有访客——这是一个**安全修复**，不是可回退的回归。

## 2. 已观测证据（2026-11-10 本地）

| 路由 | 结果 |
| :--- | :--- |
| `/robots.txt`（swr 86400） | 两次请求均返回 `cache-control: s-maxage=..., stale-while-revalidate`，内容与 `X-Sitemap-*` 一致（命中） |
| `/sitemap_index.xml`（swr 3600） | 同上（命中） |
| `/`（无论是否携带 cookie） | 返回 `set-cookie: i18n_redirected=zh-CN`，无 `cache-control`（不缓存） |
| `/posts/:slug` | 无 cookie；`isr` 在 Node preset 本就不写 Nitro 缓存 |

## 3. 候选方案

| 方案 | 内容 | 代价 / 风险 |
| :--- | :--- | :--- |
| ① 保持现状 | 安全优先，首页缓存交给边缘 / CDN 兜底 | 首页回源与 SSR 冷启动成本维持；需 CDN 侧证明命中 |
| ② 条件化 cookie | 关闭 `useCookie`，或仅在需要重定向时写 cookie | 影响语言偏好持久化与 `/` 根重定向；必须验证五语行为 |
| ③ 独立缓存键控 | `/` 走独立边缘缓存键控 | 必须证明不泄漏 cookie；实现与运维复杂度最高 |

## 4. 决策标准

1. 不放宽 nitropack 的缓存安全规则，不恢复「把 `i18n_redirected` 复制给所有访客」。
2. 首页缓存必须有可复跑探针或线上命中 / 回源数据；只用本地结果不足以改动缓存策略。
3. 语言偏好持久化与五语根重定向不得回退；若方案 ② 无法同时满足，选 ① 或 ③。
4. 决策落盘后才进入最小实现；数据不可得时只交付决策记录并保持现状。

## 5. 非目标

- 不改 `routeRules` 的 swr / isr 时长。
- 不改鉴权、会话链路与 cookie 安全属性。
- 不为了恢复缓存而关闭 4.6.4 的缓存安全校验。

## 6. 验收与证据

- 决策记录（本节 + 选定方案）落盘。
- 选定方案附可复跑探针：`/` 的 `set-cookie` / `cache-control`、首页命中 / 回源；选 ② / ③ 时另附五语重定向用例。
- 证据写入 `artifacts/review-gate/`，并在回归窗口记录一条第七十六阶段条目 4 窗口。

## 7. 决策结论（2026-11-15）

**选定方案：① 保持现状 + 边缘兜底；本阶段不做代码改动。**

### 7.1 线上证据（2026-11-15，`https://momei.app`）

| 请求 | 关键响应头 | 判定 |
| :--- | :--- | :--- |
| `/`（连续 2 次） | `set-cookie: i18n_redirected=zh-CN`；无 `cache-control`；`cf-cache-status: DYNAMIC` | 每次回源，边缘未缓存 |
| `/` + `Accept-Language: en-US` | 同上（仍写 `i18n_redirected=zh-CN`，返回 200 而非 3xx） | 语言重定向不在 SSR 层；`/` HTML 对访客语言中立 |
| `/` + `Cookie: i18n_redirected=en-US` | 同上（仍写 `zh-CN`） | 根路径会覆盖偏好 cookie 的持久化语义 |
| `/en-US` | `set-cookie: i18n_redirected=en-US`；`cf-cache-status: DYNAMIC` | 带前缀路由同样因 `Set-Cookie` 回源 |
| `/robots.txt`（swr 86400） | `cache-control: public, max-age=86400, s-maxage=86400`；`age: 95`；`cf-cache-status: HIT` | 边缘缓存链路本身可用 |

结论：① 的「边缘兜底」目前仅对无 cookie 路由生效；`/` 因 `Set-Cookie` + 无 `cache-control` 被 Cloudflare 判为 `DYNAMIC`。Nitro 的缓存安全规则是**安全修复**，不放宽。

### 7.2 方案取舍

- **② 条件化 cookie（未采纳）**：`useCookie: false` 能让 `/` 去掉 `Set-Cookie` 并进入 SWR / 边缘缓存；但会丢失「显式切换语言」的跨会话持久化，且需把五语重定向改为纯客户端逻辑并补完整 E2E。当前 `/` 的 SSR 固定返回 `zh-CN` 的 200（`Accept-Language` 不改变 SSR 输出、无 3xx），语言切换依赖客户端；改造可行但属产品行为变更，需独立条目与验收，不在本条目的「最小实现」范围内。
- **③ 独立缓存键控（未采纳）**：需在 Cloudflare 侧配置 Cache Key（`Accept-Language` / 偏好 cookie）与 Vary 策略，属于运维配置，无法由仓库内最小实现保证；且与 `Set-Cookie` 阻断缓存的原点冲突（仍需 ② 的前置改造）。
- **①（采纳）**：零代码改动、零安全回退；`/` 的 SSR 冷启动成本维持，但当前线上本就未命中边缘缓存，未造成额外退化。后续收益依赖 ② + ③ 的组合改造（`routeRules['/'] = { swr: 3600 }` 已存在，② 去 `Set-Cookie` 后即可进入缓存）。

### 7.3 复跑探针

```bash
curl -sS -D - -o /dev/null https://momei.app/ | grep -Ei 'set-cookie|cache-control|cf-cache-status'
curl -sS -D - -o /dev/null -H 'Accept-Language: en-US,en;q=0.9' https://momei.app/ | grep -Ei 'set-cookie|cache-control|cf-cache-status'
curl -sS -D - -o /dev/null https://momei.app/robots.txt | grep -Ei 'cache-control|cf-cache-status'
```

判定：`/` 仍为 `DYNAMIC` 且带 `set-cookie` → 维持 ①；若未来 ② 落地后 `/` 出现 `s-maxage` 且无 `set-cookie`，应同时验证 `cf-cache-status` 为 `HIT` / `MISS`（而非 `DYNAMIC`）与五语重定向。

### 7.4 后续候选

已登记 backlog 短期候选「首页缓存与语言检测解耦（② + ③ 组合）」，包含：`useCookie: false` 或仅在显式切换时写 cookie、`/` 去 `Set-Cookie`、客户端重定向 E2E、边缘 Cache Key 运维配置与命中验证。未完成前不得放宽 nitropack 缓存安全规则。
