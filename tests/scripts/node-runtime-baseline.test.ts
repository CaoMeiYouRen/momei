import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 守卫：Node 运行时基线必须单点声明。
 *
 * 背景：升级前 `engines` 为 24.x、Docker 基础镜像为 24.22.1、CI 的 `lts/*` 实际解析 26.13.1，
 * 三处漂移的本机表现是 `better-sqlite3` ABI 不匹配（`ERR_DLOPEN_FAILED`）与 `Unsupported engine`
 * 警告。版本文本一旦重新散落到多处就一定会再次漂移，因此以 `.nvmrc` 为唯一事实源钉住其余各处。
 */

const root = process.cwd()

function read(relativePath: string) {
    return readFileSync(resolve(root, relativePath), 'utf8')
}

const nvmrc = read('.nvmrc').trim()
const pkg = JSON.parse(read('package.json')) as { engines?: Record<string, string> }
const dockerfile = read('Dockerfile')
const workflowDir = '.github/workflows'
const workflowFiles = readdirSync(resolve(root, workflowDir)).filter((file) => /\.ya?ml$/u.test(file))
const workflows = workflowFiles.map((file) => ({ file, content: read(`${workflowDir}/${file}`) }))

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

describe('Node 运行时基线单点守卫', () => {
    it('.nvmrc 声明完整语义化版本', () => {
        expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/u)
    })

    it('engines.node 的主版本与 .nvmrc 一致', () => {
        const [major] = nvmrc.split('.')
        expect(pkg.engines?.node).toBe(`${major}.x`)
    })

    it('Dockerfile 构建与运行阶段的基础镜像同源于 .nvmrc', () => {
        const args = dockerfile.match(/^ARG NODE_(?:BUILD|RUNTIME)_IMAGE=(\S+)$/gmu) ?? []
        expect(args).toHaveLength(2)
        for (const arg of args) {
            expect(arg).toMatch(new RegExp(`=node:${escapeRegExp(nvmrc)}-alpine$`, 'u'))
        }
        // ARG 默认值正确不代表阶段真的用了它：FROM 必须仍引用变量，而不是回落到硬编码 tag
        expect(dockerfile).toContain('FROM ${NODE_BUILD_IMAGE} AS nodejs')
        expect(dockerfile).toContain('FROM ${NODE_RUNTIME_IMAGE} AS runtime')
    })

    it('所有 workflow 的 setup-node 都从 .nvmrc 读取版本', () => {
        const usingSetupNode = workflows.filter(({ content }) => content.includes('actions/setup-node@'))
        expect(usingSetupNode.length).toBeGreaterThan(0)
        for (const { file, content } of usingSetupNode) {
            expect(content, `${file} 缺少 node-version-file: .nvmrc`).toContain('node-version-file: .nvmrc')
        }
    })

    it('setup-node 的每一处都配了 node-version-file（逐条覆盖，不只看文件里出现过一次）', () => {
        // 按行首锚定统计：注释掉的 `# node-version-file: …` 不计入，避免游离文本抵消真缺失
        const count = (pattern: RegExp) => workflows.reduce(
            (total, { content }) => total + (content.match(pattern)?.length ?? 0),
            0,
        )
        const setupNodeSteps = count(/^[ \t]+uses: actions\/setup-node@/gmu)
        const versionFileBindings = count(/^[ \t]+node-version-file: \.nvmrc$/gmu)
        expect(setupNodeSteps).toBeGreaterThan(0)
        expect(versionFileBindings).toBe(setupNodeSteps)
    })

    it('workflow 中不再残留 lts 或手写 node-version', () => {
        for (const { file, content } of workflows) {
            // 排除 `defaults:` / `test-results/` 等包含 lts 子串的无关文本，只看真正的版本写法
            expect(content, `${file} 仍手写 node-version`).not.toMatch(/node-version:/u)
            expect(content, `${file} 仍引用 lts`).not.toMatch(/node-version:\s*["']?lts/u)
            expect(content, `${file} 步骤名仍声称 lts`).not.toMatch(/Setup Node\.js@lts/u)
        }
    })
})
