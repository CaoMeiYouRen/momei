import { describe, expect, it } from 'vitest'
import { CAOMEI_UI_ROUTE_PREFIXES, resolveUiLibraryForRoute, resolveUiLibraryForRoutePath } from './ui-library'

describe('resolveUiLibraryForRoute', () => {
    it('未命中任何登记前缀时回退为 PrimeVue', () => {
        expect(resolveUiLibraryForRoute('/', [])).toBe('primevue')
        expect(resolveUiLibraryForRoute('/admin/posts', [])).toBe('primevue')
        expect(resolveUiLibraryForRoute('/admin', [])).toBe('primevue')
    })

    it('默认以模块级清单作为事实源', () => {
        for (const routePath of ['/', '/admin', '/admin/posts']) {
            expect(resolveUiLibraryForRoute(routePath)).toBe(
                resolveUiLibraryForRoute(routePath, CAOMEI_UI_ROUTE_PREFIXES),
            )
        }
    })

    it('命中登记前缀时解析为 caomei-ui', () => {
        const migrated = ['/admin/posts']

        expect(resolveUiLibraryForRoute('/admin/posts', migrated)).toBe('caomei-ui')
        expect(resolveUiLibraryForRoute('/admin/posts/edit', migrated)).toBe('caomei-ui')
    })

    it('前缀段匹配不应把同前缀字面量误判为已迁移', () => {
        const migrated = ['/admin']

        expect(resolveUiLibraryForRoute('/admin', migrated)).toBe('caomei-ui')
        expect(resolveUiLibraryForRoute('/admin/users', migrated)).toBe('caomei-ui')
        expect(resolveUiLibraryForRoute('/admin-posts', migrated)).toBe('primevue')
        expect(resolveUiLibraryForRoute('/administrator', migrated)).toBe('primevue')
    })

    it('归一化前导与尾部斜杠后再比较', () => {
        const migrated = ['admin/posts/']

        expect(resolveUiLibraryForRoute('/admin/posts', migrated)).toBe('caomei-ui')
        expect(resolveUiLibraryForRoute('admin/posts/', migrated)).toBe('caomei-ui')
        expect(resolveUiLibraryForRoute('/admin/posts/edit/', migrated)).toBe('caomei-ui')
    })

    it('根路由只在显式登记时才切换来源', () => {
        expect(resolveUiLibraryForRoute('/', ['/'])).toBe('caomei-ui')
        expect(resolveUiLibraryForRoute('/', ['/admin'])).toBe('primevue')
    })

    it('登记根前缀不表示全站已迁移', () => {
        expect(resolveUiLibraryForRoute('/admin', ['/'])).toBe('primevue')
        expect(resolveUiLibraryForRoute('/posts/1', ['/'])).toBe('primevue')
    })

    it('异常或未归一化输入保守回退为 PrimeVue', () => {
        const migrated = ['/admin/posts']

        expect(resolveUiLibraryForRoute('/admin/../posts', migrated)).toBe('primevue')
        expect(resolveUiLibraryForRoute('/ADMIN/POSTS', migrated)).toBe('primevue')
        expect(resolveUiLibraryForRoute('/admin%2Fposts', migrated)).toBe('primevue')
    })
})

describe('resolveUiLibraryForRoutePath', () => {
    it('登记项命中（含子路由）', () => {
        expect(CAOMEI_UI_ROUTE_PREFIXES).toContain('/admin/comments')
        expect(resolveUiLibraryForRoutePath('/admin/comments')).toBe('caomei-ui')
    })

    it('剥离已知 locale 前缀后再匹配', () => {
        expect(resolveUiLibraryForRoutePath('/en-US/admin/comments')).toBe('caomei-ui')
        expect(resolveUiLibraryForRoutePath('/zh-CN/admin/comments')).toBe('caomei-ui')
        expect(resolveUiLibraryForRoutePath('/KO-kr/admin/comments')).toBe('caomei-ui')
    })

    it('未登记的 locale 前缀路由仍回退 PrimeVue', () => {
        expect(resolveUiLibraryForRoutePath('/en-US/admin/posts')).toBe('primevue')
        expect(resolveUiLibraryForRoutePath('/admin/posts')).toBe('primevue')
    })

    it('不把两字母业务段误判为 locale 前缀', () => {
        expect(resolveUiLibraryForRoutePath('/ai/admin/comments')).toBe('primevue')
    })
})
