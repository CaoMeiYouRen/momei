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

export function mergeWechatSyncTaskAccounts(
    currentAccounts: readonly WechatSyncTaskAccount[],
    nextAccounts: readonly WechatSyncTaskAccount[],
) {
    const mergedAccounts = new Map<string, WechatSyncTaskAccount>()

    for (const account of currentAccounts) {
        mergedAccounts.set(resolveWechatSyncTaskAccountKey(account), account)
    }

    for (const account of nextAccounts) {
        mergedAccounts.set(resolveWechatSyncTaskAccountKey(account), account)
    }

    return Array.from(mergedAccounts.values())
}

export function mergeWechatSyncCompletionAccounts(
    currentAccounts: readonly WechatSyncCompletionAccount[],
    nextAccounts: readonly WechatSyncCompletionAccount[],
) {
    const mergedAccounts = new Map<string, WechatSyncCompletionAccount>()

    for (const account of currentAccounts) {
        mergedAccounts.set(resolveWechatSyncCompletionAccountKey(account), account)
    }

    for (const account of nextAccounts) {
        mergedAccounts.set(resolveWechatSyncCompletionAccountKey(account), account)
    }

    return Array.from(mergedAccounts.values())
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
