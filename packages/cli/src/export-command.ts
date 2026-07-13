/**
 * CLI export command: momei export <output-dir>
 *
 * Exports blog posts from Momei to local files in Markdown or JSON format.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CAC } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import { MomeiApiClient } from './api-client'
import { formatPostToMarkdown, formatPostToJson, getPostFilename } from './post-formatter'

// ===== Types =====

interface ExportCommandCliOptions {
    apiUrl: string
    apiKey?: string
    language?: string
    status?: string
    category?: string
    limit?: number
    format?: string
    verbose?: boolean
}

interface ExportRecord {
    file: string
    success: boolean
    error?: string
}

interface ExportStats {
    total: number
    success: number
    failed: number
    results: ExportRecord[]
}

// ===== Helpers =====

/**
 * Type-safe field extractor for unknown post data.
 * Returns typed value or fallback if the field is not the expected type.
 */
function stringField(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
}

function stringOrNull(value: unknown): string | null | undefined {
    if (value === null || value === undefined) {
        return value as null | undefined
    }
    return typeof value === 'string' ? value : undefined
}

function stringArrayOrUndefined(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
        return undefined
    }
    return value.filter((v): v is string => typeof v === 'string')
}

function coerceString(value: unknown): string {
    if (typeof value === 'string') {
        return value
    }
    if (value === null || value === undefined) {
        return ''
    }
    return String(value)
}

function displaySummary(stats: ExportStats): void {
    console.log(chalk.blue('\n📊 Export Summary:\n'))
    console.log(chalk.green(`  ✓ Success: ${stats.success}`))
    console.log(chalk.red(`  ✗ Failed: ${stats.failed}`))
    console.log(chalk.gray(`  Total: ${stats.total}\n`))

    if (stats.failed > 0) {
        console.log(chalk.red('Failed exports:'))
        for (const result of stats.results) {
            if (!result.success) {
                console.log(chalk.red(`  - ${result.file}: ${result.error}`))
            }
        }
        console.log('')
    }

    if (stats.success === stats.total) {
        console.log(chalk.green('🎉 All posts exported successfully!\n'))
    } else if (stats.success > 0) {
        console.log(chalk.yellow('⚠️  Some posts failed to export. Check errors above.\n'))
    } else {
        console.log(chalk.red('❌ All posts failed to export. Check API key and connection.\n'))
        process.exit(1)
    }
}

// ===== Main =====

async function runExport(outputDir: string, options: ExportCommandCliOptions): Promise<void> {
    const { apiUrl, apiKey, language, status, category, limit, format: formatOption, verbose } = options

    if (!apiKey) {
        console.error(chalk.red('Error: --api-key is required'))
        process.exit(1)
    }

    const outputPath = resolve(process.cwd(), outputDir)
    const client = new MomeiApiClient(apiUrl, apiKey)
    const isJson = formatOption === 'json'
    const extension = isJson ? '.json' : '.md'

    console.log(chalk.blue('\n📤 Momei Export Tool\n'))
    console.log(chalk.gray(`Output directory: ${outputPath}`))
    console.log(chalk.gray(`Format: ${formatOption || 'markdown'}`))
    if (language) {
        console.log(chalk.gray(`Language filter: ${language}`))
    }
    if (status) {
        console.log(chalk.gray(`Status filter: ${status}`))
    }
    if (category) {
        console.log(chalk.gray(`Category filter: ${category}`))
    }
    if (limit) {
        console.log(chalk.gray(`Limit: ${limit}`))
    }
    console.log('')

    // ---- Step 1: Fetch post list ----
    const listQuery: Record<string, unknown> = {
        page: 1,
        limit: limit || 100,
    }
    if (language) {
        listQuery.language = language
    }
    if (status) {
        listQuery.status = status
    }
    if (category) {
        listQuery.category = category
    }

    const listSpinner = ora('Fetching post list...').start()
    let postsSummary: { items: unknown[], total: number, page: number, limit: number }

    try {
        const listResponse = await client.listPosts(listQuery)
        postsSummary = listResponse.data
    } catch (error: unknown) {
        listSpinner.fail(chalk.red('Failed to fetch post list'))
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(chalk.red(`\nError: ${errorMessage}`))
        process.exit(1)
    }

    const items = postsSummary.items as Array<Record<string, unknown>>
    listSpinner.succeed(chalk.green(`Found ${postsSummary.total} posts (showing ${items.length})`))

    if (items.length === 0) {
        console.log(chalk.yellow('\n⚠️  No posts match the criteria. Nothing to export.\n'))
        return
    }

    if (verbose) {
        console.log(chalk.gray('\nPost list:'))
        for (const item of items) {
            console.log(chalk.gray(`  - ${String(item.title || 'untitled')} (ID: ${String(item.id)})`))
        }
    }

    // ---- Step 2: Create output directory ----
    await mkdir(outputPath, { recursive: true })

    // ---- Step 3: Fetch each post's detail and write files ----
    const spinner = ora('Exporting posts...').start()
    const stats: ExportStats = { total: items.length, success: 0, failed: 0, results: [] }

    for (const [index, item] of items.entries()) {
        const postId = String(item.id)
        spinner.text = `Exporting... (${index + 1}/${items.length})`

        try {
            const detailResponse = await client.getPost(postId)
            const post = detailResponse.data as Record<string, unknown>

            // Normalise to MomeiPost shape for the formatter (with type guards)
            const normalised: import('@momei-blog/api-client').MomeiPost = {
                title: coerceString(post.title),
                content: coerceString(post.content),
                slug: stringField(post.slug),
                summary: stringOrNull(post.summary),
                coverImage: stringOrNull(post.coverImage),
                language: stringField(post.language),
                translationId: stringOrNull(post.translationId),
                category: stringOrNull(post.category),
                tags: stringArrayOrUndefined(post.tags),
                copyright: stringOrNull(post.copyright),
                status: stringField(post.status) as import('@momei-blog/api-client').MomeiPostStatus | undefined,
                createdAt: stringField(post.createdAt),
                metadata: post.metadata as Record<string, unknown> | null | undefined,
            }

            const output = isJson ? formatPostToJson(normalised) : formatPostToMarkdown(normalised)
            const filename = getPostFilename(normalised, extension)
            const filePath = resolve(outputPath, filename)

            await writeFile(filePath, output, 'utf-8')
            stats.success += 1
            stats.results.push({ file: filename, success: true })

            if (verbose) {
                console.log(chalk.green(`  ✓ ${filename}`))
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            stats.failed += 1
            const filename = `post_${postId}${extension}`
            stats.results.push({ file: filename, success: false, error: errorMessage })

            if (verbose) {
                console.log(chalk.red(`  ✗ ${filename}: ${errorMessage}`))
            }
        }
    }

    spinner.stop()
    displaySummary(stats)
}

// ===== Registration =====

export function registerExportCommand(cli: CAC): void {
    cli
        .command('export <output-dir>', 'Export posts from Momei to local files')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .option('--language <lang>', 'Filter by language (e.g. zh-CN, en-US)')
        .option('--status <status>', 'Filter by status (draft, published, etc.)')
        .option('--category <category>', 'Filter by category slug or ID')
        .option('--limit <num>', 'Max number of posts to export')
        .option('--format <format>', 'Output format: markdown or json', { default: 'markdown' })
        .option('--verbose', 'Verbose output', { default: false })
        .action(async (outputDir: string, options: ExportCommandCliOptions) => {
            await runExport(outputDir, options)
        })
}
