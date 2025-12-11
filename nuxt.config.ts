// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-03-15',
    devtools: { enabled: true },
    modules: [
        '@nuxt/eslint',
    ],
    css: [
        '~/assets/styles/main.scss',
    ],
    eslint: {
        config: {
            standalone: false,
        },
    },
})
