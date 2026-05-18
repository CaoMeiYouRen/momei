import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { handleSessionGovernanceEvent } from './session-governance-shared.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

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

    const chunks = []

    for await (const chunk of process.stdin) {
        chunks.push(chunk)
    }

    return Buffer.concat(chunks).toString('utf8').trim()
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
