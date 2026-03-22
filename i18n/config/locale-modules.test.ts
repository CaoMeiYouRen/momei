import { describe, expect, it } from 'vitest'
import {
    getLocaleMessageFilePaths,
    getNuxtLocaleMessageFilePaths,
    resolveLocaleMessageModulesForRoute,
} from './locale-modules'

describe('i18n locale modules', () => {
    it('should expose only core files for nuxt initial locale loading', () => {
        expect(getNuxtLocaleMessageFilePaths('zh-CN')).toEqual([
            'zh-CN/common.json',
            'zh-CN/components.json',
            'zh-CN/public.json',
            'zh-CN/settings.json',
            'zh-CN/legal.json',
            'zh-CN/auth.json',
        ])
    })

    it('should expose all module files for server-side loading', () => {
        expect(getLocaleMessageFilePaths('zh-CN')).toEqual([
            'zh-CN/common.json',
            'zh-CN/components.json',
            'zh-CN/public.json',
            'zh-CN/settings.json',
            'zh-CN/legal.json',
            'zh-CN/auth.json',
            'zh-CN/admin.json',
            'zh-CN/admin-posts.json',
            'zh-CN/admin-taxonomy.json',
            'zh-CN/admin-submissions.json',
            'zh-CN/admin-ai.json',
            'zh-CN/admin-users.json',
            'zh-CN/admin-ad.json',
            'zh-CN/admin-external-links.json',
            'zh-CN/admin-link-governance.json',
            'zh-CN/admin-friend-links.json',
            'zh-CN/admin-marketing.json',
            'zh-CN/admin-notifications.json',
            'zh-CN/admin-settings.json',
            'zh-CN/admin-email-templates.json',
            'zh-CN/admin-snippets.json',
            'zh-CN/home.json',
            'zh-CN/demo.json',
            'zh-CN/installation.json',
            'zh-CN/feed.json',
        ])
    })

    it('should resolve auth route modules on demand', () => {
        expect(resolveLocaleMessageModulesForRoute('/en-US/login')).toEqual([
            'common',
            'components',
            'public',
            'settings',
            'legal',
            'auth',
        ])
    })

    it('should resolve home and demo modules progressively', () => {
        expect(resolveLocaleMessageModulesForRoute('/', { demoMode: true })).toEqual([
            'common',
            'components',
            'public',
            'settings',
            'legal',
            'auth',
            'home',
            'demo',
        ])
    })

    it('should resolve installation route modules with admin hints', () => {
        expect(resolveLocaleMessageModulesForRoute('/installation')).toEqual([
            'common',
            'components',
            'public',
            'settings',
            'legal',
            'auth',
            'admin',
            'admin-settings',
            'installation',
        ])
    })

    it('should resolve admin routes with the dedicated email template locale module', () => {
        expect(resolveLocaleMessageModulesForRoute('/admin/settings')).toEqual([
            'common',
            'components',
            'public',
            'settings',
            'legal',
            'auth',
            'admin',
            'admin-settings',
            'admin-email-templates',
        ])
    })

    it('should resolve admin post routes with the posts locale module', () => {
        expect(resolveLocaleMessageModulesForRoute('/admin/posts/123')).toEqual([
            'common',
            'components',
            'public',
            'settings',
            'legal',
            'auth',
            'admin',
            'admin-posts',
        ])
    })

    it('should resolve admin taxonomy routes with the shared taxonomy locale module', () => {
        expect(resolveLocaleMessageModulesForRoute('/admin/categories')).toEqual([
            'common',
            'components',
            'public',
            'settings',
            'legal',
            'auth',
            'admin',
            'admin-taxonomy',
        ])
    })
})
