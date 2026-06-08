import path from 'node:path'
import { spawn } from 'node:child_process'
import { getCliArgs } from '../shared/cli.mjs'

const repoRoot = process.cwd()
const runE2EScript = path.join(repoRoot, 'scripts', 'testing', 'run-e2e.mjs')
const extraArgs = getCliArgs()

function runRunE2E(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [runE2EScript, ...args], {
            cwd: repoRoot,
            env: process.env,
            stdio: 'inherit',
        })

        child.on('error', reject)
        child.on('exit', (code, signal) => {
            if (code === 0) {
                resolve()
                return
            }

            reject(new Error(`Critical E2E step failed: ${args.join(' ')} (code: ${code ?? 'null'}, signal: ${signal ?? 'none'})`))
        })
    })
}

export async function main() {
    await runRunE2E([
        'tests/e2e/auth-session-governance.e2e.test.ts',
        '--project=chromium',
        '--project=firefox',
        '--project=webkit',
        ...extraArgs,
    ])

    await runRunE2E([
        'tests/e2e/mobile-critical.e2e.test.ts',
        '--project=mobile-chrome-critical',
        '--project=mobile-safari-critical',
        ...extraArgs,
    ])
}

export { runRunE2E }

if (import.meta.url === `file://${process.argv[1]}`) {
    await main()
}
