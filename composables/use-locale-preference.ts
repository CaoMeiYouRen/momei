/**
 * 语言偏好持久化（显式切换才写）。
 *
 * 背景：`@nuxtjs/i18n` 的 `detectBrowserLanguage.useCookie` 会在每次 SSR 响应写 `i18n_redirected`，
 * 命中 nitropack 的缓存安全规则使首页 SWR 失效。改为只在用户显式切换语言时由客户端写 cookie，
 * 并在访问根路径时应用该偏好（客户端跳转，不参与 SSR 响应头）。
 */

export const LOCALE_PREFERENCE_COOKIE_KEY = 'i18n_redirected'
export const LOCALE_PREFERENCE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export const useLocalePreference = () => {
    const preference = useCookie<string | null>(LOCALE_PREFERENCE_COOKIE_KEY, {
        maxAge: LOCALE_PREFERENCE_MAX_AGE_SECONDS,
        path: '/',
        sameSite: 'lax',
    })

    /** 用户显式选择语言时调用；这是偏好 cookie 的唯一写入点。 */
    const remember = (code: string) => {
        preference.value = code
    }

    const clear = () => {
        preference.value = null
    }

    return { clear, preference, remember }
}
