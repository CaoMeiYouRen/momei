import { resolve } from 'node:path'
import os from 'os'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = resolve(__dirname, './')
const isCoverageRun = process.argv.includes('--coverage')
const availableCpuCount = os.cpus().length
const testPool = isCoverageRun ? 'forks' : 'threads'
const maxWorkerCount = isCoverageRun
    ? 1
    : availableCpuCount
const coverageExecArgv = isCoverageRun
    ? ['--max-old-space-size=6144']
    : undefined

export default defineVitestConfig({
    test: {
        globals: true,
        environment: 'nuxt',
        // fileParallelism: false, // 禁止文件级别的并行执行，确保测试在单线程中运行
        execArgv: coverageExecArgv,
        setupFiles: ['./tests/testSetup.ts'],
        include: ['./**/*.spec.ts', './**/*.test.ts'],
        // include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**', '**/tests/e2e/**'],
        testTimeout: 60000,
        hookTimeout: 60000,
        teardownTimeout: 60000,
        // vmMemoryLimit: '512MB',
        // Coverage 模式优先用 child process 和更低并发换稳定性，避免 Nuxt worker threads 在全仓运行时 OOM。
        pool: testPool,
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
