import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './'),
            'bun:test': resolve(__dirname, './tests/mocks/bun-test.ts'),
        },
    },
    root: resolve('./'),
})
