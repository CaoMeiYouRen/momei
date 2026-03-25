import { describe, expect, it } from 'vitest'
import { buildDistributionMaterialBundle } from './distribution-template'
import {
    buildWechatSyncPrecheckNotices,
    type WechatSyncPrecheckTranslator,
} from './post-distribution-precheck'

const translate: WechatSyncPrecheckTranslator = (key, params) => {
    if (!params) {
        return key
    }

    return `${key}:${Object.entries(params).map(([name, value]) => `${name}=${value}`).join('|')}`
}

describe('post-distribution-precheck', () => {
    const basePost = {
        id: 'post-1',
        title: 'WechatSync 预检',
        slug: 'wechatsync-precheck',
        content: '## 标题\n\n> 引用内容\n\n<figure class="image"><img src="https://static.example.com/figure.png" /></figure>',
        summary: '摘要',
        coverImage: null,
        language: 'zh-CN',
        copyright: 'all-rights-reserved',
        author: {
            id: 'author-1',
            name: 'Momei Author',
        },
        tags: [],
    }

    it('builds warn notices for weibo-compatible downgrades when supportTypes identify the account', () => {
        const materialBundle = buildDistributionMaterialBundle(basePost, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const notices = buildWechatSyncPrecheckNotices(materialBundle, [
            {
                id: 'wechat',
                type: 'official_account',
                title: '微博专栏',
                supportTypes: ['weibo_article'],
                checked: true,
            },
        ], translate)

        expect(notices).toEqual([
            expect.objectContaining({
                key: 'weibo-adjustments',
                severity: 'warn',
            }),
        ])
        expect(notices[0]?.detail).toContain('accounts=微博专栏')
    })

    it('builds blocking notices when weibo content still contains unsupported structures', () => {
        const materialBundle = buildDistributionMaterialBundle({
            ...basePost,
            content: '::: tip\n提示\n:::\n\n<iframe src="https://example.com/embed"></iframe>',
        }, {
            siteUrl: 'https://momei.app',
            defaultLicense: 'all-rights-reserved',
        })

        const notices = buildWechatSyncPrecheckNotices(materialBundle, [
            {
                id: 'weibo',
                type: 'weibo',
                title: '微博',
                checked: true,
            },
        ], translate)

        expect(notices).toEqual([
            expect.objectContaining({
                key: 'weibo-blockers',
                severity: 'danger',
            }),
        ])
        expect(notices[0]?.detail).toContain('components=embedded-media, custom-block')
    })
})
