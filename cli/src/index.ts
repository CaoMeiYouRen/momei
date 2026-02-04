#!/usr/bin/env node
import { resolve } from 'node:path'
import { cac } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import { parseHexoFiles } from './parser.js'
import { MomeiApiClient } from './api-client.js'
import type { ImportStats, ImportResult } from './types.js'

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
            concurrency: Number.parseInt(concurrency as any, 10),
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

        displaySummary(stats, verbose)
    } catch (error: any) {
        spinner.fail(chalk.red('Failed to parse files'))
        console.error(chalk.red(`\nError: ${error.message}`))
        if (verbose && error.stack) {
            console.error(chalk.gray(error.stack))
        }
        process.exit(1)
    }
}

function displaySummary(stats: ImportStats, verbose: boolean) {
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
