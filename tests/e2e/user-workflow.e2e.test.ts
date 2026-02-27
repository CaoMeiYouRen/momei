import { test, expect } from '@playwright/test'

test.describe('User Workflow E2E Tests', () => {
    test.describe('User Registration Flow', () => {
        test('should display registration form', async ({ page }) => {
            await page.goto('/register')

            // 验证注册表单字段存在
            await expect(page.locator('input#name')).toBeVisible()
            await expect(page.locator('input#email')).toBeVisible()
            await expect(page.locator('#password')).toBeVisible()
            await expect(page.locator('#confirmPassword')).toBeVisible()
        })

        test('should show validation errors for empty fields', async ({ page }) => {
            await page.goto('/register')
            await page.waitForLoadState('networkidle')

            const submitButton = page.locator('.register-form__submit-btn')
            await expect(submitButton).toBeVisible()

            // 直接点击提交按钮
            await submitButton.click()

            // 验证至少有一个字段进入无效态
            await expect(page.locator('.register-form .p-message').first()).toBeVisible()
        })

        test('should show validation error for mismatched passwords', async ({ page }) => {
            await page.goto('/register')
            await page.waitForLoadState('networkidle')

            // 填写表单，密码不匹配
            await page.fill('input#name', '测试用户')
            await page.fill('input#email', 'test@momei.test')
            await page.fill('input#password_input, #password input', 'password123')
            await page.fill('input#confirmPassword_input, #confirmPassword input', 'password456')

            // 点击提交
            await page.click('.register-form__submit-btn')

            // 验证确认密码字段进入无效态
            await expect(page.locator('input#confirmPassword_input, #confirmPassword input')).toHaveAttribute('aria-invalid', 'true')
        })

        test('should require agreement checkbox', async ({ page }) => {
            await page.goto('/register')
            await page.waitForLoadState('networkidle')

            // 填写表单但不勾选同意复选框
            await page.fill('input#name', '测试用户')
            await page.fill('input#email', 'test@momei.test')
            await page.fill('input#password_input, #password input', 'password123')
            await page.fill('input#confirmPassword_input, #confirmPassword input', 'password123')

            // 不勾选同意复选框，直接提交
            await page.click('.register-form__submit-btn')

            // 验证同意协议控件进入无效态
            await expect(page.locator('#agreed')).toHaveAttribute('aria-invalid', 'true')
        })

        test('should have link to login page', async ({ page }) => {
            await page.goto('/register')

            // 验证登录链接存在
            await expect(page.locator('.register-card__login-link')).toBeVisible()

            // 点击登录链接
            await page.click('.register-card__login-link')

            // 验证导航到登录页
            await expect(page).toHaveURL(/.*\/login.*/)
        })
    })

    test.describe('Password Reset Flow', () => {
        test('should display forgot password form', async ({ page }) => {
            await page.goto('/forgot-password')

            // 验证邮箱输入框存在
            await expect(page.locator('input#email')).toBeVisible()

            // 验证提交按钮存在
            await expect(page.locator('button[type="submit"]')).toBeVisible()
        })

        test('should validate email format', async ({ page }) => {
            await page.goto('/forgot-password')

            // 输入无效邮箱
            await page.fill('input#email', 'invalid-email')

            // 点击提交
            await page.click('button[type="submit"]')

            // 验证 HTML5 邮箱校验未通过
            const isValid = await page.locator('input#email').evaluate((el) => (el as HTMLInputElement).checkValidity())
            expect(isValid).toBe(false)
        })

        test('should have link back to login', async ({ page }) => {
            await page.goto('/forgot-password')

            // 验证返回登录链接存在
            await expect(page.locator('text=返回登录')).toBeVisible()

            // 点击返回登录
            await page.click('text=返回登录')

            // 验证导航到登录页
            await expect(page).toHaveURL(/.*\/login.*/)
        })
    })

    test.describe('User Settings Flow', () => {
        test.use({ storageState: 'tests/e2e/.auth/admin.json' })

        test('should display settings page', async ({ page }) => {
            // 注意：此测试需要用户已登录
            await page.goto('/settings')

            const currentUrl = page.url()
            test.skip(currentUrl.includes('/login'), 'Auth state not available for settings page')

            // 验证设置页面容器存在
            await expect(page.locator('.settings-page')).toBeVisible({ timeout: 10000 })
        })

        test.skip('should update user profile', async ({ page }) => {
            // 需要先登录
            await page.goto('/settings')

            // 等待页面加载
            await page.waitForSelector('.settings-page', { timeout: 5000 })

            // 修改用户名
            await page.fill('input[name="name"]', '新用户名')

            // 点击保存
            await page.click('button:has-text("保存")')

            // 验证保存成功提示
            await expect(page.locator('.p-toast-message-success')).toBeVisible()
        })

        test.skip('should change user avatar', async ({ page }) => {
            // 需要先登录
            await page.goto('/settings')

            // 等待页面加载
            await page.waitForSelector('.settings-page', { timeout: 5000 })

            // 点击更换头像按钮
            await page.click('button:has-text("更换头像")')

            // 验证上传对话框打开
            await expect(page.locator('.p-dialog')).toBeVisible()
        })
    })

    test.describe('Post Submission Flow', () => {
        test.use({ storageState: 'tests/e2e/.auth/admin.json' })

        test('should display submission form', async ({ page }) => {
            // 注意：此测试可能需要用户登录
            await page.goto('/submit')

            // 验证投稿表单容器存在
            await expect(page.locator('.submit-page')).toBeVisible()
        })

        test('should validate required fields', async ({ page }) => {
            await page.goto('/submit')
            await page.waitForLoadState('networkidle')

            const submitButton = page.locator('.submit-btn')
            await expect(submitButton).toBeVisible()

            // 直接点击提交
            await submitButton.click()

            // 验证必填字段进入无效态
            await expect(page.locator('.submit-form .p-message').first()).toBeVisible()
        })

        test.skip('should submit post successfully', async ({ page }) => {
            // 需要先登录
            await page.goto('/submit')

            // 等待页面加载
            await page.waitForSelector('.submit-page', { timeout: 5000 })

            // 填写投稿信息
            await page.fill('input[name="title"]', '测试投稿标题')
            await page.fill('textarea[name="content"]', '这是测试投稿内容')

            // 点击提交
            await page.click('button[type="submit"]')

            // 验证提交成功
            await expect(page.locator('.p-toast-message-success')).toBeVisible()
        })
    })

    test.describe('Public Pages', () => {
        test('should display about page', async ({ page }) => {
            await page.goto('/about')

            // 验证关于页面容器存在
            await expect(page.locator('.about-page')).toBeVisible()
        })

        test('should display privacy policy page', async ({ page }) => {
            await page.goto('/privacy-policy')

            // 验证隐私政策页面容器存在
            await expect(page.locator('h1')).toBeVisible()
        })

        test('should display user agreement page', async ({ page }) => {
            await page.goto('/user-agreement')

            // 验证用户协议页面容器存在
            await expect(page.locator('h1')).toBeVisible()
        })

        test('should display installation page', async ({ page }) => {
            await page.goto('/installation')
            await page.waitForLoadState('networkidle')

            // 系统已安装时可能重定向到首页
            if (page.url().includes('/installation')) {
                await expect(page.locator('.installation-wizard')).toBeVisible()
            } else {
                await expect(page).toHaveURL(/\/$|\/[a-z]{2}-[A-Z]{2}$|\/login|\/admin/)
            }
        })
    })
})
