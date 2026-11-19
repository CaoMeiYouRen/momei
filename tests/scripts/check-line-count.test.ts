import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    countLines,
    collectLineCountReport,
    DEFAULT_MODE,
    DEFAULT_PROFILE,
    inspectTarget,
    LINE_COUNT_PROFILES,
    main,
    parseArgs,
    projectRoot,
    README_TARGETS,
} from '@/scripts/docs/check-line-count.mjs'

/**
 * 行数门禁的纯逻辑与三种严重度：
 * - `countLines` 的空串 / LF / CRLF 口径；
 * - `inspectTarget` 的 pass / warning / error 分界（含边界值等于阈值）；
 * - profile 选择与 `main` 的输出 / 退出码（error 模式置 1，warn 模式不置）。
 *
 * 文件读取用仓库内真实文件（`package.json`），避免为测试改动 `projectRoot` 常量。
 */

const silentConsole = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
}

interface Target {
    errorLimit: number
    file: string
    rationale: string
    warningLimit: number
}

function withTarget(target: Partial<Target> & { file: string }): Target {
    return {
        errorLimit: 1_000_000,
        rationale: 'test',
        warningLimit: 1_000_000,
        ...target,
    }
}

describe('check-line-count 行数口径', () => {
    it('空串记 0 行，LF 与 CRLF 口径一致', () => {
        expect(countLines('')).toBe(0)
        expect(countLines('a\nb')).toBe(2)
        expect(countLines('a\r\nb')).toBe(2)
        expect(countLines('a\n')).toBe(2)
    })

    it('README 目标覆盖五种语言镜像', () => {
        expect(README_TARGETS.map((target) => target.file)).toEqual([
            'README.md',
            'README.en-US.md',
            'README.ja-JP.md',
            'README.ko-KR.md',
            'README.zh-TW.md',
        ])
    })

    it('projectRoot 指向仓库根目录', () => {
        expect(projectRoot.endsWith('momei')).toBe(true)
    })
})

describe('check-line-count 严重度判定', () => {
    it('低于 warning 阈值判通过', async () => {
        const result = await inspectTarget(withTarget({ file: 'package.json' }))

        expect(result.severity).toBe('pass')
        expect(result.lines).toBeGreaterThan(0)
    })

    it('超过 warning 线判 warning', async () => {
        const result = await inspectTarget(withTarget({ file: 'package.json', warningLimit: 0 }))

        expect(result.severity).toBe('warning')
    })

    it('超过 error 线判 error 并优先命中', async () => {
        const result = await inspectTarget(withTarget({ errorLimit: 0, file: 'package.json', warningLimit: 0 }))

        expect(result.severity).toBe('error')
    })

    it('等于阈值不算越线', async () => {
        const probe = await inspectTarget(withTarget({ file: 'package.json' }))
        const exact = await inspectTarget(withTarget({
            errorLimit: probe.lines + 10,
            file: 'package.json',
            warningLimit: probe.lines,
        }))

        expect(exact.severity).toBe('pass')
    })

    it('文件缺失时抛错而不静默通过', async () => {
        await expect(inspectTarget(withTarget({ file: 'docs/__not-exists__.md' }))).rejects.toThrow()
    })
})

describe('check-line-count 报告与 profile', () => {
    it('默认 profile 覆盖根 README 与规划窗口', async () => {
        const report = await collectLineCountReport()

        expect(report.profile).toBe(DEFAULT_PROFILE)
        expect(report.results.map((item) => item.file)).toContain('README.md')
        expect(report.results.map((item) => item.file)).toContain('docs/plan/todo-archive.md')
        expect(report.errors.every((item) => item.severity === 'error')).toBe(true)
        expect(report.warnings.every((item) => item.severity === 'warning')).toBe(true)
    })

    it('candidate profile 额外覆盖规范候选文档', async () => {
        const report = await collectLineCountReport({ profile: 'candidate' })

        expect(report.results.map((item) => item.file)).toContain('docs/standards/planning.md')
    })

    it('未知 profile 回退到默认清单', async () => {
        const report = await collectLineCountReport({ profile: 'unknown-profile' })

        expect(report.results).toHaveLength(LINE_COUNT_PROFILES.default.length)
    })
})

describe('check-line-count 参数解析', () => {
    it('默认 mode=error、profile=default', () => {
        expect(parseArgs(['node', 'script'])).toEqual({ mode: DEFAULT_MODE, profile: DEFAULT_PROFILE })
    })

    it('接受 --mode=warn 与 --profile=candidate', () => {
        expect(parseArgs(['node', 'script', '--mode=warn', '--profile=candidate'])).toEqual({
            mode: 'warn',
            profile: 'candidate',
        })
    })

    it('拒绝未知取值与未知参数', () => {
        expect(() => parseArgs(['node', 'script', '--mode=loud'])).toThrow(/Unsupported value/u)
        expect(() => parseArgs(['node', 'script', '--nope=1'])).toThrow(/Unsupported argument/u)
    })
})

describe('check-line-count 入口输出', () => {
    const originalProfiles = { ...LINE_COUNT_PROFILES }

    beforeEach(() => {
        process.exitCode = undefined
        silentConsole.error.mockClear()
        silentConsole.info.mockClear()
        silentConsole.warn.mockClear()
        vi.spyOn(console, 'info').mockImplementation((...args: unknown[]) => silentConsole.info(...args))
        vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => silentConsole.warn(...args))
        vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => silentConsole.error(...args))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        process.exitCode = undefined
        LINE_COUNT_PROFILES.default = originalProfiles.default
        LINE_COUNT_PROFILES.candidate = originalProfiles.candidate
    })

    function useTargets(targets: Target[]) {
        LINE_COUNT_PROFILES.default = targets
        LINE_COUNT_PROFILES.candidate = targets
    }

    it('全部在阈值内时打印 passed，不置退出码', async () => {
        useTargets([withTarget({ file: 'package.json' })])

        await main(['node', 'script'])

        expect(silentConsole.info).toHaveBeenCalledWith(expect.stringContaining('[docs-line-count] ok'))
        expect(silentConsole.info).toHaveBeenCalledWith(expect.stringContaining('passed: no document exceeded'))
        expect(process.exitCode).toBeUndefined()
    })

    it('命中 warning 时打印 warning 前缀与汇总，但不置退出码', async () => {
        useTargets([withTarget({ file: 'package.json', warningLimit: 0 })])

        await main(['node', 'script'])

        expect(silentConsole.info).toHaveBeenCalledWith(expect.stringContaining('[docs-line-count] warning'))
        expect(silentConsole.warn).toHaveBeenCalledWith(expect.stringContaining('warning summary'))
        expect(process.exitCode).toBeUndefined()
    })

    it('error 模式下越线置退出码 1 并写 error 汇总', async () => {
        useTargets([withTarget({ errorLimit: 0, file: 'package.json' })])

        await main(['node', 'script'])

        expect(silentConsole.error).toHaveBeenCalledWith(expect.stringContaining('error summary'))
        expect(process.exitCode).toBe(1)
    })

    it('warn 模式下越线只告警，不置退出码', async () => {
        useTargets([withTarget({ errorLimit: 0, file: 'package.json' })])

        await main(['node', 'script', '--mode=warn'])

        expect(silentConsole.warn).toHaveBeenCalledWith(expect.stringContaining('candidate summary'))
        expect(silentConsole.warn).toHaveBeenCalledWith(expect.stringContaining('completed in warn mode'))
        expect(process.exitCode).toBeUndefined()
    })
})
