import { dataSource } from '@/server/database'
import { Post as PostEntity } from '@/server/entities/post'
import { formatPostToMarkdown } from '@/server/services/post-export'
import { getSetting } from '@/server/services/setting'
import logger from '@/server/utils/logger'
import {
    PostStatus,
    type Post,
    type PostDistributionFailureReason,
    type PostHexoRepositoryProvider,
    type PostHexoRepositorySyncState,
} from '@/types/post'
import { SettingKey } from '@/types/setting'
import { normalizeOptionalString, toBoolean } from '@/utils/shared/coerce'

export interface PostHexoRepositorySyncActor {
    currentUserId: string
    isAdmin: boolean
}

export interface DispatchPostHexoRepositorySyncCommand {
    operation: 'sync' | 'retry'
}

export interface HexoRepositorySyncConfig {
    provider: PostHexoRepositoryProvider
    owner: string
    repo: string
    branch: string
    postsDir: string
    accessToken: string
    siteUrl: string
}

export interface HexoRepositorySyncResult {
    state: PostHexoRepositorySyncState
}

interface RemoteFileInfo {
    sha: string | null
    htmlUrl: string | null
}

interface UpsertRemoteFileResult {
    sha: string | null
    htmlUrl: string | null
    mode: 'created' | 'updated'
}

interface ParsedProviderResponse {
    content?: {
        sha?: string
        html_url?: string
        download_url?: string
    }
    commit?: {
        sha?: string
    }
    sha?: string
    html_url?: string
    download_url?: string
    message?: string
    error?: string
}

interface FetchJsonOptions {
    method?: 'GET' | 'POST' | 'PUT'
    headers?: Record<string, string>
    body?: string
}

class HexoRepositorySyncRequestError extends Error {
    statusCode: number
    responseBody: unknown

    constructor(statusCode: number, message: string, responseBody: unknown) {
        super(message)
        this.name = 'HexoRepositorySyncRequestError'
        this.statusCode = statusCode
        this.responseBody = responseBody
    }
}

function normalizeProvider(value: unknown): PostHexoRepositoryProvider | null {
    if (value === 'github' || value === 'gitee') {
        return value
    }

    return null
}

function normalizeRepoPath(value: string) {
    return value
        .trim()
        .replace(/\\/gu, '/')
        .replace(/^\/+|\/+$/gu, '')
}

function buildFileName(post: Pick<Post, 'slug' | 'id'>) {
    const baseName = normalizeRepoPath(post.slug || post.id).replace(/\//gu, '-')
    return `${baseName || post.id}.md`
}

export function buildHexoRepositoryFilePath(post: Pick<Post, 'slug' | 'id' | 'language'>, postsDir: string) {
    const normalizedPostsDir = normalizeRepoPath(postsDir || 'source/_posts')
    const localeSegment = normalizeRepoPath(post.language || 'zh-CN')
    return `${normalizedPostsDir}/${localeSegment}/${buildFileName(post)}`
}

function buildContentsApiUrl(config: HexoRepositorySyncConfig, filePath: string) {
    const encodedPath = filePath
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')

    if (config.provider === 'github') {
        return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}`
    }

    return `https://gitee.com/api/v5/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}`
}

function buildReadUrl(config: HexoRepositorySyncConfig, filePath: string) {
    const apiUrl = buildContentsApiUrl(config, filePath)
    if (config.provider === 'github') {
        return `${apiUrl}?ref=${encodeURIComponent(config.branch)}`
    }

    return `${apiUrl}?ref=${encodeURIComponent(config.branch)}&access_token=${encodeURIComponent(config.accessToken)}`
}

function buildProviderHeaders(provider: PostHexoRepositoryProvider, accessToken: string) {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'momei-hexo-repository-sync',
    }

    if (provider === 'github') {
        headers.Authorization = `Bearer ${accessToken}`
        headers['X-GitHub-Api-Version'] = '2022-11-28'
    }

    return headers
}

async function fetchJson(url: string, options: FetchJsonOptions = {}, fetcher: typeof fetch = fetch) {
    const response = await fetcher(url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
    })
    const responseText = await response.text()
    let responseBody: unknown = null

    if (responseText) {
        try {
            responseBody = JSON.parse(responseText)
        } catch {
            responseBody = responseText
        }
    }

    if (!response.ok) {
        let message = response.statusText || 'Remote repository request failed'
        if (typeof responseBody === 'object' && responseBody && 'message' in responseBody && typeof responseBody.message === 'string') {
            message = responseBody.message
        } else if (typeof responseBody === 'object' && responseBody && 'error' in responseBody && typeof responseBody.error === 'string') {
            message = responseBody.error
        }

        throw new HexoRepositorySyncRequestError(response.status, message, responseBody)
    }

    return responseBody as ParsedProviderResponse
}

async function fetchRemoteFileInfo(config: HexoRepositorySyncConfig, filePath: string, fetcher: typeof fetch = fetch): Promise<RemoteFileInfo> {
    try {
        const response = await fetchJson(buildReadUrl(config, filePath), {
            headers: buildProviderHeaders(config.provider, config.accessToken),
        }, fetcher)

        return {
            sha: response.sha || response.content?.sha || null,
            htmlUrl: response.html_url || response.content?.html_url || response.content?.download_url || null,
        }
    } catch (error) {
        if (error instanceof HexoRepositorySyncRequestError && error.statusCode === 404) {
            return { sha: null, htmlUrl: null }
        }

        throw error
    }
}

function buildCommitMessage(post: Pick<Post, 'title' | 'slug' | 'language'>, operation: DispatchPostHexoRepositorySyncCommand['operation']) {
    const actionLabel = operation === 'retry' ? 'retry sync' : 'sync'
    return `${actionLabel}: ${post.slug || post.title} [${post.language}]`
}

export async function syncPostToHexoRepository(
    post: Pick<Post, 'title' | 'slug' | 'id' | 'language' | 'content' | 'summary' | 'coverImage' | 'metadata' | 'category' | 'tags' | 'author' | 'createdAt'>,
    config: HexoRepositorySyncConfig,
    command: DispatchPostHexoRepositorySyncCommand,
    fetcher: typeof fetch = fetch,
): Promise<UpsertRemoteFileResult & { filePath: string }> {
    const filePath = buildHexoRepositoryFilePath(post, config.postsDir)
    const remoteFile = await fetchRemoteFileInfo(config, filePath, fetcher)
    const markdown = formatPostToMarkdown(post as PostEntity, {
        siteUrl: config.siteUrl,
        absolutizeMediaUrls: true,
    })
    const payload: Record<string, unknown> = {
        message: buildCommitMessage(post, command.operation),
        content: Buffer.from(markdown, 'utf-8').toString('base64'),
        branch: config.branch,
    }

    if (remoteFile.sha) {
        payload.sha = remoteFile.sha
    }

    if (config.provider === 'gitee') {
        payload.access_token = config.accessToken
    }

    const response = await fetchJson(buildContentsApiUrl(config, filePath), {
        method: config.provider === 'gitee' && !remoteFile.sha ? 'POST' : 'PUT',
        headers: buildProviderHeaders(config.provider, config.accessToken),
        body: JSON.stringify(payload),
    }, fetcher)

    return {
        filePath,
        sha: response.commit?.sha || response.content?.sha || remoteFile.sha || null,
        htmlUrl: response.content?.html_url || response.content?.download_url || remoteFile.htmlUrl || null,
        mode: remoteFile.sha ? 'updated' : 'created',
    }
}

function classifyRepositorySyncError(error: unknown): { reason: PostDistributionFailureReason, message: string } {
    if (error instanceof HexoRepositorySyncRequestError) {
        if (error.statusCode === 401 || error.statusCode === 403) {
            return { reason: 'auth_failed', message: error.message }
        }
        if (error.statusCode === 404) {
            return { reason: 'remote_missing', message: error.message }
        }
        if (error.statusCode === 429) {
            return { reason: 'rate_limited', message: error.message }
        }
        if (error.statusCode === 400 || error.statusCode === 422) {
            return { reason: 'content_validation_failed', message: error.message }
        }
    }

    if (error instanceof Error && /network|fetch|timeout|socket|dns/iu.test(error.message)) {
        return { reason: 'network_error', message: error.message }
    }

    if (error instanceof Error) {
        return { reason: 'unknown', message: error.message }
    }

    return { reason: 'unknown', message: 'Unknown repository sync error' }
}

function cloneMetadata(metadata: Post['metadata']) {
    return metadata ? JSON.parse(JSON.stringify(metadata)) : {}
}

function ensureIntegration(metadata: Post['metadata']) {
    const nextMetadata = cloneMetadata(metadata)
    const integration = nextMetadata.integration && typeof nextMetadata.integration === 'object'
        ? nextMetadata.integration
        : {}

    nextMetadata.integration = integration
    return {
        metadata: nextMetadata,
        integration,
    }
}

function buildStateBase(config: HexoRepositorySyncConfig, filePath: string, actor: PostHexoRepositorySyncActor, operation: DispatchPostHexoRepositorySyncCommand['operation']) {
    return {
        provider: config.provider,
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        filePath,
        lastOperation: operation,
        lastOperatorId: actor.currentUserId,
    } satisfies PostHexoRepositorySyncState
}

async function persistHexoRepositorySyncState(post: Post, state: PostHexoRepositorySyncState) {
    const postRepo = dataSource.getRepository(PostEntity)
    const persistedPost = await postRepo.findOne({ where: { id: post.id } })
    if (!persistedPost) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    const { metadata, integration } = ensureIntegration(persistedPost.metadata)
    integration.hexoRepositorySync = state
    persistedPost.metadata = metadata
    persistedPost.metaVersion = Math.max(persistedPost.metaVersion || 0, 1)
    await postRepo.save(persistedPost)
    post.metadata = persistedPost.metadata
    post.metaVersion = persistedPost.metaVersion
}

function ensureRepositorySyncAccess(post: Post, actor: PostHexoRepositorySyncActor) {
    if (!actor.isAdmin && post.authorId !== actor.currentUserId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (post.status !== PostStatus.PUBLISHED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Only published posts can be synchronized to Hexo repositories',
        })
    }
}

async function loadManagedPost(postId: string) {
    const postRepo = dataSource.getRepository(PostEntity)
    const post = await postRepo.findOne({
        where: { id: postId },
        relations: ['author', 'category', 'tags'],
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    return post as unknown as Post
}

async function resolveSiteUrl() {
    return normalizeOptionalString(await getSetting(SettingKey.SITE_URL))
        || normalizeOptionalString(useRuntimeConfig().public.siteUrl)
        || 'https://momei.app'
}

async function resolveHexoRepositorySyncConfig(): Promise<HexoRepositorySyncConfig> {
    const [
        enabled,
        provider,
        owner,
        repo,
        branch,
        postsDir,
        accessToken,
        siteUrl,
    ] = await Promise.all([
        getSetting(SettingKey.HEXO_SYNC_ENABLED, 'false'),
        getSetting(SettingKey.HEXO_SYNC_PROVIDER),
        getSetting(SettingKey.HEXO_SYNC_OWNER),
        getSetting(SettingKey.HEXO_SYNC_REPO),
        getSetting(SettingKey.HEXO_SYNC_BRANCH, 'main'),
        getSetting(SettingKey.HEXO_SYNC_POSTS_DIR, 'source/_posts'),
        getSetting(SettingKey.HEXO_SYNC_ACCESS_TOKEN),
        resolveSiteUrl(),
    ])

    if (!toBoolean(enabled)) {
        throw createError({ statusCode: 400, statusMessage: 'Hexo repository sync is disabled' })
    }

    const normalizedProvider = normalizeProvider(provider)
    const normalizedOwner = normalizeOptionalString(owner)
    const normalizedRepo = normalizeOptionalString(repo)
    const normalizedBranch = normalizeOptionalString(branch) || 'main'
    const normalizedPostsDir = normalizeOptionalString(postsDir) || 'source/_posts'
    const normalizedAccessToken = normalizeOptionalString(accessToken)

    if (!normalizedProvider || !normalizedOwner || !normalizedRepo || !normalizedAccessToken) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Hexo repository sync configuration is incomplete',
        })
    }

    return {
        provider: normalizedProvider,
        owner: normalizedOwner,
        repo: normalizedRepo,
        branch: normalizedBranch,
        postsDir: normalizedPostsDir,
        accessToken: normalizedAccessToken,
        siteUrl,
    }
}

export async function dispatchPostHexoRepositorySyncService(
    postId: string,
    command: DispatchPostHexoRepositorySyncCommand,
    actor: PostHexoRepositorySyncActor,
    fetcher: typeof fetch = fetch,
): Promise<HexoRepositorySyncResult> {
    const post = await loadManagedPost(postId)
    ensureRepositorySyncAccess(post, actor)

    const config = await resolveHexoRepositorySyncConfig()
    const filePath = buildHexoRepositoryFilePath(post, config.postsDir)
    const previousState = post.metadata?.integration?.hexoRepositorySync ?? null

    try {
        const syncResult = await syncPostToHexoRepository(post, config, command, fetcher)
        const now = new Date().toISOString()
        const state: PostHexoRepositorySyncState = {
            ...buildStateBase(config, syncResult.filePath, actor, command.operation),
            remoteUrl: syncResult.htmlUrl,
            remoteSha: syncResult.sha,
            lastSyncedAt: now,
            lastFailureAt: null,
            lastFailureReason: null,
            lastMessage: syncResult.mode === 'updated'
                ? 'Updated Hexo repository content successfully'
                : 'Created Hexo repository content successfully',
        }

        await persistHexoRepositorySyncState(post, state)
        logger.info('[HexoRepositorySync] Synced post to remote repository', {
            postId: post.id,
            provider: config.provider,
            repo: `${config.owner}/${config.repo}`,
            branch: config.branch,
            filePath: syncResult.filePath,
            mode: syncResult.mode,
            remoteSha: syncResult.sha,
        })

        return { state }
    } catch (error) {
        const classified = classifyRepositorySyncError(error)
        const now = new Date().toISOString()
        const state: PostHexoRepositorySyncState = {
            ...buildStateBase(config, filePath, actor, command.operation),
            remoteUrl: previousState?.remoteUrl ?? null,
            remoteSha: previousState?.remoteSha ?? null,
            lastSyncedAt: previousState?.lastSyncedAt ?? null,
            lastFailureAt: now,
            lastFailureReason: classified.reason,
            lastMessage: classified.message,
        }

        await persistHexoRepositorySyncState(post, state)
        logger.error('[HexoRepositorySync] Failed to sync post to remote repository', {
            postId: post.id,
            provider: config.provider,
            repo: `${config.owner}/${config.repo}`,
            branch: config.branch,
            filePath,
            reason: classified.reason,
            message: classified.message,
        })
        throw createError({
            statusCode: error instanceof HexoRepositorySyncRequestError ? error.statusCode : 500,
            statusMessage: classified.message,
        })
    }
}
