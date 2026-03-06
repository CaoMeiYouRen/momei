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
            '@intlify/vue-i18n/no-dynamic-keys': 'off',
            '@intlify/vue-i18n/no-unused-keys': [
                'warn',
                {
                    extensions: ['.js', '.ts', '.vue'],
                },
            ],
        },
        settings: {
            'vue-i18n': {
                localeDir: './i18n/locales/*.json',
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
)
