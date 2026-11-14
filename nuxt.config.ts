import { APP_DEFAULT_LOCALE, NUXT_I18N_LOCALES } from './i18n/config/locale-registry'
import { repairRolldownClientInitImports } from './scripts/build/repair-rolldown-client-init-imports.mjs'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-12-01',
    devtools: { enabled: false },
    modules: [
        '@nuxt/eslint',
        process.env.VITEST && '@nuxt/test-utils/module',
        'caomei-ui/nuxt',
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
        /* 私有配置**不在这里读环境变量**：`nuxt.config` 只在构建期执行，而运行期注入只认
         * `NUXT_*` 前缀——非前缀的密钥（AUTH_CAPTCHA_SECRET_KEY / CRON_SECRET / TASKS_TOKEN /
         * WEBHOOK_SECRET）在构建机上通常不存在，会把空值烘焙进产物；若构建机恰好存在，则密钥会被
         * 固化进镜像。两类结果都不可接受。
         *
         * 约定：私有密钥一律在**服务端运行期**读取（`server/utils/captcha.ts`、
         * `server/api/tasks/run-scheduled.post.ts`）；这里的空串只声明 key，保留 `NUXT_` 运行期覆盖能力。
         * 回归守卫见 tests/modules/runtime-config-env-injection.test.ts。 */
        authCaptchaSecretKey: '',
        // 定时任务安全配置
        cronSecret: '',
        tasksToken: '',
        webhookSecret: '',
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
            // 公共设置
            windowsLocalDevMode:
                process.env.NUXT_PUBLIC_WINDOWS_LOCAL_DEV_MODE === 'true'
                || process.env.WINDOWS_LOCAL_DEV_MODE === 'true',
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
            /* 社交登录可用性不在此声明：它依赖仅服务端可见的 clientSecret，且必须在运行期判定。
             * 前端由 `plugins/social-providers.server.ts` 在请求期写入 `useState('auth-social-providers')`
             * （见 pages/login.vue / register.vue）；不要改为新增 API 路由（见 docs/standards/development.md §7.1）。 */
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
        // Sentry v11 移除了 v10 的 `sourceMapsUploadOptions`，改由 `sourcemaps.disable` 统一控制。
        // v10 的判定是三分支：显式 `sourcemaps.disable` 优先，其次才回退到
        // `sourceMapsUploadOptions.enabled ?? true`。本仓库从未设置 Sentry 模块的 `sourcemaps` 选项，故旧的
        // `enabled: false` 落在回退分支上，与 `disable: true` 结果一致：跳过 source map 的
        // 构建期生成、debug id 注入与自动上传。
        // 不取 `'disable-upload'`：那会重新开启 hidden sourcemap 生成与 debug id 注入，属行为变更。
        // 本项目为自部署实例，不向 Sentry 上传 source map，故保持关闭。
        sourcemaps: {
            disable: true,
        },
    },
    // darkMode 契约保持 `.dark`；token 语义桥接已在 `styles/main.scss` 落地
    // （unlayered `html:root`，取值方向 `--m-*` → `--caomei-*`）。
    caomeiUI: {
        prefix: 'Caomei',
        darkMode: 'class',
        injectStyles: true,
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
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "@/styles/_variables.scss" as *; @use "@/styles/_mixins.scss" as *;',
                },
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
            inline: [
                // TypeORM v1.1.0 通过 PlatformTools.load() 动态 require 加载 postgres 驱动，
                // Vercel trace 可能漏收录 pg。显式 inline 确保部署产物包含 Postgres runtime 依赖。
                // pg 内联时必须连带其依赖一起打包，避免 Rolldown CJS→ESM 转换后
                // pg-types 模块实例分裂导致 this._parsers[i] is not a function。
                // 见: https://github.com/brianc/node-postgres/issues （bundler 兼容性讨论）
                'pg',
                'pg-types',
                'pg-protocol',
                'pg-pool',
                'pg-connection-string',
                'pgpass',
                'pg-int8',
                'postgres-array',
                'postgres-bytea',
                'postgres-date',
                'postgres-interval',
                // postgres-interval@1.x 依赖于 xtend 并通过 require('xtend/mutable') 引用
                'xtend',
                // sanitize-html 内部 require('htmlparser2') 会加载 ESM-only 的 v12，
                // 需一起 inline 让 Rolldown 在构建时处理 CJS→ESM 转换
                'sanitize-html',
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
                // momei-mcp-server 是 workspace 包，生产部署时需 inline 确保可用
                'momei-mcp-server',
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
