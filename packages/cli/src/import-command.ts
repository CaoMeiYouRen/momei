import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CAC } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import type { MomeiImportPostRequest } from '@momei-blog/api-client'
import { buildImportExecutionPlan, type CliImportValidationCandidate } from './import-validation'
import { migrateImportEntriesLocalImages, type LocalImageMigrationReport } from './import-image-migration'
import {
    clearImportState,
    computeImportEntryHash,
    createImportState,
    createImportStateWriter,
    DEFAULT_IMPORT_STATE_FILE,
    loadImportState,
    normalizeEntryPath,
    recordImportStateEntry,
    resolveImportStateFile,
    saveImportState,
    shouldResumeSkip,
    summarizeImportState,
    type ImportState,
} from './import-state'
import { parseHexoFiles } from './parser'
import { HugoParser } from './hugo-parser'
import { JekyllParser } from './jekyll-parser'
import { WordPressParser } from './wordpress-parser'
import { MomeiApiClient } from './api-client'
import type {
    ImportResult,
    ImportStats,
    ContentParser,
    ParsedPost,
} from './types'

interface ImportCommandOptions {
    apiUrl: string
    apiKey?: string
    dryRun: boolean
    verbose: boolean
    concurrency: number | string
    reportFile?: string
    confirmPathAliases: boolean
    uploadImages: boolean
    rateLimit: number | string
    maxRetries: number | string
    format?: string
    resume?: boolean
    stateFile?: string
    cleanState?: boolean
}

export function getParser(format: string | undefined): ContentParser {
    if (format === 'hugo') {
        return new HugoParser()
    }
    if (format === 'wordpress') {
        return new WordPressParser()
    }
    if (format === 'jekyll') {
        return new JekyllParser()
    }
    // Default to Hexo
    return { parse: parseHexoFiles as (sourceDir: string, verbose?: boolean) => Promise<ParsedPost[]> }
}

function buildImportRequest(entry: ParsedPost): MomeiImportPostRequest {
    return {
        ...entry.post,
        sourceFile: entry.relativeFile,
    }
}

async function validateImportCandidates(
    client: MomeiApiClient,
    entries: ParsedPost[],
    concurrency: number,
): Promise<CliImportValidationCandidate[]> {
    const candidates: CliImportValidationCandidate[] = []

    for (let index = 0; index < entries.length; index += concurrency) {
        const batch = entries.slice(index, index + concurrency)
        const batchResults = await Promise.all(batch.map(async (entry) => {
            const request = buildImportRequest(entry)
            const response = await client.validateImportPost(request)
            return {
                file: entry.file,
                relativeFile: entry.relativeFile,
                request,
                report: response.data,
            } satisfies CliImportValidationCandidate
        }))

        candidates.push(...batchResults)
    }

    return candidates
}

async function maybeWriteImportReport(report: unknown, reportFile?: string) {
    if (!reportFile) {
        return
    }

    const outputPath = resolve(process.cwd(), reportFile)
    await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8')
    console.log(chalk.gray(`Saved report to ${outputPath}`))
}

function displayImportValidationSummary(plan: ReturnType<typeof buildImportExecutionPlan>) {
    console.log(chalk.blue('\n🧪 Import Validation Summary\n'))
    console.log(chalk.green(`  Ready: ${plan.summary.ready}`))
    console.log(chalk.yellow(`  Confirmation Required: ${plan.summary.requiresConfirmation}`))
    console.log(chalk.red(`  Blocking Issues: ${plan.summary.blockingIssues}`))
    console.log(chalk.blue(`  Already Synced: ${plan.summary.alreadySynced}`))
    console.log(chalk.gray(`  Skipped: ${plan.summary.skipped}`))
    console.log(chalk.gray(`  Accepted: ${plan.summary.accepted}`))
    console.log(chalk.yellow(`  Fallback: ${plan.summary.fallback}`))
    console.log(chalk.yellow(`  Repaired: ${plan.summary.repaired}`))
    console.log(chalk.red(`  Invalid: ${plan.summary.invalid}`))
    console.log(chalk.red(`  Conflict: ${plan.summary.conflict}`))
    console.log(chalk.magenta(`  Needs Confirmation: ${plan.summary.needsConfirmation}\n`))
}

function displaySummary(stats: ImportStats) {
    console.log(chalk.blue('\n📊 Import Summary:\n'))
    console.log(chalk.green(`  ✓ Success: ${stats.success}`))
    console.log(chalk.red(`  ✗ Failed: ${stats.failed}`))
    console.log(chalk.gray(`  ↷ Skipped: ${stats.skipped}`))
    console.log(chalk.gray(`  Total: ${stats.total}\n`))

    if (stats.failed > 0) {
        console.log(chalk.red('Failed imports:'))
        stats.results
            .filter((result) => !result.success)
            .forEach((result) => {
                console.log(chalk.red(`  - ${result.file}: ${result.error}`))
            })
    }

    if (stats.success === stats.total) {
        console.log(chalk.green('\n🎉 All posts imported successfully!\n'))
    } else if (stats.success > 0) {
        console.log(chalk.yellow('\n⚠️  Some posts failed to import. Please check the errors above.\n'))
    } else {
        console.log(chalk.red('\n❌ All posts failed to import. Please check your API key and connection.\n'))
        process.exitCode = 1

    }
}

function displayImageMigrationSummary(report: LocalImageMigrationReport) {
    console.log(chalk.blue('\n🖼️ Local Image Migration Summary\n'))
    console.log(chalk.gray(`  Scanned: ${report.summary.scanned}`))
    console.log(chalk.green(`  Replaced: ${report.summary.replaced}`))
    console.log(chalk.green(`  Uploaded Files: ${report.summary.uploaded}`))
    console.log(chalk.yellow(`  Skipped: ${report.summary.skipped}`))
    console.log(chalk.red(`  Failed: ${report.summary.failed}\n`))
}

interface ImportStateContext {
    state: ImportState
    stateFile: string
}

async function prepareImportState(
    sourceDir: string,
    options: ImportCommandOptions,
    dryRun: boolean,
): Promise<ImportStateContext> {
    const stateFile = resolveImportStateFile(sourceDir, options.stateFile)

    if (dryRun) {
        console.log(chalk.gray(`State File: ${stateFile}（dry-run 不读写状态文件）`))

        if (options.cleanState) {
            console.log(chalk.gray('  --clean-state 在 dry-run 下不生效，状态文件保持不变'))
        }

        return { state: createImportState(sourceDir), stateFile }
    }

    if (options.cleanState) {
        await clearImportState(stateFile)
        console.log(chalk.gray(`State File: ${stateFile}（已按 --clean-state 清除）`))
    }

    const loaded = await loadImportState(stateFile, sourceDir)
    console.log(chalk.gray(`State File: ${stateFile}`))

    if (loaded.warning) {
        console.warn(chalk.yellow(`⚠️  ${loaded.warning}`))
    }

    if (options.resume) {
        if (!loaded.existed) {
            console.log(chalk.yellow('⚠️  未找到迁移状态文件，本次按全量导入执行'))
        } else {
            const previous = summarizeImportState(loaded.state)
            console.log(chalk.gray(
                `Resume: 已成功 ${previous.success} / 失败 ${previous.failed} / 待处理 ${previous.pending} / 跳过 ${previous.skipped}`,
            ))
        }
    }

    return { state: loaded.state, stateFile }
}

/** 状态文件写盘失败不应阻断导入，只提示并放弃本次断点记录。 */
async function persistImportState(stateFile: string, state: ImportState): Promise<boolean> {
    try {
        await saveImportState(stateFile, state)

        return true
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        console.warn(chalk.yellow(`⚠️  状态文件写入失败（继续导入，本次不记录断点）：${reason}`))

        return false
    }
}

type EntryMeta = Map<string, { hash: string, path: string }>

function buildEntryMeta(posts: ParsedPost[]): EntryMeta {
    const meta: EntryMeta = new Map()

    for (const post of posts) {
        meta.set(post.file, {
            hash: computeImportEntryHash(post),
            path: normalizeEntryPath(post.relativeFile),
        })
    }

    return meta
}

/** 校验判定为非导入的条目（跳过 / 冲突 / 无效）在状态里落为 `skipped`。 */
function markValidationSkipped(
    state: ImportState,
    items: ReturnType<typeof buildImportExecutionPlan>['items'],
    entryMeta: EntryMeta,
): ImportState {
    let next = state

    for (const item of items) {
        if (item.action === 'import') {
            continue
        }

        const meta = entryMeta.get(item.file)

        if (!meta) {
            continue
        }

        next = recordImportStateEntry(next, { ...meta, error: item.actionReason, status: 'skipped' })
    }

    return next
}

function markPendingEntries(state: ImportState, entries: Array<{ file: string }>, entryMeta: EntryMeta): ImportState {
    let next = state

    for (const entry of entries) {
        const meta = entryMeta.get(entry.file)

        if (meta) {
            next = recordImportStateEntry(next, { ...meta, status: 'pending' })
        }
    }

    return next
}

function applyResumeFilter<T extends { file: string }>(
    entries: T[],
    entryMeta: EntryMeta,
    state: ImportState,
): { entries: T[], skipped: number } {
    const filtered = entries.filter((entry) => {
        const meta = entryMeta.get(entry.file)

        return !(meta && shouldResumeSkip(state, meta.path, meta.hash))
    })

    return { entries: filtered, skipped: entries.length - filtered.length }
}

function buildImportReport(context: {
    dryRun: boolean
    executionPlan: ReturnType<typeof buildImportExecutionPlan>
    imageMigrationReport: LocalImageMigrationReport | null
}) {
    const { dryRun, executionPlan, imageMigrationReport } = context

    return {
        generatedAt: new Date().toISOString(),
        dryRun,
        summary: executionPlan.summary,
        imageMigration: imageMigrationReport
            ? {
                enabled: imageMigrationReport.enabled,
                summary: imageMigrationReport.summary,
                items: imageMigrationReport.items,
            }
            : undefined,
        items: executionPlan.items.map((item) => ({
            file: item.relativeFile,
            action: item.action,
            actionReason: item.actionReason,
            report: item.report,
        })),
    }
}

function displayImportHeader(context: {
    apiUrl: string
    concurrency: number
    dryRun: boolean
    formatLabel: string
    maxRetries: number | string
    rateLimit: number | string
    sourceDir: string
    uploadImages: boolean
}) {
    console.log(chalk.blue('\n🚀 Momei Migration Tool\n'))
    console.log(chalk.gray(`Source: ${context.sourceDir}`))
    console.log(chalk.gray(`Format: ${context.formatLabel}`))
    console.log(chalk.gray(`API URL: ${context.apiUrl}`))
    console.log(chalk.gray(`Dry Run: ${context.dryRun ? 'Yes' : 'No'}`))
    console.log(chalk.gray(`Upload Local Images: ${context.uploadImages ? 'Yes' : 'No'}`))
    console.log(chalk.gray(`Concurrency: ${context.concurrency}`))
    console.log(chalk.gray(`Rate Limit: ${String(context.rateLimit)} req/s`))
    console.log(chalk.gray(`Max Retries: ${String(context.maxRetries)}\n`))
}

function displayParsedPosts(posts: ParsedPost[]) {
    console.log(chalk.gray('\nParsed posts:'))
    posts.forEach(({ file, post }) => {
        console.log(chalk.gray(`  - ${post.title} (${file})`))
    })
}

async function runImageMigration(
    posts: ParsedPost[],
    options: { client: MomeiApiClient | null, dryRun: boolean, sourceDir: string },
): Promise<LocalImageMigrationReport> {
    const { client, dryRun, sourceDir } = options
    const spinner = ora(dryRun
        ? 'Scanning local image references (dry run)...'
        : 'Uploading local images and rewriting references...').start()

    const report = await migrateImportEntriesLocalImages(posts, {
        sourceDir,
        dryRun,
        uploadPrefix: 'migrations/image/',
        authorizeDirectUpload: dryRun
            ? undefined
            : async (payload) => {
                if (!client) {
                    throw new Error('API client is unavailable for image upload')
                }

                const response = await client.authorizeDirectUpload(payload)
                return response.data
            },
    })

    spinner.succeed(chalk.green('Local image migration finished'))
    displayImageMigrationSummary(report)

    return report
}

async function runImport(source: string, options: ImportCommandOptions) {
    const { apiUrl, apiKey, dryRun, verbose, reportFile, confirmPathAliases, uploadImages, format } = options
    const concurrency = Number.parseInt(String(options.concurrency), 10)
    const parser = getParser(format)

    if (!apiKey && !dryRun) {
        console.error(chalk.red('Error: --api-key is required (unless using --dry-run)'))
        process.exitCode = 1
        return
    }

    const sourceDir = resolve(process.cwd(), source)
    const formatLabel = format || 'hexo'
    const resume = Boolean(options.resume)
    displayImportHeader({
        apiUrl,
        concurrency,
        dryRun,
        formatLabel,
        maxRetries: options.maxRetries,
        rateLimit: options.rateLimit,
        sourceDir,
        uploadImages,
    })

    const { state: initialState, stateFile } = await prepareImportState(sourceDir, options, dryRun)

    const spinner = ora(`Scanning and parsing ${formatLabel} files...`).start()
    try {
        const posts = await parser.parse(sourceDir, verbose)
        spinner.succeed(chalk.green(`Found ${posts.length} posts`))

        if (posts.length === 0) {
            console.log(chalk.yellow('\n⚠️  No posts found. Please check the source directory.'))
            process.exitCode = 0
            return
        }

        if (verbose) {
            displayParsedPosts(posts)
        }

        const rateLimiterOptions = {
            rps: Number.parseInt(String(options.rateLimit), 10) || 3,
            concurrency: Number.parseInt(String(options.concurrency), 10) || 3,
            maxRetries: Number.parseInt(String(options.maxRetries), 10) || 3,
        }
        const client = apiKey ? new MomeiApiClient(apiUrl, apiKey, rateLimiterOptions) : null
        const imageMigrationReport = uploadImages
            ? await runImageMigration(posts, { client, dryRun, sourceDir })
            : null

        if (!apiKey && dryRun) {
            console.log(chalk.yellow('\n⚠️  Dry run completed with local parsing only. Provide --api-key for alias validation and conflict checks.'))
            process.exitCode = 0
            return
        }

        const activeClient = client || new MomeiApiClient(apiUrl, apiKey!, rateLimiterOptions)
        const validationSpinner = ora('Validating import path aliases...').start()
        const candidates = await validateImportCandidates(activeClient, posts, concurrency)
        validationSpinner.succeed(chalk.green(`Validated ${candidates.length} posts`))

        const executionPlan = buildImportExecutionPlan(candidates, { confirmPathAliases })
        displayImportValidationSummary(executionPlan)
        await maybeWriteImportReport(
            buildImportReport({ dryRun, executionPlan, imageMigrationReport }),
            reportFile,
        )

        if (dryRun) {
            console.log(chalk.yellow('\n✓ Dry run completed. No posts were imported.'))
            process.exitCode = 0
            return
        }

        console.log(chalk.blue('\n📤 Importing posts to Momei...\n'))

        const entryMeta = buildEntryMeta(posts)
        let nextState = markValidationSkipped(initialState, executionPlan.items, entryMeta)

        let importablePosts = executionPlan.items
            .filter((item) => item.action === 'import')
            .map((item) => ({
                file: item.file,
                post: {
                    ...item.request,
                    confirmPathAliases,
                },
            }))

        let resumeSkipped = 0

        if (resume) {
            const filtered = applyResumeFilter(importablePosts, entryMeta, nextState)
            importablePosts = filtered.entries
            resumeSkipped = filtered.skipped
        }

        if (resumeSkipped > 0) {
            console.log(chalk.gray(`↷ 跳过 ${resumeSkipped} 篇已成功且内容未变的文章（--resume）`))
        }

        if (importablePosts.length === 0) {
            if (!dryRun) {
                await persistImportState(stateFile, nextState)
            }

            if (resumeSkipped > 0) {
                console.log(chalk.green('\n✓ 没有需要重新导入的文章（全部已成功且内容未变）\n'))
            } else {
                console.log(chalk.yellow('No posts passed validation. Nothing was imported.'))
            }
            process.exitCode = 0
            return
        }

        const stats: ImportStats = {
            total: importablePosts.length,
            success: 0,
            failed: 0,
            skipped: executionPlan.summary.skipped + resumeSkipped,
            results: [],
        }

        let stateWriter: ReturnType<typeof createImportStateWriter> | null = null

        if (!dryRun) {
            nextState = markPendingEntries(nextState, importablePosts, entryMeta)
            const persisted = await persistImportState(stateFile, nextState)
            stateWriter = persisted
                ? createImportStateWriter(stateFile, nextState, (error) => {
                    const reason = error instanceof Error ? error.message : String(error)
                    console.warn(chalk.yellow(`⚠️  状态文件写入失败（继续导入）：${reason}`))
                })
                : null
        }

        const progressSpinner = ora('Importing...').start()

        const results = await activeClient.importPosts(importablePosts, {
            concurrency,
            onProgress: (_current: number, total: number, result: ImportResult) => {
                progressSpinner.text = `Importing... (${stats.success + stats.failed + 1}/${total})`

                if (result.success) {
                    stats.success += 1
                    if (verbose) {
                        console.log(chalk.green(`  ✓ ${result.file} → Post ID: ${result.postId}`))
                    }
                } else {
                    stats.failed += 1
                    if (verbose) {
                        console.log(chalk.red(`  ✗ ${result.file} → Error: ${result.error}`))
                    }
                }

                const meta = entryMeta.get(result.file)

                if (meta) {
                    stateWriter?.record({
                        ...meta,
                        error: result.success ? undefined : result.error,
                        postId: result.postId,
                        status: result.success ? 'success' : 'failed',
                    })
                }
            },
        })

        progressSpinner.stop()
        await stateWriter?.flush()
        stats.results = results

        displaySummary(stats)
    } catch (error) {
        spinner.fail(chalk.red('Failed to parse files'))

        if (error instanceof Error) {
            console.error(chalk.red(`\nError: ${error.message}`))
            if (verbose && error.stack) {
                console.error(chalk.gray(error.stack))
            }
        }

        process.exitCode = 1
    }
}

export function registerImportCommand(cli: CAC) {
    cli
        .command('import <source>', 'Import posts from a source directory to Momei')
        .option('--format <format>', 'Source format (hexo, hugo, wordpress, or jekyll)', { default: 'hexo' })
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .option('--dry-run', 'Dry run mode (parse files without importing)', { default: false })
        .option('--upload-images', 'Upload local markdown/cover images through direct upload auth before import', { default: false })
        .option('--report-file <file>', 'Save the validation/import report to a file')
        .option('--confirm-path-aliases', 'Approve fallback or repaired path aliases returned by validation', { default: false })
        .option('--verbose', 'Verbose output', { default: false })
        .option('--rate-limit <num>', 'Max requests per second (prevents 429)', { default: 3 })
        .option('--max-retries <num>', 'Max retries on 429 rate limit errors', { default: 3 })
        .option('--concurrency <num>', 'Number of concurrent imports', { default: 3 })
        .option('--resume', 'Resume a previous import: skip posts already imported with unchanged content', { default: false })
        .option('--state-file <file>', `Migration state file (default: <source>/${DEFAULT_IMPORT_STATE_FILE})`)
        .option('--clean-state', 'Clear the migration state file before running (ignored with --dry-run)', { default: false })
        .action(async (source: string, options: ImportCommandOptions) => {
            await runImport(source, options)
        })
}
