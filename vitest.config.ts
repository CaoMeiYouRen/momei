import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const rootDir = resolve(__dirname, './')

export default defineConfig({
    test: {
        globals: true,
        environment: 'nuxt',
        // include: ['./**/*.spec.ts', './**/*.test.ts'],
        // include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**'],
    },
    resolve: {
        alias: {
            '@': rootDir,
            'bun:test': resolve(__dirname, './tests/mocks/bun-test.ts'),
        },
    },
    root: rootDir,
})
