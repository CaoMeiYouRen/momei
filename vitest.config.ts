import { resolve } from 'node:path'
import os from 'os'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = resolve(__dirname, './')

export default defineVitestConfig({
    test: {
        globals: true,
        environment: 'nuxt',
        fileParallelism: false,
        setupFiles: ['./tests/testSetup.ts'],
        include: ['./**/*.spec.ts', './**/*.test.ts'],
        // include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**', '**/tests/e2e/**'],
        testTimeout: 60000,
        hookTimeout: 60000,
        teardownTimeout: 60000,
        vmMemoryLimit: '4GB', // 内存限制
        pool: 'forks', // 使用 fork 模式运行测试
        maxWorkers: os.cpus().length, // 最大工作线程数，根据 CPU 核心数调整
        maxConcurrency: os.cpus().length, // 最大并发数，根据 CPU 核心数调整
    },
    resolve: {
        alias: {
            '@': rootDir,
            'bun:test': resolve(__dirname, './tests/mocks/bun-test.ts'),
        },
    },
    root: rootDir,
})
