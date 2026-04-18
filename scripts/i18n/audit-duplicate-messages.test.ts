import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterAll, describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const ROOT_DIR = resolve(import.meta.dirname, '..', '..')
const SCRIPT_PATH = resolve(ROOT_DIR, 'scripts', 'i18n', 'audit-duplicate-messages.mjs')

const tempDirectories = new Set<string>()

async function runDuplicateAudit(args: readonly string[]) {
    const result = await execFileAsync(process.execPath, [SCRIPT_PATH, ...args], {
        cwd: ROOT_DIR,
    })

    return {
        stderr: result.stderr.trim(),
        stdout: result.stdout.trim(),
    }
}

afterAll(async () => {
    await Promise.all([...tempDirectories].map(async (dirPath) => {
        await rm(dirPath, { force: true, recursive: true })
    }))
})

describe('audit-duplicate-messages script', () => {
    it('preserves limit=0 in json output', async () => {
        const { stdout } = await runDuplicateAudit(['--format=json', '--cross-module-only', '--limit=0'])
        const report = JSON.parse(stdout)

        expect(report.filters.limit).toBe(0)
        expect(report.summary.shownGroupCount).toBe(report.summary.crossModuleGroupCount)
    })

    it('writes utf-8 report files directly when output is provided', async () => {
        const tempDir = await mkdtemp(join(tmpdir(), 'momei-i18n-audit-'))
        tempDirectories.add(tempDir)

        const outputPath = join(tempDir, 'duplicate-messages.json')
        const { stdout } = await runDuplicateAudit(['--format=json', '--cross-module-only', `--output=${outputPath}`])
        const fileContent = await readFile(outputPath, 'utf8')
        const report = JSON.parse(fileContent)

        expect(stdout).toContain('Wrote duplicate message audit to')
        expect(report.summary.crossModuleGroupCount).toBeGreaterThan(0)
        expect(report.groups.length).toBe(report.summary.shownGroupCount)
    })
})
