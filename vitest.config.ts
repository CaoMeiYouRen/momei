import { resolve } from 'node:path'
import os from 'os'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = resolve(__dirname, './')
const isCoverageRun = process.argv.includes('--coverage')
const availableCpuCount = os.cpus().length
const maxWorkerCount = isCoverageRun
    ? Math.min(availableCpuCount, 4)
    : availableCpuCount

export default defineVitestConfig({
    test: {
        globals: true,
        environment: 'nuxt',
        // fileParallelism: false, // 禁止文件级别的并行执行，确保测试在单线程中运行
        setupFiles: ['./tests/testSetup.ts'],
        include: ['./**/*.spec.ts', './**/*.test.ts'],
        // include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**', '**/tests/e2e/**'],
        testTimeout: 60000,
        hookTimeout: 60000,
        teardownTimeout: 60000,
        // vmMemoryLimit: '512MB',
        pool: 'threads',
        // Coverage 模式会让 Nuxt 测试 worker 的常驻内存显著上升，限制并发避免 OOM。
        maxWorkers: maxWorkerCount,
        // maxConcurrency: os.cpus().length, // 最大并发数，根据 CPU 核心数调整
    },
    resolve: {
        alias: {
            '@': rootDir,
            'bun:test': resolve(__dirname, './tests/mocks/bun-test.ts'),
        },
    },
    root: rootDir,
})
