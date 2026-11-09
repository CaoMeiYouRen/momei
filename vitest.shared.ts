import { resolve } from 'node:path'
import os from 'os'

const rootDir = resolve(__dirname, './')
const isCoverageRun = process.argv.includes('--coverage')
const availableCpuCount = os.cpus().length
// 统一使用 forks 池：threads 池下 @nuxt/test-utils 在多文件并发初始化时
// 存在 worker thread CWD 竞态，导致 pnpm 在 D:\tmp 目录执行并报
// ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND。forks 池无此问题。
const testPool = 'forks'
// 本地 8 核 + 默认并发会让 `virtual:intlify-i18n` 在部分 worker 中解析失败
// （表现为 25 个套件 0-test 收集失败，CI 单/低核环境不复现）；普通测试上限收敛到 4，
// 与稳定的覆盖率并发（ceil(cpus/2)）一致。CI runner 通常 ≤4 核，实际并发不变。
const maxWorkerCount = isCoverageRun
    ? Math.ceil(availableCpuCount / 2)
    : Math.min(availableCpuCount, 4)
const coverageExecArgv = isCoverageRun
    ? ['--max-old-space-size=6144']
    : undefined

const i18nRuntimeTestFiles = [
    'i18n/config/locale-modules.test.ts',
    'i18n/config/locale-runtime-loader.test.ts',
    'components/app-header.test.ts',
    'components/app-footer.test.ts',
    'components/commercial-link-manager.test.ts',
    'pages/forgot-password.test.ts',
    'pages/login.test.ts',
    'pages/reset-password.test.ts',
    'pages/about.test.ts',
    'pages/archives/index.test.ts',
    'pages/friend-links.test.ts',
    'pages/categories/index.test.ts',
    'pages/tags/index.test.ts',
    'tests/pages/taxonomy-rss-discovery.test.ts',
    'pages/admin/friend-links/index.test.ts',
    'pages/index-i18n.test.ts',
    'pages/posts/[id]-i18n.test.ts',
]

const baseVitestOptions = {
    // 覆盖率与普通测试使用独立缓存：覆盖率运行会写入带 `virtual:intlify-i18n-0`
    // 引用的预构建产物，普通运行复用后会报 `Cannot find module`（25 个套件 0-test）；
    // 分开缓存即可消除该跨模式污染（本地与 CI 同口径）。
    cacheDir: isCoverageRun ? 'node_modules/.vitest-cache-coverage' : 'node_modules/.vitest-cache',
    test: {
        globals: true,
        environment: 'nuxt',
        execArgv: coverageExecArgv,
        setupFiles: ['./tests/testSetup.ts'],
        include: ['./**/*.spec.ts', './**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**', '**/tests/e2e/**', '**/tests/visual/**'],
        testTimeout: 60000,
        hookTimeout: 60000,
        teardownTimeout: 60000,
        // 统一使用 forks（child process）池：threads 池下 @nuxt/test-utils 在多文件并发初始化时存在
        // worker thread CWD 竞态，导致 pnpm 在错误目录执行。forks 池无此问题。
        pool: testPool,
        maxWorkers: maxWorkerCount,
        // 覆盖率阈值以 CI Coverage job（pnpm run test:coverage）实测基线为准：
        // Statements 79.53 / Branches 67.94 / Functions 78.23 / Lines 79.54（2026-07-31），
        // 设置留出安全余量，防止正常波动误伤门禁。
        coverage: {
            // as const 保留字面量类型，避免被推断为 string 导致
            // defineVitestConfig 的 coverage.provider 类型不兼容（typecheck 报错）
            provider: 'v8' as const,
            thresholds: {
                lines: 75,
                functions: 75,
                statements: 75,
                branches: 60,
            },
        },
    },
    resolve: {
        alias: {
            '@': rootDir,
            '@momei-blog/api-client': resolve(__dirname, './packages/api-client/src/index.ts'),
            'momei-mcp-server': resolve(__dirname, './packages/mcp-server/src/index.ts'),
            'bun:test': resolve(__dirname, './tests/mocks/bun-test.ts'),
        },
    },
    root: rootDir,
}

export { baseVitestOptions, i18nRuntimeTestFiles }
