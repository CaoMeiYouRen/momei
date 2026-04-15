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

    const notices: WechatSyncPrecheckNotice[] = []
    const appendCompatibilityNotices = (
        profile: 'weibo' | 'xiaohongshu',
        profileAccounts: readonly WechatSyncAccount[],
        titlePrefix: 'weibo' | 'xiaohongshu',
    ) => {
        if (!profileAccounts.length) {
            return
        }

        const compatibility = inspectWechatSyncMaterialCompatibility(materialBundle, profile)
        const accountsLabel = formatWechatSyncAccountTitles(profileAccounts)

        if (compatibility.adjustments.length) {
            notices.push({
                key: `${titlePrefix}-adjustments`,
                severity: 'warn',
                summary: translate(`pages.admin.posts.distribution.precheck.${titlePrefix}_adjusted_title`),
                detail: translate(`pages.admin.posts.distribution.precheck.${titlePrefix}_adjusted_detail`, {
                    accounts: accountsLabel,
                }),
            })
        }

        if (compatibility.blockers.length) {
            notices.push({
                key: `${titlePrefix}-blockers`,
                severity: 'danger',
                summary: translate(`pages.admin.posts.distribution.precheck.${titlePrefix}_blocking_title`),
                detail: translate(`pages.admin.posts.distribution.precheck.${titlePrefix}_blocking_detail`, {
                    accounts: accountsLabel,
                    components: compatibility.blockers.join(', '),
                }),
            })
        }
    }

    appendCompatibilityNotices(
        'weibo',
        accounts.filter((account) => resolveWechatSyncAccountContentProfile(account) === 'weibo'),
        'weibo',
    )
    appendCompatibilityNotices(
        'xiaohongshu',
        accounts.filter((account) => resolveWechatSyncAccountContentProfile(account) === 'xiaohongshu'),
        'xiaohongshu',
    )

    return notices
}
