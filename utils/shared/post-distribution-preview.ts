import {
    buildWechatSyncPostFromMaterialBundle,
    inspectWechatSyncMaterialCompatibility,
    type DistributionMaterialBundle,
} from './distribution-template'
import { groupWechatSyncAccountsByTagRenderMode, renderDistributionTags } from './distribution-tags'
import { resolveWechatSyncAccountKey, type WechatSyncAccount } from './wechatsync'

export interface MemosDistributionPreview {
    title: string
    summary: string
    coverUrl: string | null
    tagLine: string
    copyrightMarkdown: string
    content: string
}

export interface WechatSyncDistributionPreviewGroup {
    key: string
    accounts: WechatSyncAccount[]
    accountsLabel: string
    contentProfile: 'default' | 'weibo'
    title: string
    summary: string
    coverUrl: string | null
    bodyMarkdown: string
    tagLine: string
    copyrightMarkdown: string
    finalMarkdown: string
    compatibility: {
        adjustments: string[]
        blockers: string[]
    }
}

function formatWechatSyncAccountTitles(accounts: readonly WechatSyncAccount[]) {
    return accounts.map((account) => account.title).join(', ')
}

export function buildMemosDistributionPreview(materialBundle: DistributionMaterialBundle): MemosDistributionPreview {
    return {
        title: materialBundle.canonical.title,
        summary: materialBundle.canonical.summaryPlain,
        coverUrl: materialBundle.canonical.coverUrl,
        tagLine: renderDistributionTags(materialBundle.canonical.tags, 'leading'),
        copyrightMarkdown: materialBundle.canonical.copyrightMarkdown,
        content: materialBundle.channels.memos.content,
    }
}

export function buildWechatSyncDistributionPreviewGroups(
    materialBundle: DistributionMaterialBundle,
    accounts: readonly WechatSyncAccount[],
) {
    return groupWechatSyncAccountsByTagRenderMode(accounts).map<WechatSyncDistributionPreviewGroup>((group) => {
        const payload = buildWechatSyncPostFromMaterialBundle(materialBundle, {
            renderMode: group.renderMode,
            contentProfile: group.contentProfile,
        })

        return {
            key: `${group.renderMode}:${group.contentProfile}:${group.accounts.map((account) => resolveWechatSyncAccountKey(account)).join('|')}`,
            accounts: group.accounts,
            accountsLabel: formatWechatSyncAccountTitles(group.accounts),
            contentProfile: group.contentProfile,
            title: payload.title,
            summary: payload.desc,
            coverUrl: payload.thumb || null,
            bodyMarkdown: materialBundle.channels.wechatsync.basePost.markdown,
            tagLine: renderDistributionTags(materialBundle.canonical.tags, group.renderMode),
            copyrightMarkdown: materialBundle.canonical.copyrightMarkdown,
            finalMarkdown: payload.markdown,
            compatibility: inspectWechatSyncMaterialCompatibility(materialBundle, group.contentProfile),
        }
    })
}
