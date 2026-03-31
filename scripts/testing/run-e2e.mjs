import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'

const repoRoot = process.cwd()
const outputEntry = path.join(repoRoot, '.output', 'server', 'index.mjs')
const ignoredEntries = new Set([
    '.git',
    '.github',
    '.nuxt',
    '.output',
    'coverage',
    'dist',
    'docs',
    'logs',
    'node_modules',
    'playwright-report',
    'test-results',
    'tests',
])

function quoteWindowsArg(arg) {
    if (/^[a-zA-Z0-9_./:=+-]+$/.test(arg)) {
        return arg
    }

    return `"${arg.replaceAll('"', '\\"')}"`
}

function run(command, args, env = process.env) {
    return new Promise((resolve, reject) => {
        const spawnCommand = process.platform === 'win32' ? 'cmd.exe' : command
        const spawnArgs = process.platform === 'win32'
            ? ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')]
            : args

        const child = spawn(spawnCommand, spawnArgs, {
            cwd: repoRoot,
            env,
            stdio: 'inherit',
        })

        child.on('error', reject)
        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve()
                return
            }

            reject(new Error(`Command failed: ${command} ${args.join(' ')} (code: ${code ?? 'null'}, signal: ${signal ?? 'none'})`))
        })
    })
}

async function getLatestMtimeMs(targetPath) {
    if (!existsSync(targetPath)) {
        return 0
    }

    const targetStat = await stat(targetPath)
    if (targetStat.isFile()) {
        return targetStat.mtimeMs
    }

    let latestMtimeMs = targetStat.mtimeMs
    const entries = await readdir(targetPath, { withFileTypes: true })

    for (const entry of entries) {
        if (ignoredEntries.has(entry.name)) {
            continue
        }

        const entryPath = path.join(targetPath, entry.name)
        const entryMtimeMs = await getLatestMtimeMs(entryPath)
        latestMtimeMs = Math.max(latestMtimeMs, entryMtimeMs)
    }

    return latestMtimeMs
}

async function shouldRebuildOutput() {
    if (!existsSync(outputEntry)) {
        return {
            needsBuild: true,
            reason: 'missing build output',
        }
    }

    if (process.env.FORCE_E2E_BUILD === 'true') {
        return {
            needsBuild: true,
            reason: 'FORCE_E2E_BUILD=true',
        }
    }

    const outputMtimeMs = (await stat(outputEntry)).mtimeMs
    const latestInputMtimeMs = await getLatestMtimeMs(repoRoot)

    if (latestInputMtimeMs > outputMtimeMs) {
        return {
            needsBuild: true,
            reason: 'source files changed after the last build',
        }
    }

    return {
        needsBuild: false,
        reason: 'build output is fresh',
    }
}

async function ensureBuildOutput() {
    const { needsBuild, reason } = await shouldRebuildOutput()

    if (!needsBuild) {
        console.info(`[run-e2e] Reusing existing build: ${reason}`)
        return
    }

    console.info(`[run-e2e] Building app before Playwright: ${reason}`)
    await run('pnpm', ['run', 'build'])
}

async function main() {
    const playwrightArgs = process.argv.slice(2)

    await ensureBuildOutput()
    await run(
        'pnpm',
        ['exec', 'playwright', 'test', ...playwrightArgs],
        {
            ...process.env,
            TEST_MODE: 'true',
        },
    )
}

await main()
