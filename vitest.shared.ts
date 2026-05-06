import { resolve } from 'node:path'
import os from 'os'

const rootDir = resolve(__dirname, './')
const isCoverageRun = process.argv.includes('--coverage')
const availableCpuCount = os.cpus().length
const testPool = isCoverageRun ? 'forks' : 'threads'
const maxWorkerCount = isCoverageRun
    ? Math.ceil(availableCpuCount / 2)
    : availableCpuCount
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
]

const baseVitestOptions = {
    test: {
        globals: true,
        environment: 'nuxt',
        execArgv: coverageExecArgv,
        setupFiles: ['./tests/testSetup.ts'],
        include: ['./**/*.spec.ts', './**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**', '**/tests/e2e/**'],
        testTimeout: 60000,
        hookTimeout: 60000,
        teardownTimeout: 60000,
        // Coverage 模式优先用 child process 和更低并发换稳定性，避免 Nuxt worker threads 在全仓运行时 OOM。
        pool: testPool,
        maxWorkers: maxWorkerCount,
    },
    resolve: {
        alias: {
            '@': rootDir,
            'bun:test': resolve(__dirname, './tests/mocks/bun-test.ts'),
        },
    },
    root: rootDir,
}

export { baseVitestOptions, i18nRuntimeTestFiles }
