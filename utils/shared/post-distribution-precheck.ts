import {
    inspectWechatSyncMaterialCompatibility,
    type DistributionMaterialBundle,
} from './distribution-template'
import { resolveWechatSyncAccountContentProfile } from './distribution-tags'
import type { WechatSyncAccount } from './wechatsync'

export interface WechatSyncPrecheckNotice {
    key: string
    severity: 'warn' | 'danger'
    summary: string
    detail: string
}

export interface WechatSyncPrecheckTranslateParams {
    accounts?: string
    components?: string
}

export type WechatSyncPrecheckTranslator = (key: string, params?: WechatSyncPrecheckTranslateParams) => string

function formatWechatSyncAccountTitles(accounts: readonly WechatSyncAccount[]) {
    return accounts.map((account) => account.title).join(', ')
}

export function buildWechatSyncPrecheckNotices(
    materialBundle: DistributionMaterialBundle | null,
    accounts: readonly WechatSyncAccount[],
    translate: WechatSyncPrecheckTranslator,
): WechatSyncPrecheckNotice[] {
    if (!materialBundle || !accounts.length) {
        return []
    }

    const weiboAccounts = accounts.filter((account) => resolveWechatSyncAccountContentProfile(account) === 'weibo')
    if (!weiboAccounts.length) {
        return []
    }

    const compatibility = inspectWechatSyncMaterialCompatibility(materialBundle, 'weibo')
    const notices: WechatSyncPrecheckNotice[] = []
    const accountsLabel = formatWechatSyncAccountTitles(weiboAccounts)

    if (compatibility.adjustments.length) {
        notices.push({
            key: 'weibo-adjustments',
            severity: 'warn',
            summary: translate('pages.admin.posts.distribution.precheck.weibo_adjusted_title'),
            detail: translate('pages.admin.posts.distribution.precheck.weibo_adjusted_detail', {
                accounts: accountsLabel,
            }),
        })
    }

    if (compatibility.blockers.length) {
        notices.push({
            key: 'weibo-blockers',
            severity: 'danger',
            summary: translate('pages.admin.posts.distribution.precheck.weibo_blocking_title'),
            detail: translate('pages.admin.posts.distribution.precheck.weibo_blocking_detail', {
                accounts: accountsLabel,
                components: compatibility.blockers.join(', '),
            }),
        })
    }

    return notices
}
