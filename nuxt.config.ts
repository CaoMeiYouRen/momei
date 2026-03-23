import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { APP_DEFAULT_LOCALE, NUXT_I18N_LOCALES } from './i18n/config/locale-registry'
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
    ].filter(Boolean) as any,
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
            navigateFallback: '/',
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
        components: {
            include: '*',
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
        '@/styles/vendor.css',
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
                'primevue/dynamicdialog',
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
            rollupOptions: {
                external: ['quill'],
                output: {
                    chunkFileNames: '[name].[hash].js',
                    manualChunks(id) {
                        if (!id.includes('node_modules')) {
                            return undefined
                        }

                        if (id.includes('better-auth')) {
                            return 'vendor-auth'
                        }

                        if (id.includes('primevue/') || id.includes('@primevue/') || id.includes('@primeuix/') || id.includes('primeicons') || id.includes('primelocale')) {
                            if (
                                id.includes('/datatable')
                                || id.includes('/column')
                                || id.includes('/treetable')
                                || id.includes('/paginator')
                                || id.includes('/virtualscroller')
                            ) {
                                return 'vendor-primevue-data'
                            }

                            if (
                                id.includes('/dialog')
                                || id.includes('/drawer')
                                || id.includes('/dynamicdialog')
                                || id.includes('/popover')
                                || id.includes('/menu')
                                || id.includes('/confirmdialog')
                                || id.includes('/toast')
                                || id.includes('/tooltip')
                                || id.includes('/overlay')
                            ) {
                                return 'vendor-primevue-overlay'
                            }

                            if (
                                id.includes('/inputtext')
                                || id.includes('/password')
                                || id.includes('/select')
                                || id.includes('/autocomplete')
                                || id.includes('/datepicker')
                                || id.includes('/textarea')
                                || id.includes('/checkbox')
                                || id.includes('/radiobutton')
                                || id.includes('/toggleswitch')
                                || id.includes('/multiselect')
                            ) {
                                return 'vendor-primevue-form'
                            }

                            return 'vendor-primevue-core'
                        }

                        if (id.includes('katex')) {
                            return 'vendor-katex'
                        }

                        if (id.includes('highlight.js')) {
                            return 'vendor-highlightjs'
                        }

                        if (
                            id.includes('markdown-it')
                            || id.includes('markdown-it-anchor')
                            || id.includes('markdown-it-container')
                            || id.includes('markdown-it-emoji')
                            || id.includes('markdown-it-github-alerts')
                        ) {
                            return 'vendor-markdown'
                        }

                        if (id.includes('markdown-it-texmath')) {
                            return 'vendor-markdown-math'
                        }

                        if (id.includes('mavon-editor')) {
                            return 'vendor-mavon-editor'
                        }

                        return undefined
                    },
                },
            },
        },
    },
    nitro: {
        experimental: {
            websocket: true,
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
        // 禁用 unenv 对 debug 的默认适配
        unenv: {
            external: ['debug'],
        },
        externals: {
            inline: ['mjml', 'mjml-core', 'html-minifier', 'html-minifier-terser', 'lodash', 'lodash-es'],
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
