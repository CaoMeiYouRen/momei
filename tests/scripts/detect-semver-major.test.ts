import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { classifySemverBump, parseSemverBump } from '../../scripts/ci/detect-semver-major.mjs'

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const scriptPath = path.join(repoRoot, 'scripts/ci/detect-semver-major.mjs')

describe('detect-semver-major', () => {
    it('classifies patch, minor and major Dependabot titles', () => {
        expect(classifySemverBump('Bump lodash from 4.17.20 to 4.17.21')).toBe('patch')
        expect(classifySemverBump('Bump nuxt from 4.5.2 to 4.6.0')).toBe('minor')
        expect(classifySemverBump('Bump vue from 3.4.0 to 4.0.0')).toBe('major')
    })

    it('handles scoped package names and surrounding text', () => {
        expect(classifySemverBump('build(deps): bump @scope/pkg from 1.2.3 to 2.0.0')).toBe('major')
        expect(parseSemverBump('Bump @scope/pkg from 1.2.3 to 2.0.0')).toEqual({
            from: '1.2.3',
            to: '2.0.0',
            bump: 'major',
        })
    })

    it('treats prerelease suffixes as part of the version without changing the core comparison', () => {
        expect(classifySemverBump('Bump beta-package from 1.2.3 to 2.0.0-beta.1')).toBe('major')
        expect(classifySemverBump('Bump beta-package from 2.0.0-beta.1 to 2.0.0')).toBe('none')
        expect(classifySemverBump('Bump beta-package from 1.0.0-alpha.1 to 1.0.1')).toBe('patch')
    })

    it('treats identical versions and build metadata only as no upgrade', () => {
        expect(classifySemverBump('Bump same from 2.0.0 to 2.0.0')).toBe('none')
        expect(classifySemverBump('Bump build from 1.2.3 to 1.2.3+build.1')).toBe('none')
    })

    it('treats major downgrades as major changes', () => {
        expect(classifySemverBump('Bump legacy-package from 3.0.0 to 2.9.9')).toBe('major')
    })

    it('returns none for grouped updates, non-dependabot titles and version ranges', () => {
        expect(classifySemverBump('Bump the nuxt-runtime group with 4 updates')).toBe('none')
        expect(classifySemverBump('chore: refresh lockfile')).toBe('none')
        expect(classifySemverBump('Update foo requirement from ^1.0.0 to ^2.0.0')).toBe('none')
        expect(classifySemverBump('')).toBe('none')
        expect(parseSemverBump('')).toBeNull()
        expect(parseSemverBump(undefined as unknown as string)).toBeNull()
    })

    it('handles two-segment versions from GitHub Actions and Docker ecosystems', () => {
        expect(classifySemverBump('Bump actions/checkout from 4 to 5')).toBe('major')
        expect(classifySemverBump('Bump node from 20 to 22')).toBe('major')
        expect(classifySemverBump('Bump alpine from 3.19 to 3.20')).toBe('minor')
    })

    it('classifies 0.x minor bumps as minor and keeps the first version pair', () => {
        expect(classifySemverBump('Bump early-stage from 0.9.0 to 0.10.0')).toBe('minor')
        expect(classifySemverBump('Bump pair from 1.0.0 to 1.1.0 and also 2.0.0 to 3.0.0')).toBe('minor')
    })

    it('accepts v-prefixed versions and case-insensitive keywords', () => {
        expect(classifySemverBump('Bump tool From v1.4.0 To v1.5.0')).toBe('minor')
        expect(classifySemverBump('Bump tool from v1.4.0 to v2.0.0')).toBe('major')
    })

    it('prints the bump type from the PR_TITLE environment variable', async () => {
        const { stdout } = await execFileAsync(process.execPath, [scriptPath], {
            cwd: repoRoot,
            env: { ...process.env, PR_TITLE: 'Bump vue from 3.4.0 to 4.0.0' },
        })
        expect(stdout.trim()).toBe('major')
    })

    it('rejects unsupported CLI arguments', async () => {
        await expect(execFileAsync(process.execPath, [scriptPath, '--unknown=1'], { cwd: repoRoot })).rejects.toThrow()
    })

    it('prints the bump type from the --title argument', async () => {
        const { stdout } = await execFileAsync(process.execPath, [scriptPath, '--title=Bump lodash from 4.17.20 to 4.17.21'], {
            cwd: repoRoot,
        })
        expect(stdout.trim()).toBe('patch')
    })
})
