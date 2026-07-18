import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CAC } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import type { MomeiImportPostRequest } from '@momei-blog/api-client'
import { buildImportExecutionPlan, type CliImportValidationCandidate } from './import-validation'
import { migrateImportEntriesLocalImages, type LocalImageMigrationReport } from './import-image-migration'
import { parseHexoFiles } from './parser'
import { MomeiApiClient } from './api-client'
import type {
    ImportResult,
    ImportStats,
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
}

function buildImportRequest(entry: Awaited<ReturnType<typeof parseHexoFiles>>[number]): MomeiImportPostRequest {
    return {
        ...entry.post,
        slug: typeof entry.frontMatter.slug === 'string' ? entry.frontMatter.slug : undefined,
        abbrlink: typeof entry.frontMatter.abbrlink === 'string' ? entry.frontMatter.abbrlink : undefined,
        permalink: typeof entry.frontMatter.permalink === 'string' ? entry.frontMatter.permalink : undefined,
        sourceFile: entry.relativeFile,
    }
}

async function validateImportCandidates(
    client: MomeiApiClient,
    entries: Awaited<ReturnType<typeof parseHexoFiles>>,
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
        process.exit(1)
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

async function runImport(source: string, options: ImportCommandOptions) {
    const { apiUrl, apiKey, dryRun, verbose, reportFile, confirmPathAliases, uploadImages } = options
    const concurrency = Number.parseInt(String(options.concurrency), 10)

    if (!apiKey && !dryRun) {
        console.error(chalk.red('Error: --api-key is required (unless using --dry-run)'))
        process.exit(1)
    }

    const sourceDir = resolve(process.cwd(), source)
    console.log(chalk.blue('\n🚀 Momei Migration Tool\n'))
    console.log(chalk.gray(`Source: ${sourceDir}`))
    console.log(chalk.gray(`API URL: ${apiUrl}`))
    console.log(chalk.gray(`Dry Run: ${dryRun ? 'Yes' : 'No'}`))
    console.log(chalk.gray(`Upload Local Images: ${uploadImages ? 'Yes' : 'No'}`))
    console.log(chalk.gray(`Concurrency: ${concurrency}\n`))

    const spinner = ora('Scanning and parsing Hexo files...').start()
    try {
        const posts = await parseHexoFiles(sourceDir, verbose)
        spinner.succeed(chalk.green(`Found ${posts.length} posts`))

        if (posts.length === 0) {
            console.log(chalk.yellow('\n⚠️  No posts found. Please check the source directory.'))
            process.exit(0)
        }

        if (verbose) {
            console.log(chalk.gray('\nParsed posts:'))
            posts.forEach(({ file, post }) => {
                console.log(chalk.gray(`  - ${post.title} (${file})`))
            })
        }

        const client = apiKey ? new MomeiApiClient(apiUrl, apiKey) : null
        let imageMigrationReport: LocalImageMigrationReport | null = null

        if (uploadImages) {
            const imageSpinner = ora(dryRun
                ? 'Scanning local image references (dry run)...'
                : 'Uploading local images and rewriting references...').start()

            imageMigrationReport = await migrateImportEntriesLocalImages(posts, {
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

            imageSpinner.succeed(chalk.green('Local image migration finished'))
            displayImageMigrationSummary(imageMigrationReport)
        }

        if (!apiKey && dryRun) {
            console.log(chalk.yellow('\n⚠️  Dry run completed with local parsing only. Provide --api-key for alias validation and conflict checks.'))
            process.exit(0)
        }

        const activeClient = client || new MomeiApiClient(apiUrl, apiKey!)
        const validationSpinner = ora('Validating import path aliases...').start()
        const candidates = await validateImportCandidates(activeClient, posts, concurrency)
        validationSpinner.succeed(chalk.green(`Validated ${candidates.length} posts`))

        const executionPlan = buildImportExecutionPlan(candidates, { confirmPathAliases })
        displayImportValidationSummary(executionPlan)
        await maybeWriteImportReport({
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
        }, reportFile)

        if (dryRun) {
            console.log(chalk.yellow('\n✓ Dry run completed. No posts were imported.'))
            process.exit(0)
        }

        console.log(chalk.blue('\n📤 Importing posts to Momei...\n'))

        const importablePosts = executionPlan.items
            .filter((item) => item.action === 'import')
            .map((item) => ({
                file: item.file,
                post: {
                    ...item.request,
                    confirmPathAliases,
                },
            }))

        if (importablePosts.length === 0) {
            console.log(chalk.yellow('No posts passed validation. Nothing was imported.'))
            process.exit(0)
        }

        const stats: ImportStats = {
            total: importablePosts.length,
            success: 0,
            failed: 0,
            skipped: executionPlan.summary.skipped,
            results: [],
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
            },
        })

        progressSpinner.stop()
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

        process.exit(1)
    }
}

export function registerImportCommand(cli: CAC) {
    cli
        .command('import <source>', 'Import posts from Hexo to Momei')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .option('--dry-run', 'Dry run mode (parse files without importing)', { default: false })
        .option('--upload-images', 'Upload local markdown/cover images through direct upload auth before import', { default: false })
        .option('--report-file <file>', 'Save the validation/import report to a file')
        .option('--confirm-path-aliases', 'Approve fallback or repaired path aliases returned by validation', { default: false })
        .option('--verbose', 'Verbose output', { default: false })
        .option('--concurrency <num>', 'Number of concurrent imports', { default: 3 })
        .action(async (source: string, options: ImportCommandOptions) => {
            await runImport(source, options)
        })
}
