import { promises as fs } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const KB = 1024

const BUDGETS = {
    coreEntryJsGzipBytes: 260 * KB,
    maxAsyncChunkJsGzipBytes: 120 * KB,
    keyCssGzipBytes: 70 * KB,
    prIncrementJsGzipBytes: 20 * KB,
}

function parseArgs(argv) {
    const args = {
        mode: 'warn',
        output: '.lighthouseci/bundle-budget-report.json',
        baseline: '.github/perf/bundle-baseline.json',
    }

    for (let i = 2; i < argv.length; i++) {
        const item = argv[i]
        if (item.startsWith('--mode=')) {
            args.mode = item.split('=')[1]
        } else if (item.startsWith('--output=')) {
            args.output = item.split('=')[1]
        } else if (item.startsWith('--baseline=')) {
            args.baseline = item.split('=')[1]
        }
    }

    if (args.mode !== 'warn' && args.mode !== 'error') {
        throw new Error(`Unsupported mode: ${args.mode}`)
    }

    return args
}

async function collectFiles(dir) {
    const result = []
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            result.push(...await collectFiles(fullPath))
            continue
        }
        if (!entry.isFile()) {
            continue
        }
        if (entry.name.endsWith('.map')) {
            continue
        }
        if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
            result.push(fullPath)
        }
    }
    return result
}

async function getGzipSize(filePath) {
    const content = await fs.readFile(filePath)
    return gzipSync(content, { level: 9 }).byteLength
}

function rel(filePath) {
    return filePath.replaceAll('\\', '/')
}

function toKBString(bytes) {
    return `${(bytes / KB).toFixed(2)}KB`
}

async function main() {
    const args = parseArgs(process.argv)
    const assetsDir = path.resolve('.output/public/_nuxt')

    try {
        await fs.access(assetsDir)
    } catch {
        throw new Error('Cannot find .output/public/_nuxt, please run `pnpm run build` first.')
    }

    const files = await collectFiles(assetsDir)
    const jsFiles = files.filter((f) => f.endsWith('.js'))
    const cssFiles = files.filter((f) => f.endsWith('.css'))

    const jsWithSize = await Promise.all(jsFiles.map(async (file) => ({
        file,
        gzipBytes: await getGzipSize(file),
    })))

    const cssWithSize = await Promise.all(cssFiles.map(async (file) => ({
        file,
        gzipBytes: await getGzipSize(file),
    })))

    const entryCandidates = jsWithSize.filter((item) => {
        const name = path.basename(item.file)
        return /^(entry|app|index)\..+\.js$/i.exec(name)
    })

    const proxyCandidates = [...jsWithSize].sort((a, b) => a.gzipBytes - b.gzipBytes).slice(0, 3)
    const entryFiles = entryCandidates.length > 0 ? entryCandidates : proxyCandidates

    const coreEntryJsGzipBytes = entryFiles.reduce((sum, item) => sum + item.gzipBytes, 0)
    const maxAsyncChunkJs = jsWithSize.reduce((max, item) => item.gzipBytes > max.gzipBytes ? item : max, { file: '', gzipBytes: 0 })

    const keyCssCandidates = cssWithSize.filter((item) => /^(entry|app|index)\..+\.css$/i.exec(path.basename(item.file)))
    const keyCss = (keyCssCandidates.length > 0 ? keyCssCandidates : cssWithSize).reduce(
        (max, item) => item.gzipBytes > max.gzipBytes ? item : max,
        { file: '', gzipBytes: 0 },
    )

    let prIncrementJsGzipBytes = null
    let baselineUsed = false
    let baselineMessage = 'Baseline file not found, only collect current metrics in MVP phase.'

    try {
        const baselineContent = await fs.readFile(path.resolve(args.baseline), 'utf8')
        const baseline = JSON.parse(baselineContent)
        if (typeof baseline?.metrics?.coreEntryJsGzipBytes === 'number') {
            prIncrementJsGzipBytes = coreEntryJsGzipBytes - baseline.metrics.coreEntryJsGzipBytes
            baselineUsed = true
            baselineMessage = 'Baseline file loaded successfully.'
        }
    } catch {
        // MVP阶段允许没有baseline
    }

    const checks = [
        {
            key: 'coreEntryJsGzipBytes',
            expected: BUDGETS.coreEntryJsGzipBytes,
            actual: coreEntryJsGzipBytes,
            passed: coreEntryJsGzipBytes <= BUDGETS.coreEntryJsGzipBytes,
        },
        {
            key: 'maxAsyncChunkJsGzipBytes',
            expected: BUDGETS.maxAsyncChunkJsGzipBytes,
            actual: maxAsyncChunkJs.gzipBytes,
            passed: maxAsyncChunkJs.gzipBytes <= BUDGETS.maxAsyncChunkJsGzipBytes,
            file: rel(path.relative(process.cwd(), maxAsyncChunkJs.file)),
        },
        {
            key: 'keyCssGzipBytes',
            expected: BUDGETS.keyCssGzipBytes,
            actual: keyCss.gzipBytes,
            passed: keyCss.gzipBytes <= BUDGETS.keyCssGzipBytes,
            file: rel(path.relative(process.cwd(), keyCss.file)),
        },
    ]

    if (prIncrementJsGzipBytes !== null) {
        checks.push({
            key: 'prIncrementJsGzipBytes',
            expected: BUDGETS.prIncrementJsGzipBytes,
            actual: prIncrementJsGzipBytes,
            passed: prIncrementJsGzipBytes <= BUDGETS.prIncrementJsGzipBytes,
        })
    }

    const failedChecks = checks.filter((check) => !check.passed)

    const report = {
        mode: args.mode,
        timestamp: new Date().toISOString(),
        baseline: {
            path: args.baseline,
            used: baselineUsed,
            message: baselineMessage,
        },
        budgets: BUDGETS,
        metrics: {
            coreEntryJsGzipBytes,
            maxAsyncChunkJsGzipBytes: maxAsyncChunkJs.gzipBytes,
            keyCssGzipBytes: keyCss.gzipBytes,
            prIncrementJsGzipBytes,
            entryCalculation: {
                strategy: entryCandidates.length > 0 ? 'entry-app-index' : 'proxy-smallest-3-js',
                files: entryFiles.map((item) => ({
                    file: rel(path.relative(process.cwd(), item.file)),
                    gzipBytes: item.gzipBytes,
                })),
            },
            largestJsChunk: {
                file: rel(path.relative(process.cwd(), maxAsyncChunkJs.file)),
                gzipBytes: maxAsyncChunkJs.gzipBytes,
            },
            largestKeyCss: {
                file: rel(path.relative(process.cwd(), keyCss.file)),
                gzipBytes: keyCss.gzipBytes,
            },
        },
        checks,
    }

    await fs.mkdir(path.dirname(path.resolve(args.output)), { recursive: true })
    await fs.writeFile(path.resolve(args.output), JSON.stringify(report, null, 2), 'utf8')

    console.log('Bundle Budget Report (MVP):')
    console.log(`- coreEntryJs: ${toKBString(coreEntryJsGzipBytes)} / ${toKBString(BUDGETS.coreEntryJsGzipBytes)}`)
    console.log(`- maxAsyncChunkJs: ${toKBString(maxAsyncChunkJs.gzipBytes)} / ${toKBString(BUDGETS.maxAsyncChunkJsGzipBytes)} (${rel(path.relative(process.cwd(), maxAsyncChunkJs.file))})`)
    console.log(`- keyCss: ${toKBString(keyCss.gzipBytes)} / ${toKBString(BUDGETS.keyCssGzipBytes)} (${rel(path.relative(process.cwd(), keyCss.file))})`)
    if (prIncrementJsGzipBytes !== null) {
        console.log(`- prIncrementJs: ${toKBString(prIncrementJsGzipBytes)} / ${toKBString(BUDGETS.prIncrementJsGzipBytes)}`)
    } else {
        console.log(`- prIncrementJs: baseline missing (${args.baseline}), skip in MVP phase`)
    }

    if (failedChecks.length > 0) {
        console.warn('\nBudget checks with over-limit:')
        failedChecks.forEach((check) => {
            console.warn(`- ${check.key}: ${toKBString(check.actual)} > ${toKBString(check.expected)}`)
        })
        if (args.mode === 'error') {
            process.exit(1)
        }
    }
}

main().catch((error) => {
    console.error(`[bundle-budget] ${error.message}`)
    process.exit(1)
})
