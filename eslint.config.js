import cmyrConfig from 'eslint-config-cmyr/nuxt'
import { globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
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
    ]),
    {
        plugins: {
            vue: pluginVue,
            // '@typescript-eslint': tseslint,
            // tseslint,
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
