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
            // 阈值按实测基线设置（Statements 54.54 / Branches 50 / Functions 56.52 / Lines 54.54）
            thresholds: {
                lines: 50,
                functions: 50,
                statements: 50,
                branches: 40,
            },
        },
    },
})
