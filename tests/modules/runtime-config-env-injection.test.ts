import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * 运行期环境变量的**注入口径守卫**（2026-11 修复的回归防线）。
 *
 * 背景：`nuxt.config.ts` 只在**构建期**执行；Nuxt 的运行期环境变量注入只认 `NUXT_*` 前缀。
 * 因此：
 * 1. 私有 `runtimeConfig` 里**不得**出现 `process.env.*` 初始化——非 `NUXT_` 前缀的密钥
 *    （`AUTH_CAPTCHA_SECRET_KEY` / `CRON_SECRET` / `TASKS_TOKEN` / `WEBHOOK_SECRET`）在构建机上
 *    通常为空，会把空值烘焙进产物；若构建机恰好有值，则密钥被固化进镜像。两种结果都不可接受。
 *    私有密钥一律在服务端**运行期**读 `process.env`。
 * 2. 依赖私有变量的**派生布尔值**（如社交登录可用性）不得写入 `runtimeConfig.public` 的构建期
 *    字面量——它会被永久烘焙。此类能力改由 `.server.ts` 插件在请求期写入 `useState`。
 *
 * 这不是风格检查，而是「生产环境静默失效」这一类缺陷的最小可执行判据：构建期与运行期的差别
 * 无法被 typecheck / 单测自然覆盖，只能靠静态口径守卫。
 */

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * 去掉**行注释**。
 *
 * 不使用块注释剥离：`nuxt.config.ts` 的 sitemap / PWA 配置里存在 `'/admin/` 加两个星号的 glob
 * 字符串，天真地匹配块注释起始符会跨行吞掉真实配置（已实测会把 runtimeConfig 整段删掉）。
 */
function stripLineComments(source: string): string {
    return source.replace(/^\s*\/\/.*$/gmu, '')
}

async function readProjectFile(relativePath: string): Promise<string> {
    return await readFile(path.join(ROOT_DIR, relativePath), 'utf8')
}

describe('runtimeConfig 环境变量注入口径', () => {
    it('私有 runtimeConfig 不得用 process.env 初始化（构建期求值会在生产环境失效）', async () => {
        const source = stripLineComments(await readProjectFile('nuxt.config.ts'))

        const runtimeConfigStart = source.indexOf('runtimeConfig: {')
        expect(runtimeConfigStart, 'nuxt.config.ts 应声明 runtimeConfig').toBeGreaterThanOrEqual(0)

        const publicStart = source.indexOf('public: {', runtimeConfigStart)
        expect(publicStart, 'runtimeConfig 应包含 public 段').toBeGreaterThan(runtimeConfigStart)

        const privateSection = source.slice(runtimeConfigStart, publicStart)

        /* 只匹配「行首的 key: process.env」这一真实赋值形态：注释里的提及（`* process.env`、
         * `/* process.env *\/`）不以 key 开头，不会误报。 */
        expect(
            privateSection,
            '私有 runtimeConfig 只能声明 key 与字面量默认值；请改为在服务端运行期读 process.env（见 server/utils/captcha.ts）',
        ).not.toMatch(/^\s*[A-Za-z_$][\w$]*\s*:\s*process\.env/mu)
    })

    it('社交登录可用性不得再写入 public 配置（依赖私有 clientSecret，只能在运行期判定）', async () => {
        const source = stripLineComments(await readProjectFile('nuxt.config.ts'))

        /* 同上：只认行首 key 赋值，避免注释中举例触发误报。 */
        expect(
            source,
            'socialProviders 可用性依赖 clientSecret，构建期固化会在生产环境恒为 false；请改由服务端插件在请求期写入 useState',
        ).not.toMatch(/^\s*socialProviders\s*:/mu)
    })

    it('登录 / 注册页只读取请求期状态，不再读取 public.socialProviders', async () => {
        for (const page of ['pages/login.vue', 'pages/register.vue']) {
            const source = await readProjectFile(page)

            expect(source, `${page} 不应读取构建期固化的 public.socialProviders`).not.toMatch(/public\.socialProviders/u)
            expect(source, `${page} 应读取服务端注入的 useState`).toMatch(/useState<[^>]*>\s*\(\s*['"]auth-social-providers['"]/u)
        }
    })

    it('服务端插件与 auth 配置共用同一解析函数（避免按钮与服务端口径分裂）', async () => {
        const plugin = await readProjectFile('plugins/social-providers.server.ts')
        const auth = await readProjectFile('lib/auth.ts')

        expect(plugin, '服务端插件应调用共用解析函数').toMatch(/getSocialProviderAvailability/u)
        expect(plugin, '插件应写入页面读取的同一个 useState key').toMatch(/'auth-social-providers'/u)
        expect(auth, 'better-auth 配置应调用共用解析函数').toMatch(/getEnabledSocialProviders/u)
    })
})
