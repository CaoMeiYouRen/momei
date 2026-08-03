import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
    resolve: {
        alias: {
            '@momei-blog/api-client': resolve(__dirname, '../api-client/src/index.ts'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['dist/**', '**/*.test.ts', '**/*.spec.ts'],
            // 阈值按实测基线设置（Statements 66.74 / Branches 68.53 / Functions 69.93 / Lines 66.54）
            thresholds: {
                lines: 60,
                functions: 65,
                statements: 60,
                branches: 60,
            },
        },
    },
})
