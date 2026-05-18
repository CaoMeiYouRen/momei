import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { handleSessionGovernanceEvent } from './session-governance-shared.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')
const INITIAL_STDIN_TIMEOUT_MS = 250
const STDIN_IDLE_TIMEOUT_MS = 50
const STDIN_MAX_TIMEOUT_MS = 1000

function parseArgs(argv) {
    const parsed = {
        eventName: '',
        platform: 'manual',
    }

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index]

        if (argument.startsWith('--event=')) {
            parsed.eventName = argument.slice('--event='.length)
            continue
        }

        if (argument === '--event') {
            parsed.eventName = argv[index + 1] ?? parsed.eventName
            index += 1
            continue
        }

        if (argument.startsWith('--platform=')) {
            parsed.platform = argument.slice('--platform='.length)
            continue
        }

        if (argument === '--platform') {
            parsed.platform = argv[index + 1] ?? parsed.platform
            index += 1
        }
    }

    return parsed
}

async function readStdin() {
    if (process.stdin.isTTY) {
        return ''
    }

    return new Promise((resolve) => {
        const chunks = []
        let settled = false
        let idleTimer = null
        let initialTimer = null
        let maxTimer = null

        const finish = () => {
            if (settled) {
                return
            }

            settled = true

            if (idleTimer) {
                clearTimeout(idleTimer)
            }

            if (initialTimer) {
                clearTimeout(initialTimer)
            }

            if (maxTimer) {
                clearTimeout(maxTimer)
            }

            process.stdin.off('data', handleData)
            process.stdin.off('end', finish)
            process.stdin.off('error', finish)
            process.stdin.pause()

            resolve(Buffer.concat(chunks).toString('utf8').trim())
        }

        const scheduleIdleFinish = () => {
            if (idleTimer) {
                clearTimeout(idleTimer)
            }

            idleTimer = setTimeout(finish, STDIN_IDLE_TIMEOUT_MS)
        }

        const handleData = (chunk) => {
            if (initialTimer) {
                clearTimeout(initialTimer)
                initialTimer = null
            }

            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            scheduleIdleFinish()
        }

        initialTimer = setTimeout(finish, INITIAL_STDIN_TIMEOUT_MS)
        maxTimer = setTimeout(finish, STDIN_MAX_TIMEOUT_MS)

        process.stdin.on('data', handleData)
        process.stdin.on('end', finish)
        process.stdin.on('error', finish)
        process.stdin.resume()
    })
}

function parsePayload(rawInput) {
    if (!rawInput) {
        return {}
    }

    try {
        return JSON.parse(rawInput)
    } catch {
        return {}
    }
}

function formatOutput(platform, eventName, result) {
    if (platform === 'copilot' && eventName === 'session-start' && result.additionalContext) {
        return {
            additionalContext: result.additionalContext,
        }
    }

    if (platform === 'claude' && eventName === 'session-start' && result.additionalContext) {
        return {
            hookSpecificOutput: {
                hookEventName: 'SessionStart',
                additionalContext: result.additionalContext,
            },
        }
    }

    if (platform === 'manual') {
        return result
    }

    return null
}

async function main() {
    const { eventName, platform } = parseArgs(process.argv.slice(2))

    if (!eventName) {
        throw new Error('Missing required --event argument.')
    }

    const rawInput = await readStdin()
    const payload = parsePayload(rawInput)
    const result = await handleSessionGovernanceEvent({
        eventName,
        payload,
        platform,
        projectRoot,
    })
    const output = formatOutput(platform, eventName, result)

    if (output) {
        process.stdout.write(`${JSON.stringify(output)}\n`)
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error)

    process.stderr.write(`${message}\n`)
    process.exitCode = 1
})
