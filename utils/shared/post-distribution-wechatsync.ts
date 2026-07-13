import { groupWechatSyncAccountsByTagRenderMode, type DistributionTagRenderMode, type WechatSyncContentProfile } from './distribution-tags'
import type {
    WechatSyncAccount,
    WechatSyncCompletionAccount,
    WechatSyncDispatchObservation,
    WechatSyncTaskAccount,
    WechatSyncTaskStatus,
} from './wechatsync'

export interface WechatSyncDispatchPayloadProfile {
    strategy: WechatSyncDispatchObservation['strategy']
    renderMode: DistributionTagRenderMode
    contentProfile: WechatSyncContentProfile
    usesRawPost: boolean
}

export function shouldFinalizeWechatSyncStatus(status: WechatSyncTaskStatus) {
    return Boolean(status.accounts?.length)
        && status.accounts!.every((account) => account.status === 'done' || account.status === 'failed')
}

export function resolveWechatSyncDispatchPayloadProfile(accounts: readonly WechatSyncAccount[]): WechatSyncDispatchPayloadProfile {
    const groupedAccounts = groupWechatSyncAccountsByTagRenderMode(accounts)
    const group = groupedAccounts[0]

    if (groupedAccounts.length === 1 && group) {
        if (group.contentProfile === 'wechat_mp') {
            return {
                strategy: 'single_add_task_default_raw',
                renderMode: 'none',
                contentProfile: 'default',
                usesRawPost: true,
            }
        }

        const usesRawPost = group.renderMode === 'none' && group.contentProfile === 'default'

        return {
            strategy: usesRawPost ? 'single_add_task_default_raw' : 'single_add_task_group_profile',
            renderMode: group.renderMode,
            contentProfile: group.contentProfile,
            usesRawPost,
        }
    }

    // 多组 fallback 时，无法为每个平台单独设置标签策略，使用 'none' 避免所有平台都显示标签
    return {
        strategy: 'single_add_task_default_raw',
        renderMode: 'none',
        contentProfile: 'default',
        usesRawPost: true,
    }
}

export function resolveWechatSyncTaskAccountKey(account: Pick<WechatSyncTaskAccount, 'id' | 'type' | 'title'>) {
    return account.type?.trim() || account.id?.trim() || account.title.trim()
}

export function resolveWechatSyncCompletionAccountKey(account: Pick<WechatSyncCompletionAccount, 'id' | 'title'>) {
    return account.id.trim() || account.title.trim()
}

/**
 * 通用数组合并去重函数。
 * 按 `keyFn` 返回的唯一键合并两个数组，后出现的元素覆盖先出现的。
 */
function mergeAccountsByKey<T>(
    currentAccounts: readonly T[],
    nextAccounts: readonly T[],
    keyFn: (account: T) => string,
): T[] {
    const mergedAccounts = new Map<string, T>()

    for (const account of currentAccounts) {
        mergedAccounts.set(keyFn(account), account)
    }

    for (const account of nextAccounts) {
        mergedAccounts.set(keyFn(account), account)
    }

    return Array.from(mergedAccounts.values())
}

export function mergeWechatSyncTaskAccounts(
    currentAccounts: readonly WechatSyncTaskAccount[],
    nextAccounts: readonly WechatSyncTaskAccount[],
) {
    return mergeAccountsByKey(currentAccounts, nextAccounts, resolveWechatSyncTaskAccountKey)
}

export function mergeWechatSyncCompletionAccounts(
    currentAccounts: readonly WechatSyncCompletionAccount[],
    nextAccounts: readonly WechatSyncCompletionAccount[],
) {
    return mergeAccountsByKey(currentAccounts, nextAccounts, resolveWechatSyncCompletionAccountKey)
}

export function mapCompletionAccountsToTaskAccounts(accounts: readonly WechatSyncCompletionAccount[]): WechatSyncTaskAccount[] {
    return accounts.map((account) => ({
        id: account.id,
        type: account.id,
        title: account.title,
        status: account.status,
        msg: account.msg,
        error: account.error,
        editResp: account.draftLink
            ? { draftLink: account.draftLink }
            : undefined,
    }))
}
