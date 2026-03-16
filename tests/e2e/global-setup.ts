import fs from 'fs'
import path from 'path'
import { chromium, type FullConfig } from '@playwright/test'
import { TEST_ADMIN } from './helpers/auth.helper'

/**
 * Playwright 全局设置
 * 在所有测试运行前创建测试管理员账户
 */
async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3001'
    const authFile = path.resolve(process.cwd(), 'tests/e2e/.auth/admin.json')
    const browser = await chromium.launch()
    const context = await browser.newContext({
        baseURL,
    })
    const page = await context.newPage()

    // 通用请求头，包含 Origin
    const headers = {
        'Content-Type': 'application/json',
        Origin: baseURL,
    }

    try {
        // 等待服务器就绪
        console.log('[Global Setup] Waiting for server to be ready...')
        await page.goto('/', { timeout: 60000 })
        console.log('[Global Setup] Server is ready')

        // 测试模式下会通过 seed-test 插件异步预置数据，这里给其预留就绪时间
        const maxInstallCheckAttempts = 20
        for (let i = 0; i < maxInstallCheckAttempts; i++) {
            const installStatusResponse = await page.request.get(`${baseURL}/api/install/status`)
            const installStatus = await installStatusResponse.json()

            if (installStatus.data?.installed) {
                console.log('[Global Setup] System already installed')
                break
            }

            if (i === 0) {
                console.log('[Global Setup] System not installed yet, waiting for test seed...')
            }

            await page.waitForTimeout(500)
        }

        // 保存登录状态以供后续测试使用
        console.log('[Global Setup] Logging in to save authentication state...')

        const maxLoginAttempts = 20
        let loggedIn = false

        for (let i = 0; i < maxLoginAttempts; i++) {
            const loginResponse = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
                headers,
                data: {
                    email: TEST_ADMIN.email,
                    password: TEST_ADMIN.password,
                    rememberMe: true,
                },
            })

            if (loginResponse.ok()) {
                const authDir = path.dirname(authFile)
                if (!fs.existsSync(authDir)) {
                    fs.mkdirSync(authDir, { recursive: true })
                }
                await context.storageState({ path: authFile })
                console.log('[Global Setup] Authentication state saved')
                loggedIn = true
                break
            }

            const errorText = await loginResponse.text()
            if (i === maxLoginAttempts - 1) {
                console.log('[Global Setup] Login failed:', loginResponse.status(), errorText)
            }
            await page.waitForTimeout(500)
        }

        if (!loggedIn) {
            console.log('[Global Setup] Admin auth state not available, related tests may be skipped')
        }

    } catch (error) {
        console.error('[Global Setup] Error:', error)
        // 不抛出错误，让测试继续运行（admin 测试会被跳过）
    } finally {
        await context.close()
        await browser.close()
    }
}

export default globalSetup
