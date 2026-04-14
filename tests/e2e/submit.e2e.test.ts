import { test, expect, type Page } from '@playwright/test'

test.describe('Submit Page E2E Tests', () => {
    async function submitForm(page: Page) {
        const submitButton = page.locator('.submit-btn')
        await expect(submitButton).toBeVisible()
        await expect(submitButton).toBeEnabled()
        await submitButton.click()
    }

    test('should show validation errors when required fields are empty', async ({ page }) => {
        await page.goto('/submit')
        await expect(page.locator('.submit-page')).toBeVisible()
        await page.waitForLoadState('networkidle')

        const submitButton = page.locator('.submit-btn')
        await expect(submitButton).toBeVisible()

        await submitForm(page)

        await expect(page.locator('body')).toContainText('标题不能为空')
        await expect(page.locator('body')).toContainText('内容太少，请填写至少 10 个字符')
        await expect(page.locator('body')).toContainText('姓名不能为空')
        await expect(page.locator('body')).toContainText('无效的邮箱地址')
    })

    test('should submit successfully with valid payload', async ({ page }) => {
        let submissionReceived = false
        let capturedPayload: Record<string, unknown> | null = null

        await page.route('**/api/posts/submissions', async (route) => {
            submissionReceived = true
            capturedPayload = route.request().postDataJSON() as Record<string, unknown>
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    code: 200,
                    data: {
                        id: 'test-submission-id',
                    },
                }),
            })
        })

        await page.goto('/submit')
        await expect(page.locator('.submit-page')).toBeVisible()
        await page.waitForLoadState('networkidle')

        await page.fill('#title', 'Playwright Submission Title')
        await page.fill('#content', 'This is a valid markdown content for submission test.')
        await page.fill('#name', 'Playwright User')
        await page.fill('#email', 'playwright@example.com')
        await page.fill('#url', 'https://example.com')

        await submitForm(page)

        await expect.poll(() => submissionReceived).toBe(true)
        await expect.poll(() => capturedPayload?.title).toBe('Playwright Submission Title')
        await expect.poll(() => capturedPayload?.contributorName).toBe('Playwright User')
        await expect.poll(() => capturedPayload?.contributorEmail).toBe('playwright@example.com')

        await expect(page.locator('#title')).toHaveValue('')
        await expect(page.locator('#content')).toHaveValue('')
        await expect(page.locator('#name')).toHaveValue('')
        await expect(page.locator('#email')).toHaveValue('')
        await expect(page.locator('#url')).toHaveValue('')
    })
})
