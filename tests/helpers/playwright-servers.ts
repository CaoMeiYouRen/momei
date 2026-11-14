/**
 * Playwright 两个配置共用的 server 地址与「未安装态第二实例」env。
 *
 * 为什么抽出来：e2e 与视觉 / parity 都需要同一个 3002 实例（`MOMEI_INSTALLED=false` 只跳过环境变量
 * 短路，仍需关掉 TEST_MODE 并用独立内存库），逐字复制两份 env 会在任一侧调整时静默分叉。
 */
export const defaultAuthSecret = 'lhci-test-secret-0123456789abcdef'

/** E2E / 视觉层共用的 loopback 主机；只接受 loopback，避免把 TEST_MODE 种子服务暴露到全网卡。 */
export function resolveE2eHost(value: string | undefined) {
    if (!value) {
        return '127.0.0.1'
    }

    if (value !== '127.0.0.1' && value !== 'localhost') {
        throw new Error(`[playwright-servers] E2E_HOST 只支持 loopback（127.0.0.1 / localhost），收到: ${value}`)
    }

    return value
}

/** 端口允许用环境变量覆盖：本机 3001 / 3002 可能被其他常驻应用占用，CI 默认端口保持不变。 */
export function resolvePort(value: string | undefined, fallback: number) {
    if (!value) {
        return fallback
    }

    if (!/^\d+$/u.test(value)) {
        throw new Error(`[playwright-servers] 非法端口: ${value}`)
    }

    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error(`[playwright-servers] 非法端口: ${value}`)
    }

    return parsed
}

export const e2eHost = resolveE2eHost(process.env.E2E_HOST)
export const e2ePort = resolvePort(process.env.E2E_PORT, 3001)
export const e2eBaseURL = `http://${e2eHost}:${e2ePort}`

export const installationPort = resolvePort(process.env.E2E_INSTALLATION_PORT, 3002)
export const installationBaseURL = `http://${e2eHost}:${installationPort}`

if (e2ePort === installationPort) {
    throw new Error(`[playwright-servers] E2E_PORT 与 E2E_INSTALLATION_PORT 不能相同（${e2ePort}）`)
}

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
