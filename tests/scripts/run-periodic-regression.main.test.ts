import { access, rm } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { runPeriodicRegression } from '@/scripts/regression/run-periodic-regression.mjs'

describe('run-periodic-regression main flow', () => {
    it('runs weekly profile in dry-run mode and writes artifact files', async () => {
        const result = await runPeriodicRegression({
            dryRun: true,
            mode: 'warn',
            profile: 'weekly',
        })

        expect(result.summary.conclusion).toBe('Prepared')
        expect(result.results.every((item) => item.skipped)).toBe(true)
        await expect(access(result.artifacts.artifactMarkdownPath)).resolves.toBeUndefined()
        await expect(access(result.artifacts.artifactJsonPath)).resolves.toBeUndefined()

        await rm(result.artifacts.artifactMarkdownPath, { force: true })
        await rm(result.artifacts.artifactJsonPath, { force: true })
    })
})
