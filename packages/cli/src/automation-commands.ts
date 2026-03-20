import type { CAC } from 'cac'
import chalk from 'chalk'
import {
    createAutomationClient,
    displayTaskCompletion,
    displayTaskCreated,
    extractExistingTagNames,
    fetchPostForAutomation,
    parseCsvList,
    waitForAutomationTask,
} from './cli-shared'
import type { CliTranslatePostRequest } from './types'

interface ApiOptions {
    apiUrl?: string
    apiKey?: string
}

interface RecommendCategoriesOptions extends ApiOptions {
    targetLanguage?: string
    sourceLanguage?: string
    limit?: number | string
}

interface TranslatePostOptions extends ApiOptions {
    targetLanguage?: string
    sourceLanguage?: string
    targetPostId?: string
    scopes?: string
    targetStatus?: 'draft' | 'pending'
    slugStrategy?: CliTranslatePostRequest['slugStrategy']
    categoryStrategy?: CliTranslatePostRequest['categoryStrategy']
    preview?: boolean
    confirmPreviewTask?: string
    approvedSlug?: string
    approvedCategoryId?: string
    wait?: boolean
}

interface GenerateCoverOptions extends ApiOptions {
    prompt?: string
    model?: string
    size?: string
    aspectRatio?: string
    quality?: 'standard' | 'hd'
    style?: 'vivid' | 'natural'
    wait?: boolean
}

interface GenerateAudioOptions extends ApiOptions {
    voice?: string
    provider?: string
    mode?: 'speech' | 'podcast'
    model?: string
    script?: string
    wait?: boolean
}

function assertRequiredOption(value: string | undefined, flagName: string) {
    if (value) {
        return value
    }

    console.error(chalk.red(`Error: ${flagName} is required`))
    process.exit(1)
}

function registerSuggestionCommands(cli: CAC) {
    cli
        .command('ai suggest-titles <postId>', 'Suggest post titles from an existing post')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .action(async (postId: string, options: ApiOptions) => {
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
        .action(async (postId: string, options: ApiOptions) => {
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
}

function registerRecommendationCommands(cli: CAC) {
    cli
        .command('ai recommend-categories <postId>', 'Recommend categories for an existing post in a target language')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .option('--target-language <locale>', 'Target locale code (required)')
        .option('--source-language <locale>', 'Source locale code override')
        .option('--limit <number>', 'Maximum number of category candidates', { default: 5 })
        .action(async (postId: string, options: RecommendCategoriesOptions) => {
            const client = createAutomationClient(options)
            const targetLanguage = assertRequiredOption(options.targetLanguage, '--target-language')
            const response = await client.recommendCategories({
                postId,
                targetLanguage,
                sourceLanguage: options.sourceLanguage,
                limit: Number.parseInt(String(options.limit ?? 5), 10),
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
}

function registerTranslationCommands(cli: CAC) {
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
        .action(async (postId: string, options: TranslatePostOptions) => {
            const targetLanguage = assertRequiredOption(options.targetLanguage, '--target-language')

            let confirmationMode: CliTranslatePostRequest['confirmationMode'] = 'auto'
            if (options.confirmPreviewTask) {
                confirmationMode = 'confirmed'
            } else if (options.preview) {
                confirmationMode = 'require'
            }

            const client = createAutomationClient(options)
            const payload: CliTranslatePostRequest = {
                sourcePostId: postId,
                targetLanguage,
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
}

function registerGenerationCommands(cli: CAC) {
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
        .action(async (postId: string, options: GenerateCoverOptions) => {
            const client = createAutomationClient(options)
            const prompt = assertRequiredOption(options.prompt, '--prompt')
            const response = await client.generateCoverImage({
                postId,
                prompt,
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
        .action(async (postId: string, options: GenerateAudioOptions) => {
            const client = createAutomationClient(options)
            const voice = assertRequiredOption(options.voice, '--voice')
            const response = await client.createTTSTask({
                postId,
                provider: options.provider,
                mode: options.mode,
                voice,
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
}

function registerTaskCommands(cli: CAC) {
    cli
        .command('ai task <taskId>', 'Inspect an automation task by ID')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .action(async (taskId: string, options: ApiOptions) => {
            const client = createAutomationClient(options)
            const task = await client.getAITask(taskId)
            console.log(JSON.stringify(task.data, null, 2))
        })

    cli
        .command('publish <postId>', 'Publish an existing post through the external API')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .action(async (postId: string, options: ApiOptions) => {
            const client = createAutomationClient(options)
            const response = await client.publishPost(postId)
            console.log(JSON.stringify(response.data, null, 2))
        })
}

export function registerAutomationCommands(cli: CAC) {
    registerSuggestionCommands(cli)
    registerRecommendationCommands(cli)
    registerTranslationCommands(cli)
    registerGenerationCommands(cli)
    registerTaskCommands(cli)
}

