import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['dist/**', '**/*.test.ts', '**/*.spec.ts'],
            // 阈值按实测基线设置（Statements 67.69 / Branches 80.76 / Functions 56.17 / Lines 77.08）
            thresholds: {
                lines: 70,
                functions: 50,
                statements: 60,
                branches: 75,
            },
        },
    },
})
