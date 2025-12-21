import { fileURLToPath } from 'node:url'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

const MomeiPreset = definePreset(Aura, {
    semantic: {
        primary: {
            '50': '#f8fafc',
            '100': '#f1f5f9',
            '200': '#e2e8f0',
            '300': '#cbd5e1',
            '400': '#94a3b8',
            '500': '#64748b',
            '600': '#475569',
            '700': '#334155',
            '800': '#1e293b',
            '900': '#0f172a',
            '950': '#020617',
        },
        colorScheme: {
            light: {
                surface: {
                    '0': '#ffffff',
                    '50': '#f8fafc',
                    '100': '#f1f5f9',
                    '200': '#e2e8f0',
                    '300': '#cbd5e1',
                    '400': '#94a3b8',
                    '500': '#64748b',
                    '600': '#475569',
                    '700': '#334155',
                    '800': '#1e293b',
                    '900': '#0f172a',
                    '950': '#020617',
                },
                text: {
                    color: '{surface.700}',
                    mutedColor: '{surface.500}',
                    hoverColor: '{surface.900}',
                },
            },
            dark: {
                surface: {
                    '0': '#020617',
                    '50': '#0f172a',
                    '100': '#1e293b',
                    '200': '#334155',
                    '300': '#475569',
                    '400': '#64748b',
                    '500': '#94a3b8',
                    '600': '#cbd5e1',
                    '700': '#e2e8f0',
                    '800': '#f1f5f9',
                    '900': '#f8fafc',
                    '950': '#ffffff',
                },
                text: {
                    color: '{surface.900}',
                    mutedColor: '{surface.500}',
                    hoverColor: '{surface.950}',
                },
            },
        },
    },
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-12-01',
    devtools: { enabled: false },
    modules: [
        '@nuxt/eslint',
        '@nuxt/test-utils/module',
        '@primevue/nuxt-module',
        '@nuxtjs/i18n',
        '@vueuse/nuxt',
        '@sentry/nuxt/module',
    ],
    runtimeConfig: {
        public: {
            NODE_ENV: process.env.NODE_ENV,
            appName: process.env.NUXT_PUBLIC_APP_NAME,
            authBaseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL,
            clarityProjectId: process.env.NUXT_PUBLIC_CLARITY_PROJECT_ID,
            sentry: {
                dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
                environment: process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
            },
        },
    },
    sentry: {
        sourceMapsUploadOptions: {
            enabled: false,
        },
    },
    primevue: {
        options: {
            theme: {
                preset: MomeiPreset,
                options: {
                    darkModeSelector: '.dark',
                },
            },
        },
        components: {
            include: '*',
        },
    },
    i18n: {
        locales: [
            { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
            { code: 'zh', language: 'zh-CN', name: '简体中文', file: 'zh.json' },
        ],
        defaultLocale: 'zh',
        langDir: 'locales',
        strategy: 'prefix_and_default',
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
        },
    },
    build: {
        // 使用 Babel 转译不兼容的包
        transpile: ['ms', 'debug', (ctx) => !ctx.isDev && 'google-libphonenumber'],
    },
    css: [
        'normalize.css/normalize.css',
        // '@mdi/font/css/materialdesignicons.min.css',
        'primeicons/primeicons.css',
        '@/styles/main.scss',
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
        // 可选：禁用 unenv 对 debug 的默认适配
        unenv: {
            external: ['debug'],
        },
        esbuild: {
            options: {
                target: 'esnext',
                tsconfigRaw: {
                    compilerOptions: {
                        experimentalDecorators: true,
                    },
                },
            },
        },
        typescript: {
            tsConfig: {
                compilerOptions: {
                    esModuleInterop: true,
                    emitDecoratorMetadata: true,
                    experimentalDecorators: true,
                    strictPropertyInitialization: false,
                },
            },
        },
    },
})
