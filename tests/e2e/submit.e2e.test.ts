import { test, expect } from '@playwright/test'

test.describe('Submit Page E2E Tests', () => {
    test('should show validation errors when required fields are empty', async ({ page }) => {
        await page.goto('/submit')
        await page.waitForLoadState('networkidle')

        const submitButton = page.locator('.submit-btn')
        await expect(submitButton).toBeVisible()

        await submitButton.click()

        const errorMessages = page.locator('.p-message.p-message-error')
        await expect(errorMessages.first()).toBeVisible()
        await expect(errorMessages).toHaveCount(4)
    })

    test('should submit successfully with valid payload', async ({ page }) => {
        await page.route('**/api/posts/submissions', async (route) => {
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
        await page.waitForLoadState('networkidle')

        await page.fill('#title', 'Playwright Submission Title')
        await page.fill('#content', 'This is a valid markdown content for submission test.')
        await page.fill('#name', 'Playwright User')
        await page.fill('#email', 'playwright@example.com')
        await page.fill('#url', 'https://example.com')

        await page.click('.submit-btn')

        await expect(page.locator('.p-toast-message-success').first()).toBeVisible()

        await expect(page.locator('#title')).toHaveValue('')
        await expect(page.locator('#content')).toHaveValue('')
        await expect(page.locator('#name')).toHaveValue('')
        await expect(page.locator('#email')).toHaveValue('')
    })
})
