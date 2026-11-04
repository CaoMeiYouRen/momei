import type { Page } from '@playwright/test'

/**
 * 安装向导视觉门禁共用的状态响应。
 *
 * 为什么必须固定：真实 `/api/install/status` 会返回机器相关字段（node / OS / DB 版本）与真实安装态；
 * 一旦数据库已安装，客户端会 `navigateTo('/')` 形成重定向。固定 payload 让「参考态采集」与
 * 「当前态比对」渲染同一份数据，差异只可能来自组件迁移。
 */
export const INSTALLATION_STATUS_PAYLOAD = {
    data: {
        installed: false,
        databaseConnected: true,
        hasUsers: false,
        hasInstallationFlag: false,
        envInstallationFlag: false,
        nodeVersion: 'v24.0.0',
        os: 'linux',
        databaseType: 'sqlite',
        databaseVersion: '3.49.1',
        isServerless: false,
        isNodeVersionSafe: true,
        runtime: 'self-hosted-node',
        envSettings: {},
        deploymentDiagnostics: {
            runtime: 'self-hosted-node',
            platformSupported: true,
            blockerCount: 0,
            warningCount: 0,
            hasBlockingIssues: false,
            issues: [],
        },
    },
}

/** 拦截 `/api/install/status` 并固定返回未安装态。 */
export async function mockInstallationStatus(page: Page): Promise<void> {
    await page.route('**/api/install/status', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(INSTALLATION_STATUS_PAYLOAD),
        })
    })
}
