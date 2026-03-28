import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const repoRoot = process.cwd()
const outputEntry = path.join(repoRoot, '.output', 'server', 'index.mjs')

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

async function ensureBuildOutput() {
    if (existsSync(outputEntry)) {
        return
    }

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
