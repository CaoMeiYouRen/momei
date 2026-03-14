#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { cac } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import { parseHexoFiles } from './parser'
import { MomeiApiClient } from './api-client'
import { buildLinkGovernanceRequest, parseCliLinkGovernanceScopes } from './link-governance'
import type {
    CliAutomationTaskStatusResponse,
    CliLinkGovernanceMode,
    CliLinkGovernanceReportData,
    CliTranslatePostRequest,
    ImportStats,
    ImportResult,
} from './types'

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

cli
    .command('ai suggest-titles <postId>', 'Suggest post titles from an existing post')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .action(async (postId: string, options: any) => {
        const client = createAutomationClient(options)
        const post = await fetchPostForAutomation(client, postId)
        const response = await client.suggestTitles({
            content: typeof post.content === 'string' ? post.content : '',
            language: typeof post.language === 'string' ? post.language : 'zh-CN',
        })

        console.log(chalk.blue('\n📝 Suggested Titles\n'))
        response.data.forEach((title, index) => {
            console.log(chalk.gray(`${index + 1}. ${title}`))
        })
    })

cli
    .command('ai recommend-tags <postId>', 'Recommend tags for an existing post')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .action(async (postId: string, options: any) => {
        const client = createAutomationClient(options)
        const post = await fetchPostForAutomation(client, postId)
        const response = await client.recommendTags({
            content: typeof post.content === 'string' ? post.content : '',
            existingTags: extractExistingTagNames(post),
            language: typeof post.language === 'string' ? post.language : 'zh-CN',
        })

        console.log(chalk.blue('\n🏷️ Recommended Tags\n'))
        console.log(response.data.join(', '))
    })

cli
    .command('ai recommend-categories <postId>', 'Recommend categories for an existing post in a target language')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .option('--target-language <locale>', 'Target locale code (required)')
    .option('--source-language <locale>', 'Source locale code override')
    .option('--limit <number>', 'Maximum number of category candidates', { default: 5 })
    .action(async (postId: string, options: any) => {
        if (!options.targetLanguage) {
            console.error(chalk.red('Error: --target-language is required'))
            process.exit(1)
        }

        const client = createAutomationClient(options)
        const response = await client.recommendCategories({
            postId,
            targetLanguage: options.targetLanguage,
            sourceLanguage: options.sourceLanguage,
            limit: Number.parseInt(String(options.limit), 10),
        })

        console.log(chalk.blue('\n🗂️ Recommended Categories\n'))
        if (response.data.candidates.length === 0) {
            console.log(chalk.yellow('No matching existing categories were found.'))
        }

        response.data.candidates.forEach((candidate, index) => {
            console.log(chalk.gray(`${index + 1}. ${candidate.name} (${candidate.id}) [${candidate.reason}]`))
        })

        if (response.data.proposedCategory) {
            console.log(chalk.gray(`\nProposed category: ${response.data.proposedCategory.name} (${response.data.proposedCategory.slug})`))
        }
    })

cli
    .command('ai translate-post <postId>', 'Translate an existing post into another language and backfill translation bindings')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .option('--target-language <locale>', 'Target locale code (required)')
    .option('--source-language <locale>', 'Source locale code override')
    .option('--target-post-id <id>', 'Continue or overwrite an existing translated post')
    .option('--scopes <scopes>', 'Comma separated scopes', { default: 'title,content,summary,category,tags,coverImage,audio' })
    .option('--target-status <status>', 'Target post status: draft or pending', { default: 'draft' })
    .option('--slug-strategy <strategy>', 'Slug strategy: source, translate, or ai', { default: 'source' })
    .option('--category-strategy <strategy>', 'Category strategy: cluster or suggest', { default: 'cluster' })
    .option('--preview', 'Create a reviewable preview without writing the translated post', { default: false })
    .option('--confirm-preview-task <id>', 'Apply a previously generated preview task')
    .option('--approved-slug <slug>', 'Override slug when applying a preview')
    .option('--approved-category-id <id>', 'Override category when applying a preview')
    .option('--wait', 'Wait for task completion', { default: false })
    .action(async (postId: string, options: any) => {
        if (!options.targetLanguage) {
            console.error(chalk.red('Error: --target-language is required'))
            process.exit(1)
        }

        let confirmationMode: CliTranslatePostRequest['confirmationMode'] = 'auto'
        if (options.confirmPreviewTask) {
            confirmationMode = 'confirmed'
        } else if (options.preview) {
            confirmationMode = 'require'
        }

        const client = createAutomationClient(options)
        const payload: CliTranslatePostRequest = {
            sourcePostId: postId,
            targetLanguage: options.targetLanguage,
            sourceLanguage: options.sourceLanguage,
            targetPostId: options.confirmPreviewTask ? undefined : options.targetPostId,
            targetStatus: options.targetStatus,
            scopes: parseCsvList(options.scopes) as CliTranslatePostRequest['scopes'],
            slugStrategy: options.slugStrategy,
            categoryStrategy: options.categoryStrategy,
            confirmationMode,
            previewTaskId: options.confirmPreviewTask,
            approvedSlug: options.approvedSlug,
            approvedCategoryId: options.approvedCategoryId,
        }

        const response = await client.translatePost(payload)
        displayTaskCreated('Translate Post', response.data)

        if (!options.wait) {
            return
        }

        const task = await waitForAutomationTask(client, response.data.taskId, 'Translating post')
        displayTaskCompletion(task)
    })

cli
    .command('ai generate-cover <postId>', 'Generate a cover image and auto-attach it to the post')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .option('--prompt <text>', 'Prompt used to generate the image')
    .option('--model <model>', 'Image model override')
    .option('--size <size>', 'Output size')
    .option('--aspect-ratio <ratio>', 'Aspect ratio, for example 16:9')
    .option('--quality <quality>', 'standard or hd', { default: 'standard' })
    .option('--style <style>', 'vivid or natural', { default: 'vivid' })
    .option('--wait', 'Wait for task completion', { default: false })
    .action(async (postId: string, options: any) => {
        if (!options.prompt) {
            console.error(chalk.red('Error: --prompt is required'))
            process.exit(1)
        }

        const client = createAutomationClient(options)
        const response = await client.generateCoverImage({
            postId,
            prompt: options.prompt,
            model: options.model,
            size: options.size,
            aspectRatio: options.aspectRatio,
            quality: options.quality,
            style: options.style,
            n: 1,
        })
        displayTaskCreated('Generate Cover', response.data)

        if (!options.wait) {
            return
        }

        const task = await waitForAutomationTask(client, response.data.taskId, 'Generating cover image')
        displayTaskCompletion(task)
    })

cli
    .command('ai generate-audio <postId>', 'Generate TTS or podcast audio and auto-attach it to the post')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .option('--voice <voice>', 'Voice ID (required)')
    .option('--provider <provider>', 'TTS provider override')
    .option('--mode <mode>', 'speech or podcast', { default: 'speech' })
    .option('--model <model>', 'Model override')
    .option('--script <text>', 'Override text/script content')
    .option('--wait', 'Wait for task completion', { default: false })
    .action(async (postId: string, options: any) => {
        if (!options.voice) {
            console.error(chalk.red('Error: --voice is required'))
            process.exit(1)
        }

        const client = createAutomationClient(options)
        const response = await client.createTTSTask({
            postId,
            provider: options.provider,
            mode: options.mode,
            voice: options.voice,
            model: options.model,
            script: options.script,
        })
        displayTaskCreated('Generate Audio', response.data)

        if (!options.wait) {
            return
        }

        const task = await waitForAutomationTask(client, response.data.taskId, 'Generating audio')
        displayTaskCompletion(task)
    })

cli
    .command('ai task <taskId>', 'Inspect an automation task by ID')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .action(async (taskId: string, options: any) => {
        const client = createAutomationClient(options)
        const task = await client.getAITask(taskId)
        console.log(JSON.stringify(task.data, null, 2))
    })

cli
    .command('publish <postId>', 'Publish an existing post through the external API')
    .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
    .option('--api-key <key>', 'Momei API Key (required)')
    .action(async (postId: string, options: any) => {
        const client = createAutomationClient(options)
        const response = await client.publishPost(postId)
        console.log(JSON.stringify(response.data, null, 2))
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

function createAutomationClient(options: { apiUrl?: string, apiKey?: string }) {
    if (!options.apiKey) {
        console.error(chalk.red('Error: --api-key is required'))
        process.exit(1)
    }

    return new MomeiApiClient(options.apiUrl || 'http://localhost:3000', options.apiKey)
}

async function fetchPostForAutomation(client: MomeiApiClient, postId: string) {
    const response = await client.getPost(postId)
    return response.data
}

function extractExistingTagNames(post: Record<string, unknown>) {
    const tags = Array.isArray(post.tags) ? post.tags : []
    return tags
        .map((tag) => {
            if (typeof tag === 'string') {
                return tag
            }

            if (tag && typeof tag === 'object' && typeof (tag as { name?: unknown }).name === 'string') {
                return (tag as { name: string }).name
            }

            return null
        })
        .filter((tag): tag is string => Boolean(tag))
}

function displayTaskCreated(label: string, data: { taskId: string, status: string }) {
    console.log(chalk.blue(`\n⚙️ ${label}\n`))
    console.log(chalk.gray(`Task ID: ${data.taskId}`))
    console.log(chalk.gray(`Status: ${data.status}\n`))
}

function displayTaskCompletion(task: CliAutomationTaskStatusResponse) {
    console.log(chalk.blue('\n✅ Task Result\n'))
    console.log(JSON.stringify(task, null, 2))

    const result = task.result && typeof task.result === 'object' ? task.result : null
    if (result?.needsConfirmation === true) {
        console.log(chalk.yellow('\nThis task generated a preview. Re-run with --confirm-preview-task <taskId> to apply it.'))
    }
}

async function waitForAutomationTask(client: MomeiApiClient, taskId: string, label: string) {
    const spinner = ora(`${label}...`).start()

    while (true) {
        const response = await client.getAITask(taskId)
        const task = response.data
        spinner.text = `${label}... ${task.progress}% (${task.status})`

        if (task.status === 'completed') {
            spinner.succeed(`${label} completed`)
            return task
        }

        if (task.status === 'failed') {
            spinner.fail(`${label} failed`)
            if (task.error) {
                console.error(chalk.red(task.error))
            }
            process.exit(1)
        }

        await new Promise((done) => setTimeout(done, 3000))
    }
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
