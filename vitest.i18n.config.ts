import { defineVitestConfig } from '@nuxt/test-utils/config'
import { baseVitestOptions, i18nRuntimeTestFiles } from './vitest.shared'

export default defineVitestConfig({
    ...baseVitestOptions,
    test: {
        ...baseVitestOptions.test,
        include: i18nRuntimeTestFiles,
    },
})
