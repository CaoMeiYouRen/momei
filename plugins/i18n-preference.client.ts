/**
 * 在根路径上应用「显式切换过的语言偏好」。
 *
 * 只读取客户端 cookie 后做客户端跳转，刻意不参与 SSR：
 * - SSR 读 cookie 会按访客偏好产出不同 HTML，破坏 `/` 的 SWR 缓存键；
 * - 写 cookie 更会命中 nitropack 缓存安全规则，使首页缓存彻底失效。
 *
 * 实现约束（实测得出）：
 * - 插件 setup 期**只能**调用 `useCookie` 这类与 i18n 上下文无关的组合式；在 setup 期调用
 *   `useI18n()` 会让整个应用渲染进入错误页（i18n 上下文尚未安装）。
 * - 因此 i18n 状态统一从 `nuxtApp.$i18n` 读取，路由从 `nuxtApp.$router` 读取，
 *   且都在 `app:mounted` 之后执行，避免与 i18n 自身的浏览器语言检测竞争。
 */
export default defineNuxtPlugin((nuxtApp) => {
    if (import.meta.server) {
        return
    }

    const { preference } = useLocalePreference()

    nuxtApp.hook('app:mounted', async () => {
        const value = preference.value

        if (!value) {
            return
        }

        const composer = nuxtApp.$i18n as unknown as {
            locale: { value: string }
            locales: { value: { code: string }[] }
        }
        const currentRoute = nuxtApp.$router.currentRoute.value
        const supported = composer.locales.value.some((item) => item.code === value)

        if (currentRoute.path !== '/' || !supported || composer.locale.value === value) {
            return
        }

        await nuxtApp.runWithContext(() => navigateTo(`/${value}`, { replace: true }))
    })
})
