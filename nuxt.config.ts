import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { APP_DEFAULT_LOCALE, NUXT_I18N_LOCALES } from './i18n/config/locale-registry'
import { repairRolldownClientInitImports } from './scripts/build/repair-rolldown-client-init-imports.mjs'

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
        process.env.VITEST && '@nuxt/test-utils/module',
        '@primevue/nuxt-module',
        '@nuxtjs/i18n',
        '@vueuse/nuxt',
        '@sentry/nuxt/module',
        '@nuxtjs/sitemap',
        !process.env.VITEST && '@vite-pwa/nuxt',
    ].filter((entry): entry is string => Boolean(entry)),
    hooks: {
        'build:done': async () => {
            // Windows 性能优化: repair 脚本仅在非 Windows 环境运行（Windows 构建耗时已不可接受）
            if (process.platform !== 'win32') {
                await repairRolldownClientInitImports()
            }
        },
    },
    pwa: {
        registerType: 'autoUpdate',
        manifest: {
            name: '墨梅博客',
            short_name: '墨梅',
            theme_color: '#64748b',
            icons: [
                {
                    src: 'logo.png',
                    sizes: '512x512',
                    type: 'image/png',
                },
            ],
            shortcuts: [
                {
                    name: '快速灵感',
                    short_name: '快速灵感',
                    url: '/admin/snippets/capture',
                    icons: [{ src: 'logo.png', sizes: '512x512' }],
                },
            ],
            display: 'standalone',
        },
        workbox: {
            // 生产部署后立即接管新版本，避免旧 SW 继续提供过期 CSS/HTML 组合。
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            navigateFallback: '/',
            // SSR 站点部署后不会长期保留旧 hash 资源，禁止导航兜底继续回放过期 app shell。
            navigateFallbackDenylist: [/^\/.*$/],
            globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        },
        devOptions: {
            enabled: false,
        },
    },
    runtimeConfig: {
        authCaptchaSecretKey: process.env.AUTH_CAPTCHA_SECRET_KEY,
        // 定时任务安全配置
        cronSecret: process.env.CRON_SECRET,
        tasksToken: process.env.TASKS_TOKEN,
        webhookSecret: process.env.WEBHOOK_SECRET || process.env.TASKS_TOKEN,
        public: {
            NODE_ENV: process.env.NODE_ENV,
            siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://momei.app',
            appName: process.env.NUXT_PUBLIC_APP_NAME,
            authBaseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL,
            clarityProjectId: process.env.NUXT_PUBLIC_CLARITY_PROJECT_ID,
            baiduAnalyticsId: process.env.NUXT_PUBLIC_BAIDU_ANALYTICS_ID,
            googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID,
            umamiAnalytics: process.env.NUXT_PUBLIC_UMAMI_ANALYTICS,
            googleSiteVerification:
                process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
            bingSiteVerification:
                process.env.NUXT_PUBLIC_BING_SITE_VERIFICATION,
            siteOperator:
                process.env.NUXT_PUBLIC_SITE_OPERATOR || '[Example Operator]',
            contactEmail:
                process.env.NUXT_PUBLIC_CONTACT_EMAIL || 'admin@example.com',
            postCopyright:
                process.env.NUXT_PUBLIC_POST_COPYRIGHT
                || process.env.NUXT_PUBLIC_DEFAULT_COPYRIGHT
                || 'all-rights-reserved',
            defaultCopyright:
                process.env.NUXT_PUBLIC_POST_COPYRIGHT
                || process.env.NUXT_PUBLIC_DEFAULT_COPYRIGHT
                || 'all-rights-reserved',
            siteCopyrightOwner:
                process.env.NUXT_PUBLIC_SITE_COPYRIGHT_OWNER
                || process.env.NUXT_PUBLIC_FOOTER_COPYRIGHT_OWNER
                || process.env.NUXT_PUBLIC_SITE_OPERATOR
                || '[Example Operator]',
            siteCopyrightStartYear:
                process.env.NUXT_PUBLIC_SITE_COPYRIGHT_START_YEAR
                || process.env.NUXT_PUBLIC_FOOTER_COPYRIGHT_START_YEAR
                || '',
            // 备案信息配置
            showComplianceInfo:
                process.env.NUXT_PUBLIC_SHOW_COMPLIANCE_INFO === 'true' || false,
            icpLicenseNumber:
                process.env.NUXT_PUBLIC_ICP_LICENSE_NUMBER || '',
            publicSecurityNumber:
                process.env.NUXT_PUBLIC_PUBLIC_SECURITY_NUMBER || '',
            demoMode:
                process.env.NUXT_PUBLIC_DEMO_MODE === 'true'
                || process.env.DEMO_MODE === 'true',
            testMode:
                process.env.NUXT_PUBLIC_TEST_MODE === 'true'
                || process.env.TEST_MODE === 'true',
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
            socialProviders: {
                github: !!(
                    (process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID)
                    && process.env.GITHUB_CLIENT_SECRET
                ),
                google: !!(
                    (process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)
                    && process.env.GOOGLE_CLIENT_SECRET
                ),
            },
            // 安全配置
            securityUrlWhitelist: process.env.NUXT_PUBLIC_SECURITY_URL_WHITELIST || '',
            // 上传配置同步到前端
            maxUploadSize: process.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE,
            maxAudioUploadSize: process.env.NUXT_PUBLIC_MAX_AUDIO_UPLOAD_SIZE,
            localStorageBaseUrl: process.env.NUXT_PUBLIC_LOCAL_STORAGE_BASE_URL,
            // Hugging Face 镜像代理
            hfProxy: process.env.NUXT_PUBLIC_HF_PROXY || 'https://huggingface.co',
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
            locale: zh_CN,
        },
    },
    i18n: {
        locales: NUXT_I18N_LOCALES,
        defaultLocale: APP_DEFAULT_LOCALE,
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
        '@mdi/font/css/materialdesignicons.css',
        'primeicons/primeicons.css',
        '@/styles/iconfont/iconfont.css',
        '@/styles/main.scss',
    ],
    eslint: {
        config: {
            standalone: false,
        },
    },
    vite: {
        resolve: {
            // 规避 pnpm + Vite 下 PrimeVue Overlay / 动态组件样式变量偶发丢失
            dedupe: [
                'primevue',
                '@primevue/core',
                '@primevue/icons',
                '@primeuix/styled',
                '@primeuix/styles',
                '@primeuix/themes',
            ],
            // Windows 性能优化: 收紧扩展名列表减少 FS 检查次数（每减少 1 项 = 每次 import 省 1 次 stat）
            extensions: ['.mjs', '.js', '.ts', '.mts', '.vue', '.json'],
        },
        server: {
            // Windows 性能优化: 预热常用入口，避免首个请求才触发 on-demand 转换链
            warmup: {
                clientFiles: [
                    './.nuxt/nuxt.d.ts',
                    './app.vue',
                    './pages/index.vue',
                    './layouts/default.vue',
                    './components/app-header.vue',
                    './components/app-footer.vue',
                ],
            },
        },
        optimizeDeps: {
            include: [
                'primevue/config',
                'primevue/dialog',
                'primevue/confirmdialog',
                'primevue/toast',
                'primevue/datepicker',
                'primevue/select',
                'primevue/autocomplete',
                '@primevue/core',
                '@primeuix/styled',
                '@primeuix/styles',
            ],
        },
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "@/styles/_variables.scss" as *; @use "@/styles/_mixins.scss" as *;',
                },
            },
        },
        ssr: {
            noExternal: ['quill'],
        },
        build: {
            rolldownOptions: {
                external: ['quill'],
            },
        },
    },
    nitro: {
        sourceMap: false,
        experimental: {
            websocket: true,
        },
        vercel: {
            functions: {
                maxDuration: 60,
            },
        },
        ignore: [
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/tests/**',
        ],
        prerender: {
            // 为匹配 Cloudflare 路由匹配规则，设置 nitro 选项 autoSubfolderIndex 为 false 。
            autoSubfolderIndex: false,
        },
        // Vercel CDN 缓存 Tier 2：配置 ISR/SWR 路由规则
        // 参考：docs/design/governance/vercel-cache-bot-governance.md §4.2
        routeRules: {
            // 首页：SWR 缓存 1h，高频访问但内容更新不频繁
            '/': { swr: 3600 },
            // 文章详情：ISR 10min，新发布文章最多延迟 10min 被索引
            '/posts/:id': { isr: 600 },
            // 标签/分类详情：SWR 30min，非核心排名页
            '/tags/:slug': { swr: 1800 },
            '/categories/:slug': { swr: 1800 },
            // 静态资源：长期缓存
            '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
            // robots + sitemap：长期缓存
            '/robots.txt': { swr: 86400 },
            '/sitemap_index.xml': { swr: 3600 },
        },
        // Upstash Redis 持久化存储：跨 serverless 实例共享 ISR/SWR 缓存
        // Vercel KV 基于 Upstash Redis，环境变量可复用：KV_REST_API_URL, KV_REST_API_TOKEN
        // 本地开发环境或未配置时自动降级为内存存储
        storage: {
            cache: {
                driver: process.env.KV_REST_API_URL ? 'upstash' : 'memory',
            },
        },
        // 禁用 unenv 对 debug 的默认适配
        unenv: {
            external: ['debug'],
        },
        externals: {
            // Windows 性能优化: 缩小 inline 列表，仅保留运行时必需的服务端包
            // PrimeVue 等前端包已在 Vite 客户端构建中处理，不需在 Nitro 服务端重复打包
            inline: [
                // TypeORM 通过动态 require 加载 postgres 驱动，Vercel trace 可能漏收录 pg。
                // 显式 inline 后可确保部署产物始终包含 Postgres runtime 依赖。
                'pg',
                'mjml',
                'mjml-core',
                'html-minifier',
                'html-minifier-terser',
                'cheerio',
                'htmlparser2',
                'entities',
                'domhandler',
                'domelementtype',
                'domutils',
                'lodash',
                'lodash-es',
                'dayjs',
            ],
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
