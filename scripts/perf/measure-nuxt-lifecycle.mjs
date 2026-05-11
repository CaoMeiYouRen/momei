import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const DEFAULT_DEV_PORT = 34567

function parseArgs(argv) {
    return parseCliOptions(argv, {
        defaults: {
            logOutput: '',
            mode: 'dev',
            output: '',
            port: DEFAULT_DEV_PORT,
            requestPath: '/',
            repeat: 1,
            timeoutMs: 0,
            warmRequest: true,
            warmRequestTimeoutMs: 60 * 1000,
        },
        flags: {
            '--skip-warm-request': {
                key: 'warmRequest',
                value: false,
            },
        },
        values: {
            '--log-output': { key: 'logOutput' },
            '--mode': {
                key: 'mode',
                allowedValues: ['build', 'dev'],
                invalidMessage: (value) => `Unsupported mode: ${value}`,
            },
            '--output': { key: 'output' },
            '--port': {
                key: 'port',
                parse: (value) => parsePositiveInteger(value, '--port'),
            },
            '--request-path': { key: 'requestPath' },
            '--repeat': {
                key: 'repeat',
                parse: (value) => parsePositiveInteger(value, '--repeat'),
            },
            '--timeout-ms': {
                key: 'timeoutMs',
                parse: (value) => parsePositiveInteger(value, '--timeout-ms'),
            },
            '--warm-request-timeout-ms': {
                key: 'warmRequestTimeoutMs',
                parse: (value) => parsePositiveInteger(value, '--warm-request-timeout-ms'),
            },
        },
    })
}

function parsePositiveInteger(value, optionName) {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${optionName} must be a positive integer, received: ${value}`)
    }

    return parsed
}

function getDefaultTimeoutMs(mode) {
    return mode === 'dev' ? 10 * 60 * 1000 : 30 * 60 * 1000
}

const ANSI_ESCAPE = String.fromCharCode(27)
const ANSI_SGR_PATTERN = new RegExp(`${ANSI_ESCAPE}\\[[0-9;]*m`, 'g')

function stripAnsi(value) {
    return value.replace(ANSI_SGR_PATTERN, '')
}

function getSpawnCommand(command, commandArgs) {
    if (process.platform === 'win32') {
        return {
            command: process.env.comspec || 'cmd.exe',
            args: ['/d', '/s', '/c', [command, ...commandArgs].join(' ')],
        }
    }

    return { command, args: commandArgs }
}

function parseDurationMs(rawValue, unit = 'ms') {
    const parsed = Number.parseFloat(rawValue)
    if (!Number.isFinite(parsed)) {
        return null
    }

    if (unit === 's') {
        return Math.round(parsed * 1000)
    }

    return Math.round(parsed)
}

function formatMs(value) {
    if (!Number.isFinite(value)) {
        return 'n/a'
    }

    if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}s`
    }

    return `${value}ms`
}

function cloneValue(value) {
    if (Array.isArray(value)) {
        return [...value]
    }

    return value
}

function setOnce(target, key, value) {
    if (!(key in target)) {
        target[key] = cloneValue(value)
    }
}

function appendValue(target, key, value) {
    const nextValue = cloneValue(value)

    if (!(key in target)) {
        target[key] = nextValue
        return
    }

    if (!Array.isArray(target[key])) {
        target[key] = [target[key]]
    }

    if (Array.isArray(nextValue)) {
        target[key].push(...nextValue)
        return
    }

    target[key].push(nextValue)
}

function getEventMatchers(mode) {
    if (mode === 'dev') {
        return [
            { key: 'nuxtBanner', regex: /Nuxt\s+\d+\.\d+\.\d+/ },
            {
                key: 'viteClientWarmed',
                regex: /Vite client warmed up in\s+(\d+)ms/i,
                internalKey: 'viteClientWarmupMs',
            },
            {
                key: 'viteServerWarmed',
                regex: /Vite server warmed up in\s+(\d+)ms/i,
                internalKey: 'viteServerWarmupMs',
            },
            {
                key: 'nitroServerBuilt',
                regex: /Nitro server built in\s+(\d+)ms/i,
                internalKey: 'nitroServerBuiltMs',
            },
            {
                key: 'localReady',
                regex: /Local:\s+(https?:\/\/\S+)/i,
                detailKey: 'localUrl',
            },
        ]
    }

    return [
        { key: 'nuxtBanner', regex: /Nuxt\s+\d+\.\d+\.\d+/ },
        {
            key: 'viteBundleBuilt',
            regex: /(?:^|\s)built in\s+([\d.]+)(ms|s)$/i,
            internalKey: 'viteBundleBuiltMs',
            multiple: true,
            unitGroupIndex: 2,
        },
        {
            key: 'clientBuilt',
            regex: /Client built in\s+(\d+)ms/i,
            internalKey: 'clientBuiltMs',
        },
        {
            key: 'serverBuilt',
            regex: /Server built in\s+(\d+)ms/i,
            internalKey: 'serverBuiltMs',
        },
        {
            key: 'nitroServerBuilt',
            regex: /Nitro server built in\s+(\d+)ms/i,
            internalKey: 'nitroServerBuiltMs',
        },
    ]
}

function createSample(mode, sampleNumber) {
    return {
        details: {
            mode,
            sampleNumber,
        },
        events: [],
        internalDurations: {},
        milestones: {},
        ok: false,
        sampleNumber,
        wallDurationMs: null,
    }
}

function recordMatchedEvent(sample, matcher, match, cleanLine, sinceStartMs) {
    setOnce(sample.milestones, matcher.key, sinceStartMs)

    if (matcher.detailKey && match[1]) {
        setOnce(sample.details, matcher.detailKey, match[1].trim())
    }

    if (matcher.internalKey && match[1]) {
        const unit = matcher.unitGroupIndex ? match[matcher.unitGroupIndex] : 'ms'
        const parsedDuration = parseDurationMs(match[1], unit)
        if (parsedDuration !== null) {
            if (matcher.multiple) {
                appendValue(sample.internalDurations, matcher.internalKey, parsedDuration)
            } else {
                setOnce(sample.internalDurations, matcher.internalKey, parsedDuration)
            }
        }
    }

    sample.events.push({
        key: matcher.key,
        line: cleanLine,
        sinceStartMs,
    })
}

function processOutputLine(sample, line, startTime, matchers) {
    const cleanLine = stripAnsi(line).trimEnd()
    if (!cleanLine) {
        return []
    }

    const sinceStartMs = Date.now() - startTime
    const matchedKeys = []

    for (const matcher of matchers) {
        const match = cleanLine.match(matcher.regex)
        if (!match) {
            continue
        }

        recordMatchedEvent(sample, matcher, match, cleanLine, sinceStartMs)
        matchedKeys.push(matcher.key)
    }

    return matchedKeys
}

function createLineProcessor(onLine) {
    let buffer = ''

    return {
        push(chunk) {
            buffer += chunk.toString('utf8')
            const lines = buffer.split(/\r?\n/)
            buffer = lines.pop() ?? ''
            lines.forEach(onLine)
        },
        flush() {
            if (buffer) {
                onLine(buffer)
                buffer = ''
            }
        },
    }
}

async function terminateProcessTree(pid) {
    if (!pid) {
        return
    }

    if (process.platform === 'win32') {
        await new Promise((resolve) => {
            const child = spawn(process.env.comspec || 'cmd.exe', ['/d', '/s', '/c', `taskkill /pid ${pid} /t /f`], {
                stdio: 'ignore',
            })

            child.on('error', () => resolve())
            child.on('close', () => resolve())
        })
        return
    }

    try {
        process.kill(pid, 'SIGTERM')
    } catch {
        // ignore cases where the child process already exited before teardown
    }
}

async function warmDevRequest(sample, startTime, localUrl, requestPath, timeoutMs) {
    const targetUrl = new URL(requestPath, localUrl).toString()
    const requestStartedAt = Date.now() - startTime
    setOnce(sample.milestones, 'warmRequestStarted', requestStartedAt)
    sample.events.push({
        key: 'warmRequestStarted',
        line: `GET ${targetUrl}`,
        sinceStartMs: requestStartedAt,
    })

    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => {
        controller.abort(new Error(`Warm request timed out after ${timeoutMs}ms.`))
    }, timeoutMs)

    try {
        const response = await fetch(targetUrl, {
            redirect: 'manual',
            signal: controller.signal,
        })

        const headersReceivedAt = Date.now() - startTime
        setOnce(sample.milestones, 'warmRequestHeaders', headersReceivedAt)
        setOnce(sample.internalDurations, 'warmRequestHeadersMs', headersReceivedAt - requestStartedAt)
        setOnce(sample.details, 'warmRequestStatus', response.status)
        sample.events.push({
            key: 'warmRequestHeaders',
            line: `${response.status} ${response.statusText}`.trim(),
            sinceStartMs: headersReceivedAt,
        })

        if (!response.body) {
            setOnce(sample.milestones, 'warmRequestFirstChunk', headersReceivedAt)
            setOnce(sample.internalDurations, 'warmRequestFirstChunkMs', headersReceivedAt - requestStartedAt)
            return
        }

        const reader = response.body.getReader()
        try {
            await reader.read()
            const firstChunkAt = Date.now() - startTime
            setOnce(sample.milestones, 'warmRequestFirstChunk', firstChunkAt)
            setOnce(sample.internalDurations, 'warmRequestFirstChunkMs', firstChunkAt - requestStartedAt)
            sample.events.push({
                key: 'warmRequestFirstChunk',
                line: 'Received first response chunk.',
                sinceStartMs: firstChunkAt,
            })
        } finally {
            await reader.cancel().catch(() => {})
        }
    } catch (error) {
        const requestFailedAt = Date.now() - startTime
        setOnce(sample.milestones, 'warmRequestFailed', requestFailedAt)
        setOnce(sample.details, 'warmRequestError', error instanceof Error ? error.message : String(error))
        sample.events.push({
            key: 'warmRequestFailed',
            line: sample.details.warmRequestError,
            sinceStartMs: requestFailedAt,
        })
    } finally {
        clearTimeout(timeoutHandle)
    }
}

async function runSingleSample(options, sampleNumber) {
    const sample = createSample(options.mode, sampleNumber)
    const startTime = Date.now()
    const logChunks = []
    const matchers = getEventMatchers(options.mode)
    const timeoutMs = options.timeoutMs || getDefaultTimeoutMs(options.mode)

    const commandArgs = options.mode === 'dev'
        ? ['exec', 'nuxt', 'dev', '--port', String(options.port + sampleNumber - 1), '--host', '127.0.0.1']
        : ['run', 'build']

    const spawnTarget = getSpawnCommand('pnpm', commandArgs)
    sample.command = [spawnTarget.command, ...spawnTarget.args].join(' ')

    return await new Promise((resolve) => {
        let didRequestStop = false
        let resolved = false
        let stopTimer = null
        let warmRequestPromise = null

        const requestStop = () => {
            if (didRequestStop) {
                return
            }

            didRequestStop = true
            stopTimer = setTimeout(async () => {
                await terminateProcessTree(child.pid)
            }, 1000)
        }

        const child = spawn(spawnTarget.command, spawnTarget.args, {
            cwd: repoRoot,
            env: {
                ...process.env,
                NUXT_TELEMETRY_DISABLED: '1',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        })

        const finish = (code, signal) => {
            if (resolved) {
                return
            }

            resolved = true
            clearTimeout(timeoutHandle)

            sample.exitCode = code
            sample.signal = signal
            sample.logOutput = logChunks.join('')

            if (options.mode === 'dev') {
                sample.wallDurationMs = sample.milestones.warmRequestFirstChunk
                    ?? sample.milestones.warmRequestHeaders
                    ?? sample.milestones.localReady
                    ?? sample.wallDurationMs
                sample.ok = Number.isFinite(sample.milestones.warmRequestFirstChunk)
                    || Number.isFinite(sample.milestones.warmRequestHeaders)
                    || (!options.warmRequest && Number.isFinite(sample.milestones.localReady))
            } else {
                sample.wallDurationMs = Date.now() - startTime
                sample.ok = code === 0
            }

            resolve(sample)
        }

        const onOutput = (rawLine) => {
            const line = `${rawLine}\n`
            logChunks.push(line)
            process.stdout.write(line)

            const matchedEventKeys = processOutputLine(sample, rawLine, startTime, matchers)

            if (options.mode === 'dev' && matchedEventKeys.includes('localReady') && !warmRequestPromise) {
                sample.wallDurationMs = sample.milestones.localReady

                if (!options.warmRequest) {
                    requestStop()
                    return
                }

                const localUrl = sample.details.localUrl
                if (!localUrl) {
                    requestStop()
                    return
                }

                warmRequestPromise = warmDevRequest(sample, startTime, localUrl, options.requestPath, options.warmRequestTimeoutMs)
                    .finally(() => {
                        requestStop()
                    })
            }
        }

        const stdoutProcessor = createLineProcessor(onOutput)
        const stderrProcessor = createLineProcessor(onOutput)

        child.stdout.on('data', (chunk) => {
            stdoutProcessor.push(chunk)
        })
        child.stderr.on('data', (chunk) => {
            stderrProcessor.push(chunk)
        })

        child.on('error', (error) => {
            sample.error = error.message
            stdoutProcessor.flush()
            stderrProcessor.flush()
            finish(null, 'spawn-error')
        })

        child.on('close', (code, signal) => {
            if (stopTimer) {
                clearTimeout(stopTimer)
            }
            stdoutProcessor.flush()
            stderrProcessor.flush()
            finish(code, signal)
        })

        const timeoutHandle = setTimeout(async () => {
            sample.error = `Timed out after ${timeoutMs}ms.`
            await terminateProcessTree(child.pid)
        }, timeoutMs)
    })
}

function sortNumbers(values) {
    return [...values].sort((left, right) => left - right)
}

function buildNumericSummary(values) {
    if (values.length === 0) {
        return null
    }

    const sorted = sortNumbers(values)
    const middleIndex = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 === 0
        ? Math.round((sorted[middleIndex - 1] + sorted[middleIndex]) / 2)
        : sorted[middleIndex]

    return {
        maxMs: sorted[sorted.length - 1],
        medianMs: median,
        minMs: sorted[0],
    }
}

function buildMetricSummary(samples, selector) {
    const values = samples
        .map(selector)
        .filter((value) => Number.isFinite(value))

    return buildNumericSummary(values)
}

function buildObjectMetricSummary(samples, selector) {
    const keys = new Set()
    for (const sample of samples) {
        const source = selector(sample)
        Object.keys(source).forEach((key) => keys.add(key))
    }

    const summary = {}
    for (const key of keys) {
        const values = []
        for (const sample of samples) {
            const rawValue = selector(sample)[key]
            if (Array.isArray(rawValue)) {
                rawValue
                    .filter((entry) => Number.isFinite(entry))
                    .forEach((entry) => values.push(entry))
                continue
            }

            if (Number.isFinite(rawValue)) {
                values.push(rawValue)
            }
        }

        const metricSummary = buildNumericSummary(values)
        if (metricSummary) {
            summary[key] = metricSummary
        }
    }

    return summary
}

function buildSummary(options, samples) {
    const successfulSamples = samples.filter((sample) => sample.ok)

    return {
        failedSamples: samples.length - successfulSamples.length,
        internalDurations: buildObjectMetricSummary(successfulSamples, (sample) => sample.internalDurations),
        milestoneWallDurations: buildObjectMetricSummary(successfulSamples, (sample) => sample.milestones),
        requestedMode: options.mode,
        repeat: options.repeat,
        successfulSamples: successfulSamples.length,
        wallDuration: buildMetricSummary(successfulSamples, (sample) => sample.wallDurationMs),
    }
}

function buildJsonOutput(options, samples) {
    return {
        generatedAt: new Date().toISOString(),
        options: {
            mode: options.mode,
            port: options.port,
            requestPath: options.requestPath,
            repeat: options.repeat,
            timeoutMs: options.timeoutMs || getDefaultTimeoutMs(options.mode),
            warmRequest: options.warmRequest,
            warmRequestTimeoutMs: options.warmRequestTimeoutMs,
        },
        samples: samples.map((sample) => ({
            command: sample.command,
            details: sample.details,
            error: sample.error ?? null,
            events: sample.events,
            exitCode: sample.exitCode ?? null,
            internalDurations: sample.internalDurations,
            milestones: sample.milestones,
            ok: sample.ok,
            sampleNumber: sample.sampleNumber,
            signal: sample.signal ?? null,
            wallDurationMs: sample.wallDurationMs,
        })),
        summary: buildSummary(options, samples),
    }
}

async function writeOutputs(options, samples) {
    const outputPayload = buildJsonOutput(options, samples)

    if (options.output) {
        await mkdir(path.dirname(options.output), { recursive: true })
        await writeFile(options.output, `${JSON.stringify(outputPayload, null, 2)}\n`, 'utf8')
    }

    if (options.logOutput) {
        const logContent = samples
            .map((sample) => [
                `# Sample ${sample.sampleNumber}`,
                `# Mode: ${options.mode}`,
                `# Wall duration: ${formatMs(sample.wallDurationMs)}`,
                sample.logOutput ?? '',
            ].join('\n'))
            .join('\n\n')

        await mkdir(path.dirname(options.logOutput), { recursive: true })
        await writeFile(options.logOutput, `${logContent}\n`, 'utf8')
    }

    return outputPayload
}

function printSummary(payload) {
    console.info('\n[nuxt-perf] Summary')
    console.info(`- mode: ${payload.options.mode}`)
    console.info(`- repeat: ${payload.options.repeat}`)
    console.info(`- successful samples: ${payload.summary.successfulSamples}/${payload.options.repeat}`)

    if (payload.summary.wallDuration) {
        console.info(`- wall duration: min ${formatMs(payload.summary.wallDuration.minMs)}, median ${formatMs(payload.summary.wallDuration.medianMs)}, max ${formatMs(payload.summary.wallDuration.maxMs)}`)
    }

    if (payload.summary.failedSamples > 0) {
        console.info(`- failed samples: ${payload.summary.failedSamples}`)
    }

    for (const [key, value] of Object.entries(payload.summary.internalDurations)) {
        console.info(`- ${key}: min ${formatMs(value.minMs)}, median ${formatMs(value.medianMs)}, max ${formatMs(value.maxMs)}`)
    }
}

async function main(argv = process.argv) {
    const options = parseArgs(argv)
    const samples = []

    for (let sampleNumber = 1; sampleNumber <= options.repeat; sampleNumber += 1) {
        console.info(`\n[nuxt-perf] Running ${options.mode} sample ${sampleNumber}/${options.repeat}`)
        const sample = await runSingleSample(options, sampleNumber)
        samples.push(sample)
    }

    const payload = await writeOutputs(options, samples)
    printSummary(payload)

    if (samples.some((sample) => !sample.ok)) {
        process.exitCode = 1
    }
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
