// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-03-15',
    devtools: { enabled: true },
    modules: [
        '@nuxt/eslint',
        '@nuxt/test-utils/module',
    ],
    css: [
        '~/assets/styles/main.scss',
    ],
    eslint: {
        config: {
            standalone: false,
        },
    },
    nitro: {
        prerender: {
            // 为匹配 Cloudflare 路由匹配规则，设置 nitro 选项 autoSubfolderIndex 为 false 。
            autoSubfolderIndex: false,
        },
    },
})
