import cmyrConfig from 'eslint-config-cmyr/nuxt'
import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
    globalIgnores([
        'node_modules',
        '.husky',
        '.git',
        '.nuxt',
        '.output',
        '.vercel',
        '.vitepress',
        'docs',
        'dist',
        'public',
        'static',
        'coverage',
        'logs',
        'jscpd-report',
        'packages',
        'playwright-report',
        'test-results',
    ]),
    {
        plugins: {
            vue: pluginVue,
            // '@typescript-eslint': tseslint,
            // tseslint,
        },
    },
    ...vueI18n.configs.recommended,
    {
        files: ['**/*.json'],
        rules: {
            '@intlify/vue-i18n/no-unused-keys': 'off',
        },
    },
    {
        rules: {
            '@intlify/vue-i18n/no-raw-text': 'off',
            '@intlify/vue-i18n/no-dynamic-keys': 'off',
            '@intlify/vue-i18n/no-unused-keys': [
                'warn',
                {
                    extensions: ['.js', '.ts', '.vue'],
                    // 由于某些翻译项是动态生成的，或者在代码中以动态方式访问，因此无法静态分析到它们的使用情况，所以需要忽略这些特定的路径模式。
                    ignores: [
                        '/^components\\.post\\.copyright\\.licenses\\./',
                        '/^components\\.post\\.sponsor\\.platforms\\./',
                        '/^pages\\.about\\.meaning\\.features\\[\\d+\\]$/',
                        '/^pages\\.about\\.features\\.items\\[\\d+\\]\\.(title|desc)$/',
                        '/^pages\\.admin\\.ai\\.types\\.(asr|image|text|suggest_slug|summarize|translate|recommend_tags)$/',
                        '/^pages\\.admin\\.settings\\.system\\.notifications\\.events\\./',
                        '/^pages\\.admin\\.snippets\\.source_types\\./',
                        '/^pages\\.archives\\.months\\./',
                        '/^pages\\.posts\\.locked\\./',
                        '/^pages\\.settings\\.commercial\\.social_platforms\\./',
                        '/^pages\\.login\\.(email_required|password_required)$/',
                        '/^pages\\.register\\.(name_required|email_required|password_required|confirm_password_required)$/',
                        '/^pages\\.settings\\.security\\.(current_password_required|new_password_required|confirm_password_required)$/',
                        '/^legal\\.agreement_required$/',
                        '/^error\\.(forbidden|validation|rateLimited|internal)$/',
                    ],
                },
            ],
        },
        settings: {
            'vue-i18n': {
                localeDir: [
                    './i18n/locales/*.json',
                    './i18n/locales/**/*.json',
                ],
                messageSyntaxVersion: '^10.0.0',
            },
        },
    },
    cmyrConfig,
    {
        rules: {
            'max-lines': [1, { max: 800 }], // 强制文件的最大行数
            'max-lines-per-function': [0, { max: 150 }], // 强制函数最大行数
        },
    },
    {
        files: ['i18n/locales/*.json', 'i18n/locales/**/*.json'],
        rules: {
            '@intlify/vue-i18n/no-unused-keys': 'off',
            'max-lines': 'off',
        },
    },
    {
        files: ['pnpm-lock.yaml'],
        rules: {
            'max-lines': 'off',
        },
    },
)
