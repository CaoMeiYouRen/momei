import { afterEach, describe, expect, it, vi } from 'vitest'

const MANAGED_ENV_KEYS = ['E2E_HOST', 'E2E_INSTALLATION_PORT', 'E2E_PORT'] as const
const originalEnv = Object.fromEntries(MANAGED_ENV_KEYS.map((key) => [key, process.env[key]])) as Record<string, string | undefined>

async function loadServers(env: Record<string, string | undefined> = {}) {
    vi.resetModules()
    vi.unstubAllEnvs()

    // shell 里真实导出的被测键必须显式删除，否则「默认值」用例会读到宿主环境
    for (const key of MANAGED_ENV_KEYS) {
        delete process.env[key]
    }

    for (const [key, value] of Object.entries(env)) {
        vi.stubEnv(key, value)
    }

    return import('./playwright-servers')
}

afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    for (const key of MANAGED_ENV_KEYS) {
        const value = originalEnv[key]
        if (value === undefined) {
            delete process.env[key]
        } else {
            process.env[key] = value
        }
    }
})

describe('playwright-servers 端口与主机解析', () => {
    it('未设置环境变量时使用 3001 / 3002 与 loopback', async () => {
        const servers = await loadServers()

        expect(servers.e2eHost).toBe('127.0.0.1')
        expect(servers.e2ePort).toBe(3001)
        expect(servers.installationPort).toBe(3002)
        expect(servers.e2eBaseURL).toBe('http://127.0.0.1:3001')
        expect(servers.installationBaseURL).toBe('http://127.0.0.1:3002')
    })

    it('允许环境变量覆盖主机与两个端口', async () => {
        const servers = await loadServers({
            E2E_HOST: 'localhost',
            E2E_INSTALLATION_PORT: '3012',
            E2E_PORT: '3011',
        })

        expect(servers.e2eHost).toBe('localhost')
        expect(servers.e2eBaseURL).toBe('http://localhost:3011')
        expect(servers.installationBaseURL).toBe('http://localhost:3012')
    })

    it('空串按未设置处理，回退默认端口', async () => {
        const servers = await loadServers({ E2E_PORT: '' })

        expect(servers.e2ePort).toBe(3001)
    })

    it.each(['3001abc', '3011.7', '0', '-5', '99999', '0x10', '1e3', ' 3011 '])('拒绝非法端口 %j', async (value) => {
        await expect(loadServers({ E2E_PORT: value })).rejects.toThrow('[playwright-servers] 非法端口')
    })

    it('宿主环境已导出 E2E_PORT 时，默认用例仍取 3001', async () => {
        process.env.E2E_PORT = '3011'

        const servers = await loadServers()

        expect(servers.e2ePort).toBe(3001)
    })

    it('拒绝两个端口相同', async () => {
        await expect(loadServers({
            E2E_INSTALLATION_PORT: '3011',
            E2E_PORT: '3011',
        })).rejects.toThrow('不能相同')
    })

    it.each(['0.0.0.0', 'example.com', '::1'])('拒绝非 loopback 主机 %j', async (value) => {
        await expect(loadServers({ E2E_HOST: value })).rejects.toThrow('只支持 loopback')
    })
})
