#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cac } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import { parseHexoFiles } from './parser'
import { MomeiApiClient } from './api-client'
import { buildLinkGovernanceRequest, parseCliLinkGovernanceScopes } from './link-governance'
import type { CliLinkGovernanceMode, CliLinkGovernanceReportData, ImportStats, ImportResult } from './types'

const cli = cac('momei')

cli
    .command('import <source>', 'Import posts from Hexo to Momei')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .option('--dry-run', 'Dry run mode (parse files without importing)', { default: false })
    .option('--verbose', 'Verbose output', { default: false })
    .option('--concurrency <num>', 'Number of concurrent imports', { default: 3 })
    .action(async (source: string, options: any) => {
        const { apiUrl, apiKey, dryRun, verbose, concurrency } = options
        await runImport(source, { apiUrl, apiKey, dryRun, verbose, concurrency })
    })

cli
    .command('govern-links <source>', 'Generate mapping seeds and run migration link governance')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .option('--mode <mode>', 'Governance mode: dry-run or apply', { default: 'dry-run' })
    .option('--domains <domains>', 'Comma separated legacy domains')
    .option('--path-prefixes <prefixes>', 'Comma separated managed path prefixes')
    .option('--scopes <scopes>', 'Comma separated scopes', { default: 'asset-url,post-link,permalink-rule' })
    .option('--validation-mode <mode>', 'Validation mode: static or static+online', { default: 'static' })
    .option('--legacy-origin <url>', 'Legacy site origin used to generate absolute seeds')
    .option('--report-file <file>', 'Save the report to a file')
    .option('--retry-report-id <id>', 'Retry failed items from a previous report ID')
    .option('--allow-relative-links', 'Allow governance for relative content links', { default: false })
    .option('--skip-confirmation', 'Apply even when an item requires manual confirmation', { default: false })
    .option('--verbose', 'Verbose output', { default: false })
    .action(async (source: string, options: any) => {
        await runGovernLinks(source, {
            apiUrl: options.apiUrl,
            apiKey: options.apiKey,
            mode: options.mode,
            domains: options.domains,
            pathPrefixes: options.pathPrefixes,
            scopes: options.scopes,
            validationMode: options.validationMode,
            legacyOrigin: options.legacyOrigin,
            reportFile: options.reportFile,
            retryReportId: options.retryReportId,
            allowRelativeLinks: options.allowRelativeLinks,
            skipConfirmation: options.skipConfirmation,
            verbose: options.verbose,
        })
    })

async function runImport(source: string, options: { apiUrl: string, apiKey: string, dryRun: boolean, verbose: boolean, concurrency: number }) {
    const { apiUrl, apiKey, dryRun, verbose, concurrency } = options

    // 验证必需参数
    if (!apiKey && !dryRun) {
        console.error(chalk.red('Error: --api-key is required (unless using --dry-run)'))
        process.exit(1)
    }

    const sourceDir = resolve(process.cwd(), source)
    console.log(chalk.blue(`\n🚀 Momei Migration Tool\n`))
    console.log(chalk.gray(`Source: ${sourceDir}`))
    console.log(chalk.gray(`API URL: ${apiUrl}`))
    console.log(chalk.gray(`Dry Run: ${dryRun ? 'Yes' : 'No'}`))
    console.log(chalk.gray(`Concurrency: ${concurrency}\n`))

    // 解析 Hexo 文件
    const spinner = ora('Scanning and parsing Hexo files...').start()
    try {
        const posts = await parseHexoFiles(sourceDir, verbose)
        spinner.succeed(chalk.green(`Found ${posts.length} posts`))

        if (posts.length === 0) {
            console.log(chalk.yellow('\n⚠️  No posts found. Please check the source directory.'))
            process.exit(0)
        }

        // 显示解析结果摘要
        if (verbose) {
            console.log(chalk.gray('\nParsed posts:'))
            posts.forEach(({ file, post }) => {
                console.log(chalk.gray(`  - ${post.title} (${file})`))
            })
        }

        // Dry run 模式：只解析不导入
        if (dryRun) {
            console.log(chalk.yellow('\n✓ Dry run completed. No posts were imported.'))
            process.exit(0)
        }

        // 导入文章
        console.log(chalk.blue('\n📤 Importing posts to Momei...\n'))
        const client = new MomeiApiClient(apiUrl, apiKey)

        const stats: ImportStats = {
            total: posts.length,
            success: 0,
            failed: 0,
            skipped: 0,
            results: [],
        }

        const progressSpinner = ora('Importing...').start()

        const results = await client.importPosts(posts, {
            concurrency: Number.parseInt(String(concurrency), 10),
            onProgress: (current: number, total: number, result: ImportResult) => {
                progressSpinner.text = `Importing... (${current}/${total})`

                if (result.success) {
                    stats.success++
                    if (verbose) {
                        console.log(chalk.green(`  ✓ ${result.file} → Post ID: ${result.postId}`))
                    }
                } else {
                    stats.failed++
                    if (verbose) {
                        console.log(chalk.red(`  ✗ ${result.file} → Error: ${result.error}`))
                    }
                }
            },
        })

        progressSpinner.stop()
        stats.results = results

        displaySummary(stats)
    } catch (error: any) {
        spinner.fail(chalk.red('Failed to parse files'))
        console.error(chalk.red(`\nError: ${error.message}`))
        if (verbose && error.stack) {
            console.error(chalk.gray(error.stack))
        }
        process.exit(1)
    }
}

function parseCsvList(input?: string) {
    return input?.split(',').map((item) => item.trim()).filter(Boolean) || []
}

function displayGovernanceSummary(report: CliLinkGovernanceReportData) {
    console.log(chalk.blue('\n🧭 Link Governance Summary\n'))
    console.log(chalk.gray(`  Report ID: ${report.reportId}`))
    console.log(chalk.gray(`  Mode: ${report.mode}`))
    console.log(chalk.green(`  Resolved: ${report.summary.resolved}`))
    console.log(chalk.yellow(`  Rewritten: ${report.summary.rewritten}`))
    console.log(chalk.gray(`  Unchanged: ${report.summary.unchanged}`))
    console.log(chalk.yellow(`  Skipped: ${report.summary.skipped}`))
    console.log(chalk.red(`  Failed: ${report.summary.failed}`))
    console.log(chalk.magenta(`  Needs Confirmation: ${report.summary.needsConfirmation}\n`))
}

async function maybeWriteGovernanceReport(report: CliLinkGovernanceReportData, reportFile?: string) {
    if (!reportFile) {
        return
    }

    const outputPath = resolve(process.cwd(), reportFile)
    const payload = reportFile.endsWith('.md')
        ? report.markdown || JSON.stringify(report, null, 2)
        : JSON.stringify(report, null, 2)
    await writeFile(outputPath, payload, 'utf-8')
    console.log(chalk.gray(`Saved report to ${outputPath}`))
}

async function runGovernLinks(source: string, options: {
    apiUrl: string
    apiKey: string
    mode: CliLinkGovernanceMode
    domains?: string
    pathPrefixes?: string
    scopes?: string
    validationMode?: 'static' | 'static+online'
    legacyOrigin?: string
    reportFile?: string
    retryReportId?: string
    allowRelativeLinks?: boolean
    skipConfirmation?: boolean
    verbose?: boolean
}) {
    if (!options.apiKey) {
        console.error(chalk.red('Error: --api-key is required'))
        process.exit(1)
    }

    const sourceDir = resolve(process.cwd(), source)
    const spinner = ora('Scanning source files and generating governance seeds...').start()

    try {
        const entries = await parseHexoFiles(sourceDir, options.verbose)
        const request = buildLinkGovernanceRequest(entries, {
            scopes: parseCliLinkGovernanceScopes(parseCsvList(options.scopes)),
            domains: parseCsvList(options.domains),
            pathPrefixes: parseCsvList(options.pathPrefixes),
            validationMode: options.validationMode,
            allowRelativeLinks: options.allowRelativeLinks,
            retryFailuresFromReportId: options.retryReportId,
            skipConfirmation: options.skipConfirmation,
            legacyOrigin: options.legacyOrigin,
            reportFormat: options.reportFile?.endsWith('.md') ? 'markdown' : 'json',
        })

        spinner.succeed(chalk.green(`Generated ${request.seeds?.length || 0} mapping seeds from ${entries.length} files`))

        if (options.verbose && request.seeds && request.seeds.length > 0) {
            request.seeds.slice(0, 10).forEach((seed) => {
                console.log(chalk.gray(`  - ${seed.source} -> ${seed.targetRef.slug || seed.targetRef.id || 'unknown'}`))
            })
        }

        const client = new MomeiApiClient(options.apiUrl, options.apiKey)
        const response = options.mode === 'apply'
            ? await client.applyLinkGovernance(request)
            : await client.dryRunLinkGovernance(request)

        displayGovernanceSummary(response.data)
        await maybeWriteGovernanceReport(response.data, options.reportFile)
    } catch (error: any) {
        spinner.fail(chalk.red('Failed to execute link governance'))
        console.error(chalk.red(`\nError: ${error.message}`))
        if (options.verbose && error.stack) {
            console.error(chalk.gray(error.stack))
        }
        process.exit(1)
    }
}

function displaySummary(stats: ImportStats) {
    // 显示导入结果
    console.log(chalk.blue('\n📊 Import Summary:\n'))
    console.log(chalk.green(`  ✓ Success: ${stats.success}`))
    console.log(chalk.red(`  ✗ Failed: ${stats.failed}`))
    console.log(chalk.gray(`  Total: ${stats.total}\n`))

    // 显示失败的文件
    if (stats.failed > 0) {
        console.log(chalk.red('Failed imports:'))
        stats.results
            .filter((r) => !r.success)
            .forEach((r) => {
                console.log(chalk.red(`  - ${r.file}: ${r.error}`))
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

cli.help()
cli.version('1.0.0')

cli.parse()
