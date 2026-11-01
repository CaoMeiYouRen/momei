import { getSocialProviderAvailability } from '@/server/utils/social-providers'
import type { SocialProviderAvailability } from '@/utils/shared/social-providers'

/**
 * 社交登录可用性的**请求期**注入（仅服务端）。
 *
 * 背景：可用性依赖仅服务端可见的 `*_CLIENT_SECRET`，且必须在运行期判定。此前在
 * `nuxt.config.ts` 用构建期 `process.env` 算成布尔值写进 `runtimeConfig.public`，生产环境
 * （非 `NUXT_` 前缀变量不参与运行期注入）会把它永久烘焙为 `false`，登录页因此不显示社交按钮。
 *
 * 为什么用 `useState` 而不是新开 API 端点：Nuxt 的 payload 天然把 `useState` 从服务端序列化到
 * 客户端，无需新增路由（2026-11 实测：本仓新增任意路由都会让既有多处类型化 `$fetch<T>` 调用
 * 触发 `TS2589`）。插件在页面 setup 之前运行，页面直接读取。
 *
 * 预渲染退化：若将来对 `/login` 开启 prerender 或使用 `nuxt generate`，payload 会把构建时的
 * 可用性固化——静态站本就没有 better-auth 服务端路由，社交登录不可用，属可接受退化。
 *
 * 默认值由共享常量提供：在测试环境或插件缺失时保持「全部不可用」，不会闪现又消失。
 */
export default defineNuxtPlugin(() => {
    const availability = getSocialProviderAvailability()

    useState<SocialProviderAvailability>('auth-social-providers', () => availability)
})
