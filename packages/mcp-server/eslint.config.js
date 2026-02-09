import cmyrConfig from 'eslint-config-cmyr'

export default [
    ...cmyrConfig,
    {
        ignores: [
            'node_modules',
            'dist',
            'coverage',
            '**/*.d.ts',
            '*.config.js',
            '*.config.ts',
        ],
    },
    {
        rules: {
            'no-console': 'off',
            'n/no-process-exit': 'off',
            'unicorn/no-process-exit': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]
