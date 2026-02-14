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

    /**
     * 以管理员身份登录
     */
    async loginAsAdmin() {
        await this.page.goto('/login')

        // 填写表单
        // PrimeVue 的 InputText 渲染为 input#email
        await this.page.fill('input#email', TEST_ADMIN.email)
        // PrimeVue 的 Password 组件内部包含一个 input
        await this.page.fill('input[type="password"]', TEST_ADMIN.password)

        // 点击登录按钮
        await this.page.click('button[type="submit"]')

        // 等待登录成功跳转到首页
        await this.page.waitForURL(/\//)

        // 验证登录状态：用户菜单按钮应该可见
        await expect(this.page.locator('#user-menu-btn')).toBeVisible()
        // 登录按钮应该不可见
        await expect(this.page.locator('#login-btn')).not.toBeVisible()
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
