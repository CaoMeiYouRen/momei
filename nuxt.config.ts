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
                    color: '{surface.950}', // 修正：暗色模式下文字使用最亮色，提升可读性
                    mutedColor: '{surface.400}',
                    hoverColor: '{surface.900}', // 修正：悬停时稍微变暗一点（相对于950），或者变亮
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
        '@nuxtjs/sitemap',
    ],
    runtimeConfig: {
        public: {
            NODE_ENV: process.env.NODE_ENV,
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://momei.app',
            appName: process.env.NUXT_PUBLIC_APP_NAME,
            authBaseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL,
            clarityProjectId: process.env.NUXT_PUBLIC_CLARITY_PROJECT_ID,
            baiduAnalyticsId: process.env.NUXT_PUBLIC_BAIDU_ANALYTICS_ID,
            googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID,
            googleSiteVerification:
                process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
            bingSiteVerification:
                process.env.NUXT_PUBLIC_BING_SITE_VERIFICATION,
            siteOperator:
                process.env.NUXT_PUBLIC_SITE_OPERATOR || '[Example Operator]',
            contactEmail:
                process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'admin@example.com',
            defaultCopyright:
                process.env.NUXT_PUBLIC_DEFAULT_COPYRIGHT
                || 'all-rights-reserved',
            demoMode:
                process.env.NUXT_PUBLIC_DEMO_MODE === 'true'
                || process.env.DEMO_MODE === 'true',
            demoUserEmail:
                process.env.NUXT_PUBLIC_DEMO_USER_EMAIL
                || process.env.DEMO_USER_EMAIL
                || 'admin@example.com',
            demoPassword:
                process.env.NUXT_PUBLIC_DEMO_PASSWORD
                || process.env.DEMO_PASSWORD
                || 'momei123456',
            sentry: {
                dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
                environment:
                    process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
            },
            authCaptcha: {
                provider: process.env.NUXT_PUBLIC_AUTH_CAPTCHA_PROVIDER,
                siteKey: process.env.NUXT_PUBLIC_AUTH_CAPTCHA_SITE_KEY,
            },
        },
    },
    sitemap: {
        // 如果需要排除某些路径
        exclude: [
            '/admin/**',
            '/settings/**',
            '/login',
            '/register',
            '/forgot-password',
            '/reset-password',
        ],
        sources: ['/api/_sitemap-urls'],
    },
    app: {
        head: {
            meta: [
                {
                    name: 'google-site-verification',
                    content:
                        process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
                },
                {
                    name: 'msvalidate.01',
                    content:
                        process.env.NUXT_PUBLIC_BING_SITE_VERIFICATION || '',
                },
            ],
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
                    cssLayer: {
                        name: 'primevue',
                        order: 'primevue, momei-base, momei-overrides',
                    },
                },
            },
        },
        components: {
            include: '*',
        },
    },
    i18n: {
        locales: [
            {
                code: 'en-US',
                language: 'en-US',
                name: 'English',
                file: 'en-US.json',
            },
            {
                code: 'zh-CN',
                language: 'zh-CN',
                name: '简体中文',
                file: 'zh-CN.json',
            },
        ],
        defaultLocale: 'zh-CN',
        langDir: 'locales',
        strategy: 'prefix_and_default',
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_redirected',
            redirectOn: 'root',
        },
        baseUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://momei.app',
    },
    build: {
        // 使用 Babel 转译不兼容的包
        transpile: [
            'ms',
            'debug',
            // 'zhlint',
            // 'unified',
            // 'remark-parse',
            // 'remark-gfm',
            // 'remark-frontmatter',
            (ctx) => !ctx.isDev && 'google-libphonenumber',
        ],
    },
    css: [
        'normalize.css/normalize.css',
        'driver.js/dist/driver.css',
        'primeicons/primeicons.css',
        '@/styles/main.scss',
    ],
    eslint: {
        config: {
            standalone: false,
        },
    },
    vite: {
        // optimizeDeps: {
        //     include: ['zhlint', 'debug'],
        // },
    },
    nitro: {
        prerender: {
            // 为匹配 Cloudflare 路由匹配规则，设置 nitro 选项 autoSubfolderIndex 为 false 。
            autoSubfolderIndex: false,
        },
        // 禁用 unenv 对 debug 的默认适配
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
