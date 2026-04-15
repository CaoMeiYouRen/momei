import type { Post } from '@/types/post'
import {
    buildDistributionMaterialBundle,
    type DistributionMaterialBundle,
} from '@/utils/shared/distribution-template'
import {
    buildWechatSyncFailureResults,
    mapWechatSyncTaskAccountsForCompletion,
    normalizeWechatSyncAccounts,
    MAX_WECHATSYNC_OBSERVATION_ACCOUNT_KEYS,
    MAX_WECHATSYNC_OBSERVATION_ACCOUNTS,
    MAX_WECHATSYNC_OBSERVATION_EVENTS,
    MAX_WECHATSYNC_OBSERVATION_RAW_STATUS_KEYS,
    type WechatSyncAccount,
    type WechatSyncCompletionAccount,
    type WechatSyncDispatchObservation,
    type WechatSyncDispatchObservationEvent,
    type WechatSyncTaskAccount,
} from '@/utils/shared/wechatsync'
import {
    mergeWechatSyncCompletionAccounts,
    mergeWechatSyncTaskAccounts,
    shouldFinalizeWechatSyncStatus,
} from '@/utils/shared/post-distribution-wechatsync'
import type { WechatSyncWindow } from '@/utils/web/post-distribution-dialog'

const DEFAULT_WECHATSYNC_STATUS_INACTIVITY_TIMEOUT_MS = 60_000
const WECHATSYNC_OBSERVATION_PERSISTED_PHASES = new Set<WechatSyncDispatchObservationEvent['phase']>([
    'dispatch_started',
    'ready',
    'resolved',
    'start_failed',
    'timeout_resolved',
])

function normalizeWechatSyncObservationToken(value: unknown) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return null
    }

    const normalizedValue = String(value).trim()
    return normalizedValue || null
}

function resolveWechatSyncObservationAccountKey(account: Pick<WechatSyncAccount, 'id' | 'type' | 'title'>) {
    return normalizeWechatSyncObservationToken(account.id)
        || normalizeWechatSyncObservationToken(account.type)
        || account.title.trim()
}

function mapWechatSyncTaskAccountsToObservation(accounts: readonly WechatSyncTaskAccount[]) {
    return accounts.map((account) => ({
        id: normalizeWechatSyncObservationToken(account.id)
            || normalizeWechatSyncObservationToken(account.type)
            || account.title.trim(),
        title: account.title,
        status: account.status,
        msg: account.msg,
        error: account.error,
        draftLink: account.editResp?.draftLink,
    }))
}

function mapWechatSyncSelectedAccountsToObservation(accounts: readonly WechatSyncAccount[]) {
    return accounts.map((account) => ({
        id: resolveWechatSyncObservationAccountKey(account),
        title: account.title,
        status: 'pending' as const,
    }))
}

function mapWechatSyncCompletionAccountsToObservation(accounts: readonly WechatSyncCompletionAccount[]) {
    return accounts.map((account) => ({
        id: account.id,
        title: account.title,
        status: account.status,
        msg: account.msg,
        error: account.error,
        draftLink: account.draftLink,
    }))
}

function limitWechatSyncObservationArray<T>(items: readonly T[] | undefined, maxLength: number) {
    return items?.slice(0, maxLength)
}

function cloneWechatSyncDispatchObservation(observation: WechatSyncDispatchObservation) {
    return {
        strategy: observation.strategy,
        resolution: observation.resolution ?? null,
        payload: {
            ...observation.payload,
            accountKeys: limitWechatSyncObservationArray(observation.payload.accountKeys, MAX_WECHATSYNC_OBSERVATION_ACCOUNT_KEYS) || [],
        },
        readyEventCount: observation.readyEventCount,
        statusEventCount: observation.statusEventCount,
        events: limitWechatSyncObservationArray(observation.events, MAX_WECHATSYNC_OBSERVATION_EVENTS)?.map((event) => ({
            ...event,
            rawStatusKeys: limitWechatSyncObservationArray(event.rawStatusKeys, MAX_WECHATSYNC_OBSERVATION_RAW_STATUS_KEYS),
            accounts: limitWechatSyncObservationArray(event.accounts, MAX_WECHATSYNC_OBSERVATION_ACCOUNTS)?.map((account) => ({
                ...account,
            })),
        })) || [],
    }
}

function resolveWechatSyncStatusSyncId(status: Record<string, unknown>) {
    const syncId = status.syncId ?? status.taskId ?? status.id
    return normalizeWechatSyncObservationToken(syncId)
}

function buildWechatSyncDispatchObservation(
    materialBundle: DistributionMaterialBundle,
    accounts: readonly WechatSyncAccount[],
): WechatSyncDispatchObservation {
    return {
        strategy: 'single_add_task_default_raw',
        resolution: null,
        payload: {
            renderMode: 'none',
            contentProfile: 'default',
            usesRawPost: true,
            markdownLength: materialBundle.channels.wechatsync.basePost.markdown?.length || 0,
            contentLength: materialBundle.channels.wechatsync.basePost.content.length,
            descLength: materialBundle.channels.wechatsync.basePost.desc.length,
            accountKeys: accounts.map((account) => resolveWechatSyncObservationAccountKey(account)),
        },
        readyEventCount: 0,
        statusEventCount: 0,
        events: [],
    }
}

function appendWechatSyncObservationEvent(
    observation: WechatSyncDispatchObservation,
    event: WechatSyncDispatchObservationEvent,
) {
    observation.events.push(event)

    while (observation.events.length > MAX_WECHATSYNC_OBSERVATION_EVENTS) {
        const removableEventIndex = observation.events.findIndex((currentEvent, index) => index > 0 && !WECHATSYNC_OBSERVATION_PERSISTED_PHASES.has(currentEvent.phase))
        observation.events.splice(removableEventIndex >= 0 ? removableEventIndex : 1, 1)
    }
}

function doesWechatSyncTaskAccountMatchSelection(
    taskAccount: WechatSyncTaskAccount,
    selectedAccount: WechatSyncAccount,
) {
    const taskToken = normalizeWechatSyncObservationToken(taskAccount.type)
        || normalizeWechatSyncObservationToken(taskAccount.id)

    if (taskToken) {
        return taskToken === selectedAccount.type || taskToken === selectedAccount.id
    }

    return taskAccount.title.trim() === selectedAccount.title.trim()
}

function doesWechatSyncStatusCoverSelectedAccounts(
    taskAccounts: readonly WechatSyncTaskAccount[],
    selectedAccounts: readonly WechatSyncAccount[],
) {
    if (taskAccounts.length < selectedAccounts.length) {
        return false
    }

    return selectedAccounts.every((selectedAccount) => taskAccounts.some((taskAccount) => doesWechatSyncTaskAccountMatchSelection(taskAccount, selectedAccount)))
}

function buildWechatSyncTimeoutCompletionAccounts(
    taskAccounts: readonly WechatSyncTaskAccount[],
    selectedAccounts: readonly WechatSyncAccount[],
    errorMessage: string,
) {
    const normalizedErrorMessage = errorMessage.trim() || 'WechatSync status timed out before all selected accounts were reported'
    const observedCompletionAccounts = mapWechatSyncTaskAccountsForCompletion(taskAccounts, selectedAccounts)
        .map<WechatSyncCompletionAccount>((account) => account.status === 'done' || account.status === 'failed'
            ? account
            : {
                ...account,
                status: 'failed',
                error: account.error || normalizedErrorMessage,
                msg: undefined,
            })
    const missingAccounts = selectedAccounts.filter((selectedAccount) => !taskAccounts.some((taskAccount) => doesWechatSyncTaskAccountMatchSelection(taskAccount, selectedAccount)))

    return mergeWechatSyncCompletionAccounts(
        observedCompletionAccounts,
        buildWechatSyncFailureResults(missingAccounts, normalizedErrorMessage),
    )
}

export function mergeLocalWechatTaskAccounts(
    currentAccounts: readonly WechatSyncTaskAccount[],
    accounts: readonly WechatSyncTaskAccount[],
) {
    return mergeWechatSyncTaskAccounts(currentAccounts, accounts)
}

export async function loadWechatSyncAccounts(
    syncer: WechatSyncWindow | undefined,
    currentAccounts: readonly WechatSyncAccount[],
) {
    if (!syncer?.getAccounts) {
        return []
    }

    return await new Promise<WechatSyncAccount[]>((resolve) => {
        syncer.getAccounts((accounts) => {
            resolve(normalizeWechatSyncAccounts(accounts, currentAccounts))
        })
    })
}

export function buildFallbackDistributionMaterialBundle(
    sourcePost: Post,
    siteUrl: string,
    defaultLicense: string,
) {
    return buildDistributionMaterialBundle(sourcePost, {
        siteUrl,
        defaultLicense,
    })
}

export function buildPendingWechatSyncTaskAccounts(accounts: readonly WechatSyncAccount[]) {
    return accounts.map<WechatSyncTaskAccount>((account) => ({
        id: account.id,
        type: account.type,
        title: account.title,
        status: 'pending',
    }))
}

export async function runWechatSyncTask({
    syncer,
    materialBundle,
    accounts,
    onTaskAccounts,
    onReady,
    onObservation,
    resolveFailureMessage,
    resolveTimeoutMessage,
    statusInactivityTimeoutMs,
}: {
    syncer: WechatSyncWindow
    materialBundle: DistributionMaterialBundle
    accounts: WechatSyncAccount[]
    onTaskAccounts: (accounts: WechatSyncTaskAccount[]) => void
    onReady: () => void
    onObservation?: (observation: WechatSyncDispatchObservation) => void
    resolveFailureMessage: (error: unknown) => string
    resolveTimeoutMessage?: () => string
    statusInactivityTimeoutMs?: number
}) {
    return await new Promise<{
        completionAccounts: WechatSyncCompletionAccount[]
        observation: WechatSyncDispatchObservation
    }>((resolve) => {
        const postToSync = materialBundle.channels.wechatsync.basePost
        const observation = buildWechatSyncDispatchObservation(materialBundle, accounts)
        let settled = false
        let latestTaskAccounts: WechatSyncTaskAccount[] = []
        let statusInactivityTimer: ReturnType<typeof setTimeout> | null = null

        const publishObservation = () => {
            onObservation?.(cloneWechatSyncDispatchObservation(observation))
        }

        const clearStatusInactivityTimer = () => {
            if (!statusInactivityTimer) {
                return
            }

            clearTimeout(statusInactivityTimer)
            statusInactivityTimer = null
        }

        const resolveDueToIncompleteStatus = () => {
            if (settled) {
                return
            }

            const completionAccounts = buildWechatSyncTimeoutCompletionAccounts(
                latestTaskAccounts,
                accounts,
                resolveTimeoutMessage?.() || 'WechatSync status timed out before all selected accounts were reported',
            )
            observation.resolution = 'timeout_incomplete_status'
            appendWechatSyncObservationEvent(observation, {
                phase: 'timeout_resolved',
                at: new Date().toISOString(),
                accountCount: completionAccounts.length,
                accounts: mapWechatSyncCompletionAccountsToObservation(completionAccounts),
            })
            publishObservation()
            resolveWith(completionAccounts)
        }

        const scheduleStatusInactivityTimeout = () => {
            clearStatusInactivityTimer()
            statusInactivityTimer = setTimeout(
                resolveDueToIncompleteStatus,
                statusInactivityTimeoutMs ?? DEFAULT_WECHATSYNC_STATUS_INACTIVITY_TIMEOUT_MS,
            )
        }

        const resolveWith = (completionAccounts: WechatSyncCompletionAccount[]) => {
            if (settled) {
                return
            }
            settled = true
            clearStatusInactivityTimer()
            resolve({
                completionAccounts,
                observation: cloneWechatSyncDispatchObservation(observation),
            })
        }

        appendWechatSyncObservationEvent(observation, {
            phase: 'dispatch_started',
            at: new Date().toISOString(),
            accountCount: accounts.length,
            accounts: mapWechatSyncSelectedAccountsToObservation(accounts),
        })
        publishObservation()
        scheduleStatusInactivityTimeout()

        try {
            syncer.addTask(
                {
                    post: postToSync,
                    accounts,
                },
                (status) => {
                    if (settled) {
                        return
                    }

                    const rawStatus = status as Record<string, unknown>
                    const taskAccounts = Array.isArray(status.accounts) ? status.accounts : []
                    if (taskAccounts.length) {
                        latestTaskAccounts = mergeWechatSyncTaskAccounts(latestTaskAccounts, taskAccounts)
                        onTaskAccounts(latestTaskAccounts)
                    }
                    const effectiveTaskAccounts = latestTaskAccounts

                    observation.statusEventCount += 1
                    appendWechatSyncObservationEvent(observation, {
                        phase: 'status_received',
                        at: new Date().toISOString(),
                        accountCount: effectiveTaskAccounts.length,
                        syncId: resolveWechatSyncStatusSyncId(rawStatus),
                        rawStatusKeys: Object.keys(rawStatus),
                        accounts: effectiveTaskAccounts.length ? mapWechatSyncTaskAccountsToObservation(effectiveTaskAccounts) : undefined,
                    })
                    publishObservation()
                    scheduleStatusInactivityTimeout()

                    if (
                        shouldFinalizeWechatSyncStatus({ accounts: effectiveTaskAccounts })
                        && doesWechatSyncStatusCoverSelectedAccounts(effectiveTaskAccounts, accounts)
                    ) {
                        observation.resolution = 'terminal_status'
                        appendWechatSyncObservationEvent(observation, {
                            phase: 'resolved',
                            at: new Date().toISOString(),
                            accountCount: effectiveTaskAccounts.length,
                            syncId: resolveWechatSyncStatusSyncId(rawStatus),
                            accounts: mapWechatSyncTaskAccountsToObservation(effectiveTaskAccounts),
                        })
                        publishObservation()
                        resolveWith(mapWechatSyncTaskAccountsForCompletion(effectiveTaskAccounts, accounts))
                    }
                },
                () => {
                    if (settled) {
                        return
                    }

                    observation.readyEventCount += 1
                    appendWechatSyncObservationEvent(observation, {
                        phase: 'ready',
                        at: new Date().toISOString(),
                        accountCount: accounts.length,
                    })
                    publishObservation()
                    scheduleStatusInactivityTimeout()
                    onReady()
                },
            )
        } catch (error) {
            observation.resolution = 'start_error'
            appendWechatSyncObservationEvent(observation, {
                phase: 'start_failed',
                at: new Date().toISOString(),
                accountCount: accounts.length,
                accounts: mapWechatSyncSelectedAccountsToObservation(accounts),
            })
            publishObservation()
            resolveWith(buildWechatSyncFailureResults(accounts, resolveFailureMessage(error)))
        }
    })
}
