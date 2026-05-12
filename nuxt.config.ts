import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { APP_DEFAULT_LOCALE, NUXT_I18N_LOCALES } from './i18n/config/locale-registry'

const IS_WINDOWS = process.platform === 'win32'
const IS_WINDOWS_LOCAL = IS_WINDOWS && !process.env.CI && !process.env.VITEST
const NITRO_SERVER_ONLY_INLINE_PACKAGES = [
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
    ...(!IS_WINDOWS_LOCAL ? ['lodash', 'dayjs'] : []),
]

const IS_WINDOWS_LOCAL_DEV = IS_WINDOWS_LOCAL && process.env.NODE_ENV !== 'production'
const ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV = !IS_WINDOWS_LOCAL_DEV
    || process.env.NUXT_ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV === 'true'
const ENABLE_NITRO_RESOLVE_PROBE = IS_WINDOWS_LOCAL_DEV
    && process.env.NUXT_ENABLE_NITRO_RESOLVE_PROBE === 'true'
const ENABLE_PWA = !process.env.VITEST
    && (!IS_WINDOWS || process.env.NUXT_ENABLE_PWA_ON_WINDOWS === 'true')
const ENABLE_NUXT_ESLINT_MODULE = !IS_WINDOWS
    || process.env.NUXT_ENABLE_ESLINT_MODULE_ON_WINDOWS === 'true'
const ENABLE_SENTRY_MODULE = !IS_WINDOWS_LOCAL_DEV
    || process.env.NUXT_ENABLE_SENTRY_ON_WINDOWS_DEV === 'true'
const ENABLE_SITEMAP_MODULE = !IS_WINDOWS_LOCAL_DEV
    || process.env.NUXT_ENABLE_SITEMAP_ON_WINDOWS_DEV === 'true'
const NODE_ESM_SUBPATH_ALIASES = {
    'dayjs/plugin/duration': 'dayjs/plugin/duration.js',
    'dayjs/plugin/relativeTime': 'dayjs/plugin/relativeTime.js',
    'dayjs/plugin/timezone': 'dayjs/plugin/timezone.js',
    'dayjs/plugin/utc': 'dayjs/plugin/utc.js',
    'lodash/fp': 'lodash/fp.js',
} as const
const VITE_OPTIMIZE_DEPS_INCLUDE = IS_WINDOWS_LOCAL_DEV
    ? []
    : [
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
    ]
const WINDOWS_LOCAL_DEV_NUXT_IGNORES = [
    '.agents/**',
    '.claude/**',
    '.cursor/**',
    '.dev/**',
    '.github/**',
    '.husky/**',
    '.lighthouseci/**',
    '.opencode/**',
    '.playwright-mcp/**',
    '.vscode/**',
    'artifacts/**',
    'coverage/**',
    'docs/**',
    'logs/**',
    'opc-doc/**',
    'packages/cli/**',
    'packages/mcp-server/**',
    'playwright-report/**',
    'scripts/**',
    'test-results/**',
    'tests/**',
    ...(ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV
        ? []
        : [
            'components/admin/**',
            'pages/admin/**',
        ]),
]
const WINDOWS_LOCAL_DEV_WATCH_IGNORES = [
    '**/.agents/**',
    '**/.claude/**',
    '**/.cursor/**',
    '**/.dev/**',
    '**/.github/**',
    '**/.husky/**',
    '**/.lighthouseci/**',
    '**/.opencode/**',
    '**/.playwright-mcp/**',
    '**/.vscode/**',
    '**/artifacts/**',
    '**/coverage/**',
    '**/docs/**',
    '**/logs/**',
    '**/opc-doc/**',
    '**/packages/cli/**',
    '**/packages/mcp-server/**',
    '**/playwright-report/**',
    '**/scripts/**',
    '**/test-results/**',
    '**/tests/**',
    ...(ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV
        ? []
        : [
            '**/components/admin/**',
            '**/pages/admin/**',
            '**/server/api/admin/**',
        ]),
]

function createNitroResolveProbe() {
    const outputPath = resolvePath(process.cwd(), 'artifacts', 'nitro-resolve-probe.json')
    const tempOutputPath = `${outputPath}.tmp`
    const repoRoot = normalizeProbePath(process.cwd())
    const resolveCounts = new Map<string, { count: number, importers: Set<string> }>()
    const importerBucketCounts = new Map<string, number>()
    const targetBucketCounts = new Map<string, number>()
    const bucketPairCounts = new Map<string, { count: number, importers: Set<string>, targets: Set<string>, sources: Set<string> }>()
    let flushTimer: NodeJS.Timeout | undefined
    let flushInProgress = false
    let flushRequested = false
    let didWarnWriteBusy = false
    let flushIdlePromise: Promise<void> | undefined
    let resolveFlushIdle: (() => void) | undefined

    function normalizeProbePath(value: string) {
        return value.replaceAll('\\', '/').replace(/\/+/g, '/')
    }

    function toRepoRelativeProbePath(value: string) {
        const normalized = normalizeProbePath(value)

        if (normalized.startsWith(`${repoRoot}/`)) {
            return normalized.slice(repoRoot.length + 1)
        }

        return normalized
    }

    function inferTargetPath(source: string, importer?: string) {
        if (source.startsWith('@/') || source.startsWith('~/')) {
            return normalizeProbePath(resolvePath(process.cwd(), source.slice(2)))
        }

        if ((source.startsWith('./') || source.startsWith('../')) && importer) {
            return normalizeProbePath(resolvePath(dirname(importer), source))
        }

        return normalizeProbePath(source)
    }

    function getPackageBucket(source: string) {
        if (source.startsWith('@')) {
            const [scope, name] = source.split('/')
            return name ? `pkg:${scope}/${name}` : `pkg:${scope}`
        }

        const [name] = source.split('/')
        return `pkg:${name}`
    }

    function classifyProbeBucket(value: string) {
        const repoRelative = toRepoRelativeProbePath(value)

        if (repoRelative.startsWith('node:')) {
            return 'node-builtin'
        }

        if (repoRelative.startsWith('server/api/admin/')) {
            return 'server/api/admin'
        }

        if (repoRelative.startsWith('server/api/ai/')) {
            return 'server/api/ai'
        }

        if (repoRelative.startsWith('server/api/')) {
            return 'server/api'
        }

        if (repoRelative.startsWith('server/services/ai/')) {
            return 'server/services/ai'
        }

        if (repoRelative.startsWith('server/services/')) {
            return 'server/services'
        }

        if (repoRelative === 'server/database' || repoRelative.startsWith('server/database/')) {
            return 'server/database'
        }

        if (repoRelative.startsWith('server/entities/')) {
            return 'server/entities'
        }

        if (repoRelative.startsWith('server/utils/')) {
            return 'server/utils'
        }

        if (repoRelative.startsWith('server/middleware/')) {
            return 'server/middleware'
        }

        if (repoRelative.startsWith('server/routes/')) {
            return 'server/routes'
        }

        if (repoRelative.startsWith('server/plugins/')) {
            return 'server/plugins'
        }

        if (repoRelative.startsWith('i18n/locales/')) {
            return 'i18n/locales'
        }

        if (repoRelative.startsWith('i18n/')) {
            return 'i18n'
        }

        if (repoRelative.startsWith('components/admin/')) {
            return 'components/admin'
        }

        if (repoRelative.startsWith('pages/admin/')) {
            return 'pages/admin'
        }

        if (repoRelative.startsWith('utils/shared/')) {
            return 'utils/shared'
        }

        if (repoRelative.includes('/nitropack/dist/presets/_nitro/runtime/')) {
            return 'nitro/preset-runtime'
        }

        if (repoRelative.includes('/nitropack/dist/runtime/')) {
            return 'nitro/runtime'
        }

        if (repoRelative.startsWith('node_modules/.pnpm/')) {
            return 'node_modules'
        }

        if (!repoRelative.includes('/') && !repoRelative.startsWith('.')) {
            return getPackageBucket(repoRelative)
        }

        return 'other'
    }

    function incrementCount(map: Map<string, number>, key: string) {
        map.set(key, (map.get(key) ?? 0) + 1)
    }

    function toSortedEntries<T>(map: Map<string, T>, compare: (left: [string, T], right: [string, T]) => number) {
        return [...map.entries()].sort(compare)
    }

    function isFocusBucket(bucket: string) {
        return [
            'server/api',
            'server/services',
            'server/database',
            'server/entities',
            'server/utils',
            'server/middleware',
            'server/routes',
            'i18n/locales',
            'components/admin',
            'pages/admin',
        ].some((prefix) => bucket === prefix || bucket.startsWith(`${prefix}/`))
    }

    function isRetryableProbeWriteError(error: unknown) {
        return error instanceof Error
            && ('code' in error)
            && (error.code === 'EBUSY' || error.code === 'EPERM')
    }

    function getFlushIdlePromise() {
        if (!flushIdlePromise) {
            flushIdlePromise = new Promise<void>((resolve) => {
                resolveFlushIdle = resolve
            })
        }

        return flushIdlePromise
    }

    function settleFlushIdlePromise() {
        if (flushInProgress || flushRequested || flushTimer) {
            return
        }

        resolveFlushIdle?.()
        flushIdlePromise = undefined
        resolveFlushIdle = undefined
    }

    async function flushSummary() {
        flushRequested = true
        if (flushInProgress) {
            await getFlushIdlePromise()
            return
        }

        flushInProgress = true
        void getFlushIdlePromise()

        try {
            while (flushRequested) {
                flushRequested = false

                const summary = {
                    generatedAt: new Date().toISOString(),
                    outputPath,
                    topSpecifiers: [...resolveCounts.entries()]
                        .sort((left, right) => right[1].count - left[1].count)
                        .slice(0, 200)
                        .map(([source, entry]) => ({
                            source,
                            count: entry.count,
                            importers: [...entry.importers].slice(0, 20),
                        })),
                    topImporterBuckets: toSortedEntries(importerBucketCounts, (left, right) => right[1] - left[1])
                        .slice(0, 50)
                        .map(([bucket, count]) => ({ bucket, count })),
                    topTargetBuckets: toSortedEntries(targetBucketCounts, (left, right) => right[1] - left[1])
                        .slice(0, 50)
                        .map(([bucket, count]) => ({ bucket, count })),
                    topBucketPairs: toSortedEntries(bucketPairCounts, (left, right) => right[1].count - left[1].count)
                        .slice(0, 80)
                        .map(([pair, entry]) => ({
                            pair,
                            count: entry.count,
                            importers: [...entry.importers].slice(0, 12),
                            targets: [...entry.targets].slice(0, 12),
                            sources: [...entry.sources].slice(0, 12),
                        })),
                    focusBucketPairs: toSortedEntries(bucketPairCounts, (left, right) => right[1].count - left[1].count)
                        .filter(([pair]) => {
                            const [importerBucket = 'unknown', targetBucket = 'unknown'] = pair.split(' -> ')
                            return isFocusBucket(importerBucket) || isFocusBucket(targetBucket)
                        })
                        .slice(0, 80)
                        .map(([pair, entry]) => ({
                            pair,
                            count: entry.count,
                            importers: [...entry.importers].slice(0, 12),
                            targets: [...entry.targets].slice(0, 12),
                            sources: [...entry.sources].slice(0, 12),
                        })),
                }

                await mkdir(dirname(outputPath), { recursive: true })
                try {
                    await writeFile(tempOutputPath, JSON.stringify(summary, null, 2), 'utf8')
                    await rename(tempOutputPath, outputPath)
                    didWarnWriteBusy = false
                } catch (error) {
                    if (!isRetryableProbeWriteError(error)) {
                        throw error
                    }

                    flushRequested = true
                    if (!didWarnWriteBusy) {
                        didWarnWriteBusy = true
                        console.warn('[momei-perf] scope=nitro-resolve-probe stage=flush-busy action=retry')
                    }
                    break
                }
            }
        } finally {
            flushInProgress = false
            if (flushRequested && !flushTimer) {
                scheduleFlush()
            } else {
                settleFlushIdlePromise()
            }
        }
    }

    function scheduleFlush() {
        if (flushTimer) {
            return
        }

        flushTimer = setTimeout(() => {
            flushTimer = undefined
            void flushSummary().catch((error) => {
                console.error('[momei-perf] scope=nitro-resolve-probe stage=flush-failed', error)
            })
        }, 1000)
        flushTimer.unref?.()
    }

    return {
        name: 'momei-nitro-resolve-probe',
        resolveId(source: string, importer?: string) {
            const importerBucket = classifyProbeBucket(importer ? normalizeProbePath(importer) : 'unknown')
            const targetPath = inferTargetPath(source, importer)
            const targetBucket = classifyProbeBucket(targetPath)
            const entry = resolveCounts.get(source)
            if (entry) {
                entry.count += 1
                if (importer) {
                    entry.importers.add(importer)
                }
            } else {
                resolveCounts.set(source, {
                    count: 1,
                    importers: new Set(importer ? [importer] : []),
                })
            }

            incrementCount(importerBucketCounts, importerBucket)
            incrementCount(targetBucketCounts, targetBucket)

            const pairKey = `${importerBucket} -> ${targetBucket}`
            const pairEntry = bucketPairCounts.get(pairKey)
            if (pairEntry) {
                pairEntry.count += 1
                if (importer) {
                    pairEntry.importers.add(importer)
                }
                pairEntry.targets.add(targetPath)
                pairEntry.sources.add(source)
            } else {
                bucketPairCounts.set(pairKey, {
                    count: 1,
                    importers: new Set(importer ? [importer] : []),
                    targets: new Set([targetPath]),
                    sources: new Set([source]),
                })
            }

            scheduleFlush()
            return null
        },
        async buildEnd() {
            if (flushTimer) {
                clearTimeout(flushTimer)
                flushTimer = undefined
            }
            await flushSummary()
        },
    }
}

function createNitroPerfHooks() {
    let buildStartedAt = 0
    let rollupStartedAt = 0

    return {
        'build:before'() {
            buildStartedAt = Date.now()
            console.info('[momei-perf] scope=nitro-dev-build stage=build-before durationMs=0')
        },
        'rollup:before'(_nitro: unknown, rollupConfig: { plugins?: { name?: string }[] }) {
            rollupStartedAt = Date.now()
            console.info(`[momei-perf] scope=nitro-dev-build stage=rollup-before durationMs=${buildStartedAt ? Date.now() - buildStartedAt : 0}`)
            rollupConfig.plugins ||= []
            if (!rollupConfig.plugins.some((plugin) => plugin.name === 'momei-nitro-resolve-probe')) {
                rollupConfig.plugins.push(createNitroResolveProbe())
            }
        },
        compiled() {
            console.info(`[momei-perf] scope=nitro-dev-build stage=compiled durationMs=${buildStartedAt ? Date.now() - buildStartedAt : 0}`)
            if (rollupStartedAt) {
                console.info(`[momei-perf] scope=nitro-dev-build stage=rollup-compiled durationMs=${Date.now() - rollupStartedAt}`)
            }
        },
    }
}

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
    ...(IS_WINDOWS_LOCAL_DEV
        ? {
            ignore: WINDOWS_LOCAL_DEV_NUXT_IGNORES,
            watcher: 'parcel',
        }
        : {}),
    // Node.js 24 的 ESM 解析不接受 `lodash/fp` 目录导入，显式固定到文件入口。
    alias: NODE_ESM_SUBPATH_ALIASES,
    modules: [
        ENABLE_NUXT_ESLINT_MODULE && '@nuxt/eslint',
        process.env.VITEST && '@nuxt/test-utils/module',
        '@primevue/nuxt-module',
        '@nuxtjs/i18n',
        '@vueuse/nuxt',
        ENABLE_SENTRY_MODULE && '@sentry/nuxt/module',
        ENABLE_SITEMAP_MODULE && '@nuxtjs/sitemap',
        ENABLE_PWA && '@vite-pwa/nuxt',
    ].filter(Boolean) as any,
    ...(ENABLE_PWA
        ? {
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
                    // SSR 站点部署后不会长期保留旧 hash 资源，禁止导航兜底继续回放过期 app shell。
                    navigateFallbackDenylist: [/^\/.*$/],
                    globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
                },
                devOptions: {
                    enabled: false,
                },
            },
        }
        : {}),
    runtimeConfig: {
        authCaptchaSecretKey: process.env.AUTH_CAPTCHA_SECRET_KEY,
        // 定时任务安全配置
        cronSecret: process.env.CRON_SECRET,
        tasksToken: process.env.TASKS_TOKEN,
        webhookSecret: process.env.WEBHOOK_SECRET || process.env.TASKS_TOKEN,
        public: {
            NODE_ENV: process.env.NODE_ENV,
            windowsLocalDevMode: IS_WINDOWS_LOCAL_DEV,
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
    sourcemap: {
        server: !IS_WINDOWS_LOCAL,
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
    typescript: {
        includeWorkspace: !IS_WINDOWS_LOCAL_DEV,
    },
    css: [
        '@/styles/vendor.css',
        '@/styles/iconfont/iconfont.css',
        '@/styles/main.scss',
    ],
    ...(ENABLE_NUXT_ESLINT_MODULE
        ? {
            eslint: {
                config: {
                    standalone: false,
                },
            },
        }
        : {}),
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
            include: VITE_OPTIMIZE_DEPS_INCLUDE,
            noDiscovery: IS_WINDOWS_LOCAL_DEV,
        },
        server: {
            watch: {
                ignored: IS_WINDOWS_LOCAL_DEV ? WINDOWS_LOCAL_DEV_WATCH_IGNORES : undefined,
            },
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
            },
        },
    },
    nitro: {
        alias: NODE_ESM_SUBPATH_ALIASES,
        ...(ENABLE_NITRO_RESOLVE_PROBE
            ? {
                hooks: createNitroPerfHooks(),
            }
            : {}),
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
            ...(IS_WINDOWS_LOCAL_DEV && !ENABLE_ADMIN_SURFACES_ON_WINDOWS_DEV
                ? ['server/api/admin/**']
                : []),
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
            // Nitro 在 Windows 上做 external tracing 的成本很高，
            // 本地 dev/build 更适合直接依赖工作区 node_modules，而不是长时间追踪依赖树。
            trace: !IS_WINDOWS,
            // 仅内联服务端邮件渲染链，避免把 PrimeVue 等大体积前端依赖强行打进 Nitro 包，
            // 否则在 Windows 上会显著放大 Nitro dev/build 的依赖解析与打包成本。
            inline: NITRO_SERVER_ONLY_INLINE_PACKAGES,
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
