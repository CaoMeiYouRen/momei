import path from 'node:path'
import process from 'node:process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import WebSocket from 'ws'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

function parsePositiveInteger(value, optionName) {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${optionName} must be a positive integer, received: ${value}`)
    }

    return parsed
}

function parseArgs(argv) {
    return parseCliOptions(argv, {
        defaults: {
            inspectHost: '127.0.0.1',
            inspectPort: 9230,
            metadataOutput: '',
            output: '',
            requestMethod: 'HEAD',
            requestTimeoutMs: 15_000,
            requestUrl: 'http://127.0.0.1:34567/favicon.ico',
        },
        values: {
            '--inspect-host': { key: 'inspectHost' },
            '--inspect-port': {
                key: 'inspectPort',
                parse: (value) => parsePositiveInteger(value, '--inspect-port'),
            },
            '--metadata-output': { key: 'metadataOutput' },
            '--output': { key: 'output' },
            '--request-method': {
                key: 'requestMethod',
                parse: (value) => value.toUpperCase(),
            },
            '--request-timeout-ms': {
                key: 'requestTimeoutMs',
                parse: (value) => parsePositiveInteger(value, '--request-timeout-ms'),
            },
            '--request-url': { key: 'requestUrl' },
        },
    })
}

async function resolveInspectorWebSocketUrl(inspectHost, inspectPort) {
    const response = await fetch(`http://${inspectHost}:${inspectPort}/json/list`)
    if (!response.ok) {
        throw new Error(`Failed to query inspector targets: HTTP ${response.status}`)
    }

    const targets = await response.json()
    const debugTarget = targets.find((target) => typeof target.webSocketDebuggerUrl === 'string')
    if (!debugTarget?.webSocketDebuggerUrl) {
        throw new Error('No inspector target with webSocketDebuggerUrl was found')
    }

    return debugTarget.webSocketDebuggerUrl
}

function createRpcClient(webSocket) {
    let nextId = 1
    const pending = new Map()

    webSocket.on('message', (message) => {
        const payload = JSON.parse(message.toString())
        if (!('id' in payload)) {
            return
        }

        const resolver = pending.get(payload.id)
        if (!resolver) {
            return
        }

        pending.delete(payload.id)
        if (payload.error) {
            resolver.reject(new Error(payload.error.message || 'Inspector RPC failed'))
            return
        }

        resolver.resolve(payload.result)
    })

    return {
        async send(method, params = {}) {
            const id = nextId++
            const request = { id, method, params }

            return await new Promise((resolve, reject) => {
                pending.set(id, { resolve, reject })
                webSocket.send(JSON.stringify(request), (error) => {
                    if (!error) {
                        return
                    }

                    pending.delete(id)
                    reject(error)
                })
            })
        },
    }
}

function waitForOpen(webSocket) {
    return new Promise((resolve, reject) => {
        webSocket.once('open', resolve)
        webSocket.once('error', reject)
    })
}

function normalizeOutputPath(output) {
    if (!output) {
        return path.resolve(repoRoot, 'artifacts', 'remote-inspector.cpuprofile')
    }

    return path.resolve(repoRoot, output)
}

async function writeJson(filePath, value) {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}

async function captureProfile(options) {
    const outputPath = normalizeOutputPath(options.output)
    const metadataOutputPath = options.metadataOutput
        ? path.resolve(repoRoot, options.metadataOutput)
        : `${outputPath}.meta.json`

    const webSocketUrl = await resolveInspectorWebSocketUrl(options.inspectHost, options.inspectPort)
    const webSocket = new WebSocket(webSocketUrl)
    await waitForOpen(webSocket)
    const rpc = createRpcClient(webSocket)

    try {
        await rpc.send('Profiler.enable')
        await rpc.send('Profiler.start')

        const startedAt = new Date().toISOString()
        const requestStartedAt = Date.now()
        let requestSummary

        try {
            const response = await fetch(options.requestUrl, {
                method: options.requestMethod,
                signal: AbortSignal.timeout(options.requestTimeoutMs),
            })

            requestSummary = {
                ok: response.ok,
                status: response.status,
                durationMs: Date.now() - requestStartedAt,
                headers: Object.fromEntries(response.headers.entries()),
            }
        } catch (error) {
            requestSummary = {
                ok: false,
                durationMs: Date.now() - requestStartedAt,
                error: error instanceof Error ? error.message : String(error),
            }
        }

        const { profile } = await rpc.send('Profiler.stop')

        await writeJson(outputPath, profile)
        await writeJson(metadataOutputPath, {
            inspectHost: options.inspectHost,
            inspectPort: options.inspectPort,
            outputPath,
            requestMethod: options.requestMethod,
            requestTimeoutMs: options.requestTimeoutMs,
            requestUrl: options.requestUrl,
            request: requestSummary,
            startedAt,
            stoppedAt: new Date().toISOString(),
            webSocketUrl,
        })

        console.info(JSON.stringify({
            metadataOutputPath,
            outputPath,
            request: requestSummary,
        }, null, 2))
    } finally {
        webSocket.close()
    }
}

if (isDirectExecution(import.meta.url)) {
    const options = parseArgs(process.argv.slice(2))
    await captureProfile(options)
}

export { captureProfile }
