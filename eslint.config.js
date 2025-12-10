// eslint.config.js
import cmyrConfig from 'eslint-config-cmyr/nuxt'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(cmyrConfig, {
    rules: {
        // '@typescript-eslint/no-unused-vars': 1,
    },
})
