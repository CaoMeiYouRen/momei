import { type Page, expect } from '@playwright/test'

/**
 * 测试环境下的管理员账户
 */
export const TEST_ADMIN = {
    email: 'test@momei.test',
    password: 'Password123',
}

/**
 * 封装常用的身份验证操作
 */
export class AuthHelper {
    private page: Page
    constructor(page: Page) {
        this.page = page
    }

    private async seedAdminSession() {
        const baseUrl = new URL(this.page.url()).origin
        const loginResponse = await this.page.request.post(`${baseUrl}/api/auth/sign-in/email`, {
            headers: {
                'Content-Type': 'application/json',
                Origin: baseUrl,
            },
            data: {
                email: TEST_ADMIN.email,
                password: TEST_ADMIN.password,
                rememberMe: true,
            },
        })

        if (!loginResponse.ok()) {
            throw new Error(`Failed to seed admin session: ${loginResponse.status()} ${await loginResponse.text()}`)
        }
    }

    private async hasAuthenticatedShell() {
        const loginButton = this.page.locator('#login-btn')
        if (await loginButton.count() > 0) {
            return false
        }

        const authEntrypoints = [
            this.page.locator('#user-menu-btn'),
            this.page.locator('#admin-menu-btn'),
            this.page.locator('.mobile-user-button'),
        ]

        for (const locator of authEntrypoints) {
            try {
                if (await locator.first().isVisible()) {
                    return true
                }
            } catch {
                // Ignore detached/hidden locator errors and continue probing.
            }
        }

        return false
    }

    private async expectAuthenticatedShell() {
        await this.page.waitForLoadState('domcontentloaded')

        await expect(this.page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 })

        const loginButton = this.page.locator('#login-btn')
        await expect(loginButton).toHaveCount(0, { timeout: 20000 })

        const authEntrypoints = [
            this.page.locator('#user-menu-btn'),
            this.page.locator('#admin-menu-btn'),
            this.page.locator('.mobile-user-button'),
            this.page.locator('.mobile-only .pi-bars').locator('..'),
        ]

        await expect(async () => {
            const visibleStates = await Promise.all(
                authEntrypoints.map(async (locator) => {
                    try {
                        return await locator.first().isVisible()
                    } catch {
                        return false
                    }
                }),
            )

            expect(visibleStates.some(Boolean)).toBe(true)
        }).toPass({ timeout: 20000 })
    }

    /**
     * 以管理员身份登录
     */
    async loginAsAdmin() {
        await this.page.goto('/login')
        await this.page.waitForLoadState('domcontentloaded')

        // 填写表单
        // PrimeVue 的 InputText 渲染为 input#email
        const emailInput = this.page.locator('input#email')
        await expect(emailInput).toBeVisible()
        await emailInput.fill(TEST_ADMIN.email)

        // PrimeVue 的 Password 组件内部包含一个 input
        const passwordInput = this.page.locator('#password input')
        await expect(passwordInput).toBeVisible()
        await passwordInput.fill(TEST_ADMIN.password)

        // 点击登录按钮
        const leaveLoginPage = this.page.waitForURL((url) => !/^\/login\/?$/.test(url.pathname), {
            timeout: 20000,
        })

        await Promise.all([
            leaveLoginPage,
            this.page.click('button[type="submit"]'),
        ])

        await this.expectAuthenticatedShell()
    }

    async ensureAdminSession() {
        await this.page.goto('/')
        await this.page.waitForLoadState('domcontentloaded')

        if (await this.hasAuthenticatedShell()) {
            return
        }

        await this.seedAdminSession()
        await this.page.goto('/')
        await this.expectAuthenticatedShell()
    }

    /**
     * 注销登录
     */
    async logout() {
        const userMenuBtn = this.page.locator('#user-menu-btn')
        if (await userMenuBtn.count() > 0) {
            await userMenuBtn.click()
            // 在 PrimeVue Menu 中搜索包含注销文字的项并点击
            // 假设菜单项文本包含注销或 Logout
            await this.page.click('li[role="menuitem"] >> text=注销, text=Logout')

            // 等待退出后，登录按钮应该重新出现
            await expect(this.page.locator('#login-btn')).toBeVisible()
        }
    }
}
