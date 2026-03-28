import cmyrConfig from 'eslint-config-cmyr/nuxt'
import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import withNuxt from './.nuxt/eslint.config.mjs'

const enableI18nLint = process.env.ESLINT_I18N === 'true'

function promoteRuleLevel(ruleConfig) {
    if (Array.isArray(ruleConfig)) {
        return ['error', ...ruleConfig.slice(1)]
    }

    return 'error'
}

function promoteVueI18nRuleLevels(config) {
    if (!enableI18nLint || !config.rules) {
        return config
    }

    return {
        ...config,
        rules: Object.fromEntries(
            Object.entries(config.rules).map(([ruleName, ruleConfig]) => {
                if (!ruleName.startsWith('@intlify/vue-i18n/')) {
                    return [ruleName, ruleConfig]
                }

                return [ruleName, promoteRuleLevel(ruleConfig)]
            }),
        ),
    }
}

const i18nLintConfigs = enableI18nLint
    ? [
        ...vueI18n.configs.recommended.map(promoteVueI18nRuleLevels),
        {
            rules: {
                '@intlify/vue-i18n/no-raw-text': 'off',
                '@intlify/vue-i18n/no-dynamic-keys': 'off',
                '@intlify/vue-i18n/no-unused-keys': [
                    'error',
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
        {
            files: ['i18n/locales/*.json', 'i18n/locales/**/*.json'],
            rules: {
                '@intlify/vue-i18n/no-unused-keys': 'off',
                '@intlify/vue-i18n/no-html-messages': 'off', // 允许在 JSON 文件中使用 HTML 标签
            },
        },
    ]
    : []

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
        'pnpm-lock.yaml',
    ]),
    {
        plugins: {
            vue: pluginVue,
        },
    },
    ...i18nLintConfigs,
    cmyrConfig,
    {
        rules: {
            'max-lines': [1, { max: 800 }], // 强制文件的最大行数
            'max-lines-per-function': [1, { max: 500 }], // 强制函数最大行数
        },
    },
    {
        files: ['**/**/*.test.*', '**/**/*.spec.*'],
        rules: {
            'max-lines-per-function': [1, { max: 700 }], // 测试文件的函数行数限制放宽一些
        },
    },
)
