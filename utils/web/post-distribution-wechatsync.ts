import type { Post } from '@/types/post'
import {
    buildDistributionMaterialBundle,
    buildWechatSyncDispatchPostFromMaterialBundle,
    type DistributionMaterialBundle,
} from '@/utils/shared/distribution-template'
import {
    buildWechatSyncFailureResults,
    mapWechatSyncTaskAccountsForCompletion,
    normalizeWechatSyncAccounts,
    type WechatSyncAccount,
    type WechatSyncCompletionAccount,
    type WechatSyncTaskAccount,
} from '@/utils/shared/wechatsync'
import {
    mergeWechatSyncTaskAccounts,
    shouldFinalizeWechatSyncStatus,
} from '@/utils/shared/post-distribution-wechatsync'
import type { WechatSyncWindow } from '@/utils/web/post-distribution-dialog'

interface WechatSyncBatch {
    renderMode: 'leading' | 'wrapped' | 'none'
    contentProfile: 'default' | 'weibo'
    accounts: WechatSyncAccount[]
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

export async function runWechatSyncBatch({
    syncer,
    materialBundle,
    batch,
    onTaskAccounts,
    onReady,
    resolveFailureMessage,
}: {
    syncer: WechatSyncWindow
    materialBundle: DistributionMaterialBundle
    batch: WechatSyncBatch
    onTaskAccounts: (accounts: WechatSyncTaskAccount[]) => void
    onReady: () => void
    resolveFailureMessage: (error: unknown) => string
}) {
    return await new Promise<WechatSyncCompletionAccount[]>((resolve) => {
        const postToSync = buildWechatSyncDispatchPostFromMaterialBundle(materialBundle, {
            renderMode: batch.renderMode,
            contentProfile: batch.contentProfile,
        })

        try {
            syncer.addTask(
                {
                    post: postToSync,
                    accounts: batch.accounts,
                },
                (status) => {
                    const taskAccounts = status.accounts || []
                    if (taskAccounts.length) {
                        onTaskAccounts(taskAccounts)
                    }

                    if (shouldFinalizeWechatSyncStatus({ accounts: taskAccounts })) {
                        resolve(mapWechatSyncTaskAccountsForCompletion(taskAccounts, batch.accounts))
                    }
                },
                onReady,
            )
        } catch (error) {
            resolve(buildWechatSyncFailureResults(batch.accounts, resolveFailureMessage(error)))
        }
    })
}
