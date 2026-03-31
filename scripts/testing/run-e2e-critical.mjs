import path from 'node:path'
import { spawn } from 'node:child_process'

const repoRoot = process.cwd()
const runE2EScript = path.join(repoRoot, 'scripts', 'testing', 'run-e2e.mjs')

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

await runRunE2E([
    'tests/e2e/auth-session-governance.e2e.test.ts',
    '--project=chromium',
    '--project=firefox',
    '--project=webkit',
])

await runRunE2E([
    'tests/e2e/mobile-critical.e2e.test.ts',
    '--project=mobile-chrome-critical',
    '--project=mobile-safari-critical',
])
