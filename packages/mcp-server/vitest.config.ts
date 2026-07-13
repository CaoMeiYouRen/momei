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
        },
    },
})
