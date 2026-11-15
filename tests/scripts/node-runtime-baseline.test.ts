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
const pkg = JSON.parse(read('package.json')) as { engines?: Record<string, string>, packageManager?: string }
const devcontainer = read('devcontainer.json')
const dockerfile = read('Dockerfile')
const workflowDir = '.github/workflows'
const workflowFiles = readdirSync(resolve(root, workflowDir)).filter((file) => /\.ya?ml$/u.test(file))
const workflows = workflowFiles.map((file) => ({ file, content: read(`${workflowDir}/${file}`) }))

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

/**
 * 去除 JSONC 注释（`//` 与 `/* *\/`），保留字符串内容。
 *
 * devcontainer.json 允许注释，JSON.parse 直接读取会失败；这里不引入新依赖，
 * 用一个能识别字符串状态的小扫描器，避免把 `https://…` 这类字符串里的 `//` 当注释。
 */
export function stripJsonComments(content: string) {
    let output = ''
    let inString = false
    let inLineComment = false
    let inBlockComment = false

    for (let index = 0; index < content.length; index += 1) {
        const char = content[index]
        const next = content[index + 1]

        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false
                output += char
            }
            continue
        }

        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false
                index += 1
            }
            continue
        }

        if (inString) {
            output += char

            if (char === '\\') {
                output += next ?? ''
                index += 1
                continue
            }

            if (char === '"') {
                inString = false
            }

            continue
        }

        if (char === '"') {
            inString = true
            output += char
            continue
        }

        if (char === '/' && next === '/') {
            inLineComment = true
            index += 1
            continue
        }

        if (char === '/' && next === '*') {
            inBlockComment = true
            index += 1
            continue
        }

        output += char
    }

    return output
}

export interface DevcontainerRuntimeInput {
    content: string
    nvmrc: string
    packageManager?: string
}

/**
 * 去掉字符串外的尾逗号（JSONC 允许，`JSON.parse` 不允许）。
 *
 * 与注释剥离一样用字符串状态机，避免把字符串内的 `,}` 当尾逗号。
 */
export function stripTrailingCommas(content: string) {
    let output = ''
    let inString = false

    for (let index = 0; index < content.length; index += 1) {
        const char = content[index]

        if (inString) {
            output += char

            if (char === '\\') {
                output += content[index + 1] ?? ''
                index += 1
                continue
            }

            if (char === '"') {
                inString = false
            }

            continue
        }

        if (char === '"') {
            inString = true
            output += char
            continue
        }

        if (char === ',') {
            let lookahead = index + 1

            while (lookahead < content.length && /\s/u.test(content.charAt(lookahead))) {
                lookahead += 1
            }

            if (content[lookahead] === '}' || content[lookahead] === ']') {
                continue
            }
        }

        output += char
    }

    return output
}

export function parseJsonc(content: string) {
    return JSON.parse(stripTrailingCommas(stripJsonComments(content))) as Record<string, unknown>
}

export interface DevcontainerViolation {
    code: 'corepack-reflow' | 'image-major-mismatch' | 'image-missing' | 'pnpm-bootstrap-missing' | 'pnpm-install-missing'
    detail: string
}

/**
 * devcontainer 运行时基线判定（供单测断言与负向用例复用）。
 *
 * 三条硬约束：镜像主版本 = `.nvmrc` 主版本；引导命令不得回到 `corepack`；
 * pnpm 版本必须与 `package.json#packageManager` 一致（避免引导命令与锁文件口径漂移）。
 */
export function findDevcontainerViolations({ content, nvmrc: expectedVersion, packageManager }: DevcontainerRuntimeInput): DevcontainerViolation[] {
    const violations: DevcontainerViolation[] = []
    const commentFree = stripJsonComments(content)
    const parsed = parseJsonc(content) as { image?: string, postCreateCommand?: string }
    const image = parsed.image ?? ''
    const command = parsed.postCreateCommand ?? ''
    const expectedMajor = expectedVersion.split('.')[0]
    const imageMatch = /^mcr\.microsoft\.com\/devcontainers\/typescript-node:(\d+)-/u.exec(image)

    if (!imageMatch) {
        violations.push({ code: 'image-missing', detail: `未找到 devcontainers/typescript-node 镜像: ${image || '（空）'}` })
    } else if (imageMatch[1] !== expectedMajor) {
        violations.push({ code: 'image-major-mismatch', detail: `镜像主版本 ${imageMatch[1]} 与 .nvmrc ${expectedVersion} 不一致` })
    }

    // 扫全文（已去注释）：corepack 从 postStartCommand / features 回流同样必须判红。
    if (commentFree.includes('corepack')) {
        violations.push({ code: 'corepack-reflow', detail: 'devcontainer 配置重新引入 corepack' })
    }

    const pnpmVersion = packageManager?.startsWith('pnpm@') ? packageManager.slice('pnpm@'.length) : null

    if (pnpmVersion) {
        const versionPattern = new RegExp(`pnpm@${escapeRegExp(pnpmVersion)}(?![-\\w.])`, 'u')

        if (!versionPattern.test(command)) {
            violations.push({ code: 'pnpm-bootstrap-missing', detail: `postCreateCommand 未安装 packageManager 声明的 pnpm@${pnpmVersion}` })
        }
    }

    if (!command.includes('pnpm install')) {
        violations.push({ code: 'pnpm-install-missing', detail: 'postCreateCommand 缺少 pnpm install' })
    }

    return violations
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

describe('devcontainer 运行时基线守卫', () => {
    it('devcontainer.json 以 JSONC 解析通过（含注释与允许的尾逗号）', () => {
        expect(() => parseJsonc(devcontainer)).not.toThrow()
        expect(parseJsonc('{\n  "a": [1, 2,],\n  "b": { "c": 1, },\n}')).toEqual({ a: [1, 2], b: { c: 1 } })
    })

    it('仓库当前 devcontainer 配置无基线违规', () => {
        expect(findDevcontainerViolations({ content: devcontainer, nvmrc, packageManager: pkg.packageManager })).toEqual([])
    })

    it('镜像主版本降级会被判红', () => {
        const fixture = JSON.stringify({
            image: 'mcr.microsoft.com/devcontainers/typescript-node:24-bookworm',
            postCreateCommand: 'npm install -g pnpm@11.17.0 && pnpm install',
        }, null, 2)

        expect(findDevcontainerViolations({ content: fixture, nvmrc, packageManager: pkg.packageManager }))
            .toEqual([{ code: 'image-major-mismatch', detail: expect.stringContaining('24') }])
    })

    it('corepack 回流会被判红', () => {
        const fixture = JSON.stringify({
            image: 'mcr.microsoft.com/devcontainers/typescript-node:26-bookworm',
            postCreateCommand: 'corepack enable && pnpm install',
        }, null, 2)
        const violations = findDevcontainerViolations({ content: fixture, nvmrc, packageManager: pkg.packageManager })

        expect(violations.map((violation) => violation.code)).toEqual(['corepack-reflow', 'pnpm-bootstrap-missing'])
    })

    it('corepack 出现在其它生命周期字段同样判红', () => {
        const fixture = JSON.stringify({
            image: 'mcr.microsoft.com/devcontainers/typescript-node:26-bookworm',
            postCreateCommand: 'npm install -g pnpm@11.17.0 && pnpm install',
            postStartCommand: 'corepack enable',
        }, null, 2)

        expect(findDevcontainerViolations({ content: fixture, nvmrc, packageManager: pkg.packageManager })
            .map((violation) => violation.code)).toEqual(['corepack-reflow'])
    })

    it('pnpm 引导版本仅有前缀相同仍判红', () => {
        const fixture = JSON.stringify({
            image: 'mcr.microsoft.com/devcontainers/typescript-node:26-bookworm',
            postCreateCommand: 'npm install -g pnpm@11.17.0-rc.1 && pnpm install',
        }, null, 2)

        expect(findDevcontainerViolations({ content: fixture, nvmrc, packageManager: pkg.packageManager })
            .map((violation) => violation.code)).toEqual(['pnpm-bootstrap-missing'])
    })

    it('缺少 pnpm install 会被判红', () => {
        const fixture = JSON.stringify({
            image: 'mcr.microsoft.com/devcontainers/typescript-node:26-bookworm',
            postCreateCommand: 'npm install -g pnpm@11.17.0',
        }, null, 2)

        expect(findDevcontainerViolations({ content: fixture, nvmrc, packageManager: pkg.packageManager })
            .map((violation) => violation.code)).toEqual(['pnpm-install-missing'])
    })

    it('缺少镜像声明与 pnpm 引导版本漂移会被判红', () => {
        expect(findDevcontainerViolations({
            content: JSON.stringify({ postCreateCommand: 'npm install -g pnpm@10.0.0 && pnpm install' }),
            nvmrc,
            packageManager: pkg.packageManager,
        }).map((violation) => violation.code)).toEqual(['image-missing', 'pnpm-bootstrap-missing'])
    })

    it('去除注释时保留字符串中的 // 与转义', () => {
        const fixture = stripJsonComments('{\n  // 注释\n  "url": "https://example.com/a//b",\n  "value": "a\\"b"\n}')

        expect(JSON.parse(fixture)).toEqual({ url: 'https://example.com/a//b', value: 'a"b' })
    })
})
