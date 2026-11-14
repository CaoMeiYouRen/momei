# 首页 SWR 与 i18n 响应 cookie 冲突决策

> 第七十六阶段条目 4 的事实源与决策记录。执行范围与验收见 [项目计划](../../plan/roadmap.md)；背景登记见 [backlog #15](../../plan/backlog.md)。

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

## 7. 决策结论

> 待第七十六阶段条目 4 执行时按 §4 标准填入；未取得生产数据时按 kill-switch 保持现状。
