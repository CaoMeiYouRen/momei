/* eslint-disable no-console */
import { chromium, type FullConfig } from '@playwright/test'
import { TEST_ADMIN } from './helpers/auth.helper'

/**
 * Playwright 全局设置
 * 在所有测试运行前创建测试管理员账户
 */
async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3001'
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

        // 检查系统是否已安装
        const installStatusResponse = await page.request.get(`${baseURL}/api/install/status`)
        const installStatus = await installStatusResponse.json()

        if (installStatus.data?.installed) {
            console.log('[Global Setup] System already installed')
        } else {
            console.log('[Global Setup] System not installed, proceeding with setup...')
        }

        // 尝试创建测试管理员账户（通过 Better-Auth 注册 API）
        console.log('[Global Setup] Creating test admin account...')

        const registerResponse = await page.request.post(`${baseURL}/api/auth/sign-up/email`, {
            headers,
            data: {
                email: TEST_ADMIN.email,
                password: TEST_ADMIN.password,
                name: 'Test Admin',
            },
        })

        if (registerResponse.ok()) {
            console.log('[Global Setup] Test admin account created successfully')

            // 第一个用户会自动成为管理员
            console.log('[Global Setup] Account setup complete')
        } else {
            const errorText = await registerResponse.text()
            // 如果用户已存在，这是正常的
            if (errorText.includes('already') || errorText.includes('exists') || registerResponse.status() === 409) {
                console.log('[Global Setup] Test admin account already exists')
            } else {
                console.log('[Global Setup] Registration response:', registerResponse.status(), errorText)
            }
        }

        // 保存登录状态以供后续测试使用
        console.log('[Global Setup] Logging in to save authentication state...')

        const loginResponse = await page.request.post(`${baseURL}/api/auth/sign-in/email`, {
            headers,
            data: {
                email: TEST_ADMIN.email,
                password: TEST_ADMIN.password,
                rememberMe: true,
            },
        })

        if (loginResponse.ok()) {
            // 保存认证状态
            await context.storageState({ path: './tests/e2e/.auth/admin.json' })
            console.log('[Global Setup] Authentication state saved')
        } else {
            const errorText = await loginResponse.text()
            console.log('[Global Setup] Login failed:', loginResponse.status(), errorText)
            console.log('[Global Setup] Admin tests may be skipped')
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
