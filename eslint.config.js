// eslint.config.js
import cmyrConfig from 'eslint-config-cmyr/nuxt'
import { globalIgnores } from 'eslint/config'
import withNuxt from './.nuxt/eslint.config.mjs'
export default withNuxt(
    cmyrConfig,
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
    ]),
    {
        rules: {
        // '@typescript-eslint/no-unused-vars': 1,
        },
    },
)
