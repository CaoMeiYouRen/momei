import cmyrConfig from 'eslint-config-cmyr'

export default [
    ...cmyrConfig,
    {
        ignores: [
            'node_modules',
            'dist',
            'coverage',
            '**/*.d.ts',
        ],
    },
    {
        rules: {
            // CLI 工具允许使用 console
            'no-console': 'off',
            // 允许 process.exit
            'n/no-process-exit': 'off',
            'unicorn/no-process-exit': 'off',
            // 允许 any 类型（在 error 处理中常用）
            '@typescript-eslint/no-explicit-any': 'off',
            // 文件行数限制
            'max-lines': ['warn', { max: 200 }],
            // 函数行数限制
            'max-lines-per-function': ['warn', { max: 100 }],
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-lines-per-function': 'off',
        },
    },
]
