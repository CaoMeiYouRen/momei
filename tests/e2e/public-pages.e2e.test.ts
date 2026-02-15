import { test, expect } from '@playwright/test'

test.describe('Public Pages Reachability', () => {
    const pages = [
        { path: '/archives', title: /归档|Archives/ },
        { path: '/categories', title: /分类|Categories/ },
        { path: '/tags', title: /标签|Tags/ },
        { path: '/about', title: /关于|About/ },
        { path: '/privacy-policy', title: /政策|协议|Policy|Agreement/ },
        { path: '/user-agreement', title: /协议|Agreement/ },
        { path: '/submit', title: /投稿|Submit/ },
    ]

    for (const page of pages) {
        test(`should load ${page.path} correctly`, async ({ page: p }) => {
            await p.goto(page.path)
            await p.waitForLoadState('networkidle')

            // 验证标题
            const title = await p.title()
            expect(title).toMatch(page.title)

            // 验证主要内容区域是否存在
            const mainContent = p.locator('main, #app, .layout-content')
            await expect(mainContent.first()).toBeVisible()
        })
    }
})
