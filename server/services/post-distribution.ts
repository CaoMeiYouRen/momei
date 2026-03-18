import { dataSource } from '@/server/database'
import { Post as PostEntity } from '@/server/entities/post'
import { getSetting } from '@/server/services/setting'
import { buildPostDistributionMaterialBundle } from '@/server/services/post-distribution-template'
import logger from '@/server/utils/logger'
import { createMemo, type MemosCreateResponse, updateMemo } from '@/server/utils/memos'
import {
    PostStatus,
    type Post,
    type PostDistributionAction,
    type PostDistributionChannel,
    type PostDistributionChannelState,
    type PostDistributionFailureReason,
    type PostDistributionMetadata,
    type PostDistributionMode,
    type PostDistributionStatus,
    type PostDistributionTimelineEntry,
} from '@/types/post'
import { SettingKey } from '@/types/setting'
import { toBoolean } from '@/utils/shared/coerce'
import { generateRandomString } from '@/utils/shared/random'

const DISTRIBUTION_TIMELINE_LIMIT = 20

export interface PostDistributionActor {
    currentUserId: string
    isAdmin: boolean
}

export interface DispatchPostDistributionCommand {
    channel: PostDistributionChannel
    mode?: PostDistributionMode
    operation: 'sync' | 'retry' | 'terminate'
}

export interface CompleteWechatSyncAccountResult {
    id: string
    title: string
    status: 'uploading' | 'done' | 'failed'
    msg?: string
    error?: string
    draftLink?: string
}

export interface CompleteWechatSyncDistributionCommand {
    attemptId: string
    accounts: CompleteWechatSyncAccountResult[]
}

export interface PostDistributionSummary {
    channels: {
        memos: PostDistributionChannelState
        wechatsync: PostDistributionChannelState
    }
    timeline: PostDistributionTimelineEntry[]
}

export interface DispatchPostDistributionResult {
    summary: PostDistributionSummary
    attemptId?: string | null
}

function cloneMetadata(metadata: Post['metadata']) {
    return metadata ? JSON.parse(JSON.stringify(metadata)) : {}
}

function normalizeChannelState(state?: PostDistributionChannelState | null, legacyRemoteId?: string | null): PostDistributionChannelState {
    return {
        status: state?.status || 'idle',
        remoteId: state?.remoteId ?? legacyRemoteId ?? null,
        remoteUrl: state?.remoteUrl ?? null,
        lastMode: state?.lastMode ?? null,
        lastAction: state?.lastAction ?? null,
        lastAttemptId: state?.lastAttemptId ?? null,
        activeAttemptId: state?.activeAttemptId ?? null,
        lastAttemptAt: state?.lastAttemptAt ?? null,
        activeSince: state?.activeSince ?? null,
        lastSuccessAt: state?.lastSuccessAt ?? null,
        lastFailureAt: state?.lastFailureAt ?? null,
        lastFinishedAt: state?.lastFinishedAt ?? null,
        lastFailureReason: state?.lastFailureReason ?? null,
        lastMessage: state?.lastMessage ?? null,
        lastOperatorId: state?.lastOperatorId ?? null,
        retryCount: state?.retryCount ?? 0,
    }
}

function ensureDistributionMetadata(post: Post) {
    const metadata = cloneMetadata(post.metadata)
    const integration = metadata.integration && typeof metadata.integration === 'object'
        ? metadata.integration
        : {}
    const distribution = integration.distribution && typeof integration.distribution === 'object'
        ? integration.distribution as PostDistributionMetadata
        : {}

    const channels = distribution.channels && typeof distribution.channels === 'object'
        ? distribution.channels
        : {}

    const nextDistribution: PostDistributionMetadata = {
        channels: {
            memos: normalizeChannelState(channels.memos, integration.memosId ?? null),
            wechatsync: normalizeChannelState(channels.wechatsync),
        },
        timeline: Array.isArray(distribution.timeline) ? distribution.timeline.slice(0, DISTRIBUTION_TIMELINE_LIMIT) : [],
    }

    integration.distribution = nextDistribution
    metadata.integration = integration

    return {
        metadata,
        integration,
        distribution: nextDistribution,
    }
}

function toDistributionSummary(post: Post): PostDistributionSummary {
    const { distribution } = ensureDistributionMetadata(post)

    return {
        channels: {
            memos: distribution.channels?.memos || normalizeChannelState(undefined),
            wechatsync: distribution.channels?.wechatsync || normalizeChannelState(undefined),
        },
        timeline: (distribution.timeline || []).slice(0, DISTRIBUTION_TIMELINE_LIMIT),
    }
}

async function persistDistributionMetadata(post: Post, metadata: Post['metadata']) {
    const postRepo = dataSource.getRepository(PostEntity)
    const persistedPost = await postRepo.findOne({ where: { id: post.id } })
    if (!persistedPost) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    persistedPost.metadata = metadata || null
    persistedPost.metaVersion = Math.max(persistedPost.metaVersion || 0, 1)
    await postRepo.save(persistedPost)

    post.metadata = persistedPost.metadata
    post.metaVersion = persistedPost.metaVersion
}

async function loadManagedPost(postId: string) {
    const postRepo = dataSource.getRepository(PostEntity)
    const post = await postRepo.findOne({
        where: { id: postId },
        relations: ['author', 'tags'],
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    return post as unknown as Post
}

function ensureDistributionAccess(post: Post, actor: PostDistributionActor) {
    if (!actor.isAdmin && post.authorId !== actor.currentUserId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    if (post.status !== PostStatus.PUBLISHED) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Only published posts can be distributed manually',
        })
    }
}

function resolveAttemptAction(
    channelState: PostDistributionChannelState,
    command: DispatchPostDistributionCommand,
): { action: PostDistributionAction, mode: PostDistributionMode | null } {
    const fallbackMode = channelState.lastMode
        || (channelState.remoteId ? 'update-existing' : 'republish-new')

    if (command.operation === 'retry') {
        return {
            action: 'retry',
            mode: command.mode || fallbackMode,
        }
    }

    if (command.operation === 'terminate') {
        return {
            action: 'terminate',
            mode: command.mode || null,
        }
    }

    if (channelState.remoteId) {
        return {
            action: (command.mode || 'update-existing') === 'republish-new' ? 'republish' : 'update',
            mode: command.mode || 'update-existing',
        }
    }

    return {
        action: 'create',
        mode: null,
    }
}

function startAttempt(params: {
    post: Post
    channel: PostDistributionChannel
    action: PostDistributionAction
    mode: PostDistributionMode | null
    actor: PostDistributionActor
    triggeredBy: PostDistributionTimelineEntry['triggeredBy']
}) {
    const {
        post,
        channel,
        action,
        mode,
        actor,
        triggeredBy,
    } = params
    const now = new Date().toISOString()
    const attemptId = generateRandomString(18)
    const { metadata, distribution } = ensureDistributionMetadata(post)
    const channelState = distribution.channels?.[channel]
    if (!channelState) {
        throw createError({ statusCode: 500, statusMessage: 'Invalid distribution channel state' })
    }

    if (channelState.status === 'delivering' && channelState.activeAttemptId) {
        return {
            attemptId: channelState.activeAttemptId,
            metadata,
            channelState,
            entry: distribution.timeline?.find((item) => item.id === channelState.activeAttemptId) || null,
            reused: true,
        }
    }

    const entry: PostDistributionTimelineEntry = {
        id: attemptId,
        channel,
        action,
        mode,
        status: 'delivering',
        triggeredBy,
        operatorId: actor.currentUserId,
        startedAt: now,
        finishedAt: null,
        message: null,
        details: null,
    }

    distribution.timeline = [entry, ...(distribution.timeline || [])].slice(0, DISTRIBUTION_TIMELINE_LIMIT)
    distribution.channels = distribution.channels || {}
    distribution.channels[channel] = {
        ...channelState,
        status: 'delivering',
        lastAction: action,
        lastMode: mode,
        lastAttemptId: attemptId,
        activeAttemptId: attemptId,
        lastAttemptAt: now,
        activeSince: now,
        lastOperatorId: actor.currentUserId,
        lastMessage: null,
        retryCount: action === 'retry' ? (channelState.retryCount || 0) + 1 : (channelState.retryCount || 0),
    }

    return {
        attemptId,
        metadata,
        channelState: distribution.channels[channel],
        entry,
        reused: false,
    }
}

function finalizeAttempt(
    post: Post,
    channel: PostDistributionChannel,
    attemptId: string,
    outcome: {
        status: PostDistributionStatus
        remoteId?: string | null
        remoteUrl?: string | null
        failureReason?: PostDistributionFailureReason | null
        message?: string | null
        details?: Record<string, unknown> | null
    },
) {
    const now = new Date().toISOString()
    const { metadata, integration, distribution } = ensureDistributionMetadata(post)
    const channelState = distribution.channels?.[channel]
    const entry = distribution.timeline?.find((item) => item.id === attemptId)

    if (!channelState || !entry) {
        throw createError({ statusCode: 404, statusMessage: 'Distribution attempt not found' })
    }

    entry.status = outcome.status
    entry.finishedAt = now
    entry.remoteId = outcome.remoteId ?? entry.remoteId ?? null
    entry.remoteUrl = outcome.remoteUrl ?? entry.remoteUrl ?? null
    entry.failureReason = outcome.failureReason ?? null
    entry.message = outcome.message ?? null
    entry.details = outcome.details ?? null

    channelState.status = outcome.status
    channelState.lastFinishedAt = now
    channelState.lastMessage = outcome.message ?? null
    channelState.lastFailureReason = outcome.failureReason ?? null
    channelState.activeAttemptId = null
    channelState.activeSince = null

    if (outcome.status === 'succeeded') {
        channelState.lastSuccessAt = now
        channelState.remoteId = outcome.remoteId ?? channelState.remoteId ?? null
        channelState.remoteUrl = outcome.remoteUrl ?? channelState.remoteUrl ?? null
        channelState.lastFailureReason = null
        if (channel === 'memos') {
            integration.memosId = outcome.remoteId ?? integration.memosId ?? null
        }
    }

    if (outcome.status === 'failed' || outcome.status === 'cancelled') {
        channelState.lastFailureAt = now
    }

    return metadata
}

function classifyDistributionError(error: unknown): { reason: PostDistributionFailureReason, message: string } {
    let statusCode: number | null = null
    let statusMessage = 'Unknown distribution error'

    if (typeof error === 'object' && error) {
        if ('statusCode' in error && typeof error.statusCode === 'number') {
            statusCode = error.statusCode
        } else if ('status' in error && typeof error.status === 'number') {
            statusCode = error.status
        }

        if ('statusMessage' in error && typeof error.statusMessage === 'string') {
            statusMessage = error.statusMessage
        } else if ('message' in error && typeof error.message === 'string') {
            statusMessage = error.message
        }
    }

    if (statusCode === 401 || statusCode === 403) {
        return { reason: 'auth_failed', message: statusMessage }
    }
    if (statusCode === 429) {
        return { reason: 'rate_limited', message: statusMessage }
    }
    if (statusCode === 404) {
        return { reason: 'remote_missing', message: statusMessage }
    }
    if (statusCode === 400 || statusCode === 422) {
        return { reason: 'content_validation_failed', message: statusMessage }
    }
    if (/network|fetch|timeout|econn|socket|dns/iu.test(statusMessage)) {
        return { reason: 'network_error', message: statusMessage }
    }

    return { reason: 'unknown', message: statusMessage }
}

function resolveMemosId(memo: MemosCreateResponse) {
    if (memo.uid) {
        return memo.uid
    }

    if (!memo.name) {
        return null
    }

    const memoId = memo.name.split('/').pop()
    return memoId || memo.name
}

function normalizeMemosPublicBaseUrl(instanceUrl?: string | null) {
    if (!instanceUrl) {
        return null
    }

    return instanceUrl
        .replace(/\/+$/u, '')
        .replace(/\/api\/v1$/iu, '')
}

function buildMemosPublicPermalink(instanceUrl: string | null, memo: MemosCreateResponse, memosId: string | null) {
    if (memo.name && /^https?:\/\//iu.test(memo.name)) {
        return memo.name
    }

    const publicBaseUrl = normalizeMemosPublicBaseUrl(instanceUrl)
    if (!publicBaseUrl) {
        return null
    }

    const resourceName = (memo.name || (memosId ? `memos/${memosId}` : null))
        ?.replace(/^\/+/, '')
        .replace(/^api\/v1\//iu, '')

    if (!resourceName) {
        return null
    }

    return `${publicBaseUrl}/${resourceName}`
}

async function ensureMemosEnabled() {
    const isEnabled = await getSetting(SettingKey.MEMOS_ENABLED)
    if (!toBoolean(isEnabled)) {
        throw createError({ statusCode: 400, statusMessage: 'Memos integration is disabled' })
    }
}

async function runMemosDistribution(
    post: Post,
    actor: PostDistributionActor,
    command: DispatchPostDistributionCommand,
) {
    await ensureMemosEnabled()

    const summary = toDistributionSummary(post)
    const channelState = summary.channels.memos
    const { action, mode } = resolveAttemptAction(channelState, command)

    if (action === 'terminate') {
        if (!channelState.activeAttemptId) {
            return {
                summary,
                attemptId: null,
            }
        }

        const metadata = finalizeAttempt(post, 'memos', channelState.activeAttemptId, {
            status: 'cancelled',
            failureReason: 'manual_terminated',
            message: 'Memos distribution terminated manually',
        })
        await persistDistributionMetadata(post, metadata)
        return {
            summary: toDistributionSummary(post),
            attemptId: channelState.activeAttemptId,
        }
    }

    const attempt = startAttempt({
        post,
        channel: 'memos',
        action,
        mode,
        actor,
        triggeredBy: command.operation === 'retry' ? 'retry' : 'manual',
    })
    if (!attempt.reused) {
        await persistDistributionMetadata(post, attempt.metadata)
    }

    if (attempt.reused) {
        return {
            summary: toDistributionSummary(post),
            attemptId: attempt.attemptId,
        }
    }

    try {
        const materialBundle = await buildPostDistributionMaterialBundle(post)
        const content = materialBundle.channels.memos.content
        const memo = action === 'update' || (action === 'retry' && mode === 'update-existing' && attempt.channelState.remoteId)
            ? await updateMemo(attempt.channelState.remoteId!, { content })
            : await createMemo({ content })

        if (!memo) {
            throw createError({ statusCode: 400, statusMessage: 'Memos integration is disabled' })
        }

        const memosId = resolveMemosId(memo)
        const instanceUrl = await getSetting(SettingKey.MEMOS_INSTANCE_URL)
        const remoteUrl = buildMemosPublicPermalink(instanceUrl, memo, memosId)

        const metadata = finalizeAttempt(post, 'memos', attempt.attemptId, {
            status: 'succeeded',
            remoteId: memosId,
            remoteUrl,
            message: action === 'update' ? 'Updated existing Memos content' : 'Delivered to Memos successfully',
        })
        await persistDistributionMetadata(post, metadata)

        return {
            summary: toDistributionSummary(post),
            attemptId: attempt.attemptId,
        }
    } catch (error) {
        logger.error('[PostDistributionService] Memos distribution failed:', error)
        const classified = classifyDistributionError(error)
        const metadata = finalizeAttempt(post, 'memos', attempt.attemptId, {
            status: 'failed',
            failureReason: classified.reason,
            message: classified.message,
        })
        await persistDistributionMetadata(post, metadata)
        return {
            summary: toDistributionSummary(post),
            attemptId: attempt.attemptId,
        }
    }
}

async function startWechatSyncDistribution(
    post: Post,
    actor: PostDistributionActor,
    command: DispatchPostDistributionCommand,
) {
    const summary = toDistributionSummary(post)
    const channelState = summary.channels.wechatsync
    const { action, mode } = resolveAttemptAction(channelState, command)

    if (action === 'terminate') {
        if (!channelState.activeAttemptId) {
            return {
                summary,
                attemptId: null,
            }
        }

        const metadata = finalizeAttempt(post, 'wechatsync', channelState.activeAttemptId, {
            status: 'cancelled',
            failureReason: 'manual_terminated',
            message: 'WechatSync distribution terminated manually',
        })
        await persistDistributionMetadata(post, metadata)
        return {
            summary: toDistributionSummary(post),
            attemptId: channelState.activeAttemptId,
        }
    }

    const attempt = startAttempt({
        post,
        channel: 'wechatsync',
        action,
        mode,
        actor,
        triggeredBy: command.operation === 'retry' ? 'retry' : 'manual',
    })
    if (!attempt.reused) {
        await persistDistributionMetadata(post, attempt.metadata)
    }

    return {
        summary: toDistributionSummary(post),
        attemptId: attempt.attemptId,
    }
}

function classifyWechatSyncFailure(accounts: CompleteWechatSyncAccountResult[]): PostDistributionFailureReason {
    const combined = accounts
        .map((account) => `${account.msg || ''} ${account.error || ''}`.trim())
        .join(' ')

    if (/auth|unauthorized|forbidden|登录|鉴权/iu.test(combined)) {
        return 'auth_failed'
    }
    if (/429|rate|频率|限流/iu.test(combined)) {
        return 'rate_limited'
    }
    if (/network|timeout|fetch|socket|dns|网络/iu.test(combined)) {
        return 'network_error'
    }
    if (/not found|不存在|草稿不存在/iu.test(combined)) {
        return 'remote_missing'
    }
    if (/content|invalid|校验|格式/iu.test(combined)) {
        return 'content_validation_failed'
    }

    return 'unknown'
}

export async function getPostDistributionService(postId: string, actor: PostDistributionActor) {
    const post = await loadManagedPost(postId)
    ensureDistributionAccess(post, actor)
    return toDistributionSummary(post)
}

export async function dispatchPostDistributionService(
    postId: string,
    command: DispatchPostDistributionCommand,
    actor: PostDistributionActor,
): Promise<DispatchPostDistributionResult> {
    const post = await loadManagedPost(postId)
    ensureDistributionAccess(post, actor)

    if (command.channel === 'memos') {
        return runMemosDistribution(post, actor, command)
    }

    return startWechatSyncDistribution(post, actor, command)
}

export async function completeWechatSyncDistributionService(
    postId: string,
    command: CompleteWechatSyncDistributionCommand,
    actor: PostDistributionActor,
) {
    const post = await loadManagedPost(postId)
    ensureDistributionAccess(post, actor)

    const summary = toDistributionSummary(post)
    const channelState = summary.channels.wechatsync

    if (channelState.activeAttemptId && channelState.activeAttemptId !== command.attemptId) {
        throw createError({ statusCode: 409, statusMessage: 'Another WechatSync attempt is currently active' })
    }

    const successCount = command.accounts.filter((account) => account.status === 'done').length
    const failureCount = command.accounts.filter((account) => account.status === 'failed').length
    const status: PostDistributionStatus = failureCount > 0 ? 'failed' : 'succeeded'
    const firstDraftLink = command.accounts.find((account) => account.draftLink)?.draftLink || null
    const message = status === 'succeeded'
        ? `WechatSync delivered to ${successCount} account(s)`
        : `WechatSync failed on ${failureCount} account(s)`

    const metadata = finalizeAttempt(post, 'wechatsync', command.attemptId, {
        status,
        remoteUrl: firstDraftLink,
        failureReason: status === 'failed' ? classifyWechatSyncFailure(command.accounts) : null,
        message,
        details: {
            accounts: command.accounts,
            successCount,
            failureCount,
        },
    })

    await persistDistributionMetadata(post, metadata)
    return toDistributionSummary(post)
}
