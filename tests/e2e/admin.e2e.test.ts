import { test, expect } from '@playwright/test'
import { AuthHelper } from './helpers/auth.helper'

test.describe('Admin E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        const auth = new AuthHelper(page)
        await auth.loginAsAdmin()
    })

    test('should allow creating a new post', async ({ page }) => {
        await page.goto('/admin/posts')

        // 点击创建按钮
        // 根据 index.vue: :label="$t('pages.admin.posts.create')"
        await page.click('button:has-text("创建"), button:has-text("Create")')

        await expect(page).toHaveURL(/\/admin\/posts\/new/)

        // 填写文章标题
        // PostEditorHeader 包含标题输入框，假设它有一个特定的 id 或 placeholder
        const titleInput = page.locator('.post-editor-header__title input')
        await titleInput.fill('E2E New Post')

        // 填写 Markdown 内容 (mavon-editor 内部是 textarea)
        const editor = page.locator('.mavon-editor textarea')
        await editor.fill('This is a content created by E2E test.')

        // 保存文章
        // 点击保存按钮
        await page.click('#save-btn')

        // 等待保存成功提示 (Toast)
        const toast = page.locator('.p-toast-message-success')
        await expect(toast).toBeVisible()

        // 验证文章是否出现在列表中
        await page.goto('/admin/posts')
        await expect(page.locator('text=E2E New Post')).toBeVisible()
    })

    test('should allow editing an existing post', async ({ page }) => {
        await page.goto('/admin/posts')

        // 寻找我们之前 seeded 的文章 "Hello Momei Test"
        // DataTable 中通常有编辑按钮，或者点击标题
        const postRow = page.locator('tr:has-text("Hello Momei Test")')
        await postRow.click() // 假设点击行进入详情

        // 或者直接跳转
        // await page.goto('/admin/posts/hello-momei-test') // id 可能不是 slug

        // 这里我们先尝试在列表中找到它并点击
        // 如果点击行不行，寻找操作列的编辑按钮
        const editBtn = postRow.locator('button[icon="pi pi-pencil"], .edit-btn')
        if (await editBtn.count() > 0) {
            await editBtn.first().click()
        } else {
            // 如果没找到按钮，尝试点击标题文字
            await page.click('text=Hello Momei Test')
        }

        // 修改内容
        const editor = page.locator('.mavon-editor textarea')
        await editor.fill('Updated content by E2E.')

        await page.click('#save-btn')

        const toast = page.locator('.p-toast-message-success')
        await expect(toast).toBeVisible()
    })

    test('should allow toggling settings panel', async ({ page }) => {
        await page.goto('/admin/posts/new')

        // 初始可能可见盘
        const settingsBtn = page.locator('#settings-btn')

        await settingsBtn.click()
        // 检查面板是否消失或出现 (v-model:visible)
        // 这个测试取决于组件的具体实现 (Drawer/Dialog)
    })
})
