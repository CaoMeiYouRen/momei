import { describe, expect, it } from 'vitest'
import {
    groupWechatSyncAccountsByTagRenderMode,
    normalizeDistributionTags,
    renderDistributionTags,
    resolveWechatSyncAccountContentProfile,
    resolveWechatSyncContentProfile,
    resolveWechatSyncTagRenderMode,
    sanitizeDistributionTagName,
} from './distribution-tags'

describe('distribution-tags', () => {
    it('sanitizes hashtag text and removes surrounding hash markers', () => {
        expect(sanitizeDistributionTagName(' #Nuxt 3# ')).toBe('Nuxt-3')
        expect(sanitizeDistributionTagName('（测试）/Tag')).toBe('测试-Tag')
    })

    it('deduplicates tags by translation cluster and enforces limits', () => {
        const normalizedTags = normalizeDistributionTags([
            { id: '1', slug: 'nuxt', name: 'Nuxt', translationId: 'cluster-nuxt' },
            { id: '2', slug: 'nuxt-zh', name: '#Nuxt 中文#', translationId: 'cluster-nuxt' },
            { id: '3', slug: 'typescript', name: 'TypeScript' },
            { id: '4', slug: 'invalid', name: '###' },
        ], {
            maxCount: 5,
            maxLength: 10,
        })

        expect(normalizedTags).toEqual([
            {
                clusterKey: 'cluster-nuxt',
                rawName: 'Nuxt',
                sanitizedName: 'Nuxt',
            },
            {
                clusterKey: 'typescript',
                rawName: 'TypeScript',
                sanitizedName: 'TypeScript',
            },
        ])
    })

    it('renders tag lines in leading and wrapped modes', () => {
        const tags = normalizeDistributionTags([
            { id: '1', slug: 'nuxt', name: 'Nuxt' },
            { id: '2', slug: 'typescript', name: 'TypeScript' },
        ])

        expect(renderDistributionTags(tags, 'leading')).toBe('#Nuxt #TypeScript')
        expect(renderDistributionTags(tags, 'wrapped')).toBe('#Nuxt# #TypeScript#')
        expect(renderDistributionTags(tags, 'none')).toBe('')
    })

    it('maps platforms to the correct tag render mode', () => {
        expect(resolveWechatSyncTagRenderMode('bilibili_article')).toBe('wrapped')
        expect(resolveWechatSyncTagRenderMode('weibo')).toBe('none')
        expect(resolveWechatSyncTagRenderMode('xiaohongshu')).toBe('leading')
        expect(resolveWechatSyncTagRenderMode('twitter')).toBe('leading')
        expect(resolveWechatSyncTagRenderMode('unknown-platform')).toBe('none')
    })

    it('maps platforms to the correct content profile', () => {
        expect(resolveWechatSyncContentProfile('weibo')).toBe('weibo')
        expect(resolveWechatSyncContentProfile('weibo_article')).toBe('weibo')
        expect(resolveWechatSyncContentProfile('xiaohongshu')).toBe('default')
    })

    it('detects weibo accounts from support types and localized titles', () => {
        expect(resolveWechatSyncAccountContentProfile({
            id: 'wechat',
            type: 'official_account',
            title: '微博专栏',
            supportTypes: ['html', 'weibo_article'],
        })).toBe('weibo')
    })

    it('groups selected accounts by tag render mode', () => {
        const groups = groupWechatSyncAccountsByTagRenderMode([
            { id: 'a', type: 'official_account', title: '微博', supportTypes: ['weibo_article'], checked: true },
            { id: 'b', type: 'bilibili_article', title: 'B 站', checked: true },
            { id: 'c', type: 'xiaohongshu', title: '小红书', checked: true },
            { id: 'd', type: 'unknown', title: '未知', checked: true },
        ])

        expect(groups).toEqual([
            {
                renderMode: 'none',
                contentProfile: 'weibo',
                accounts: [
                    { id: 'a', type: 'official_account', title: '微博', supportTypes: ['weibo_article'], checked: true },
                ],
            },
            {
                renderMode: 'wrapped',
                contentProfile: 'default',
                accounts: [
                    { id: 'b', type: 'bilibili_article', title: 'B 站', checked: true },
                ],
            },
            {
                renderMode: 'leading',
                contentProfile: 'default',
                accounts: [
                    { id: 'c', type: 'xiaohongshu', title: '小红书', checked: true },
                ],
            },
            {
                renderMode: 'none',
                contentProfile: 'default',
                accounts: [
                    { id: 'd', type: 'unknown', title: '未知', checked: true },
                ],
            },
        ])
    })
})
