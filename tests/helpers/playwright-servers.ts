/**
 * Playwright 两个配置共用的 server 地址与「未安装态第二实例」env。
 *
 * 为什么抽出来：e2e 与视觉 / parity 都需要同一个 3002 实例（`MOMEI_INSTALLED=false` 只跳过环境变量
 * 短路，仍需关掉 TEST_MODE 并用独立内存库），逐字复制两份 env 会在任一侧调整时静默分叉。
 */
export const defaultAuthSecret = 'lhci-test-secret-0123456789abcdef'

export const e2eHost = '127.0.0.1'
export const e2ePort = 3001
export const e2eBaseURL = `http://${e2eHost}:${e2ePort}`

export const installationPort = 3002
export const installationBaseURL = `http://${e2eHost}:${installationPort}`

/**
 * 安装向导第二实例的环境变量。
 *
 * - `MOMEI_INSTALLED=false`：只跳过安装中间件的环境变量短路，服务端仍按数据库探测；
 * - `TEST_MODE=false`：不跑测试种子（否则主库会被标记为已安装）；
 * - `DATABASE_PATH=:memory:`：每次启动都是干净未安装态；
 * - `DATABASE_SYNCHRONIZE=true`：内存库启动时建表，否则 `/api/install/init-db` 会因缺表 500。
 */
export function buildInstallationServerEnv(authSecret = defaultAuthSecret): string {
    return [
        'TEST_MODE=false',
        'NUXT_PUBLIC_TEST_MODE=false',
        'MOMEI_INSTALLED=false',
        'DATABASE_SYNCHRONIZE=true',
        'DATABASE_TYPE=sqlite',
        'DATABASE_PATH=:memory:',
        'DISABLE_CRON_JOB=true',
        `HOST=${e2eHost}`,
        `PORT=${installationPort}`,
        `AUTH_SECRET=${authSecret}`,
        `BETTER_AUTH_SECRET=${authSecret}`,
        `NUXT_PUBLIC_SITE_URL=${installationBaseURL}`,
        `NUXT_PUBLIC_AUTH_BASE_URL=${installationBaseURL}`,
    ].join(' ')
}

export function buildInstallationServerCommand(authSecret = defaultAuthSecret): string {
    return `pnpm exec cross-env ${buildInstallationServerEnv(authSecret)} node .output/server/index.mjs`
}
