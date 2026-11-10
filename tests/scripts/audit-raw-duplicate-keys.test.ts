import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import { auditRawDuplicateKeys, findRawDuplicateKeys } from '@/scripts/i18n/audit-raw-duplicate-keys.mjs'

const execFileAsync = promisify(execFile)
const SCRIPT_PATH = resolve(process.cwd(), 'scripts/i18n/audit-raw-duplicate-keys.mjs')

const tempDirs: string[] = []

async function createLocaleRoot() {
    const root = await mkdtemp(join(tmpdir(), 'raw-duplicate-keys-'))
    tempDirs.push(root)
    return root
}

afterEach(async () => {
    for (const dir of tempDirs.splice(0)) {
        await rm(dir, { recursive: true, force: true })
    }
})

describe('audit-raw-duplicate-keys: 同对象重复键判定', () => {
    it('同一对象内重复键判红并给出行号', () => {
        const findings = findRawDuplicateKeys([
            '{',
            '    "save": "保存",',
            '    "cancel": "取消",',
            '    "save": "保存草稿"',
            '}',
        ].join('\n'))

        expect(findings).toEqual([{ key: 'save', path: '', line: 4, firstLine: 2 }])
    })

    it('不同对象复用同名 key 不判红', () => {
        expect(findRawDuplicateKeys('{"a":{"name":"x"},"b":{"name":"y"}}')).toEqual([])
    })

    it('key 与冒号跨行时行号不漂移', () => {
        const findings = findRawDuplicateKeys([
            '{',
            '    "a"',
            '        : 1,',
            '    "b": 2,',
            '    "a": 3',
            '}',
        ].join('\n'))

        expect(findings).toEqual([{ key: 'a', path: '', line: 5, firstLine: 2 }])
    })

    it('嵌套对象内重复键带路径', () => {
        expect(findRawDuplicateKeys('{"a":{"b":1,"b":2}}')).toEqual([
            { key: 'b', path: 'a', line: 1, firstLine: 1 },
        ])
    })

    it('转义引号与字符串内的花括号不干扰判定', () => {
        expect(findRawDuplicateKeys('{"a\\"b":1,"a\\"b":2}')).toHaveLength(1)
        expect(findRawDuplicateKeys('{"a":"{","b":"}","c":"\\"d\\""}')).toEqual([])
    })

    it('数组内多个对象的同名 key 不判红', () => {
        expect(findRawDuplicateKeys('{"list":[{"x":1},{"x":2}]}')).toEqual([])
    })

    it('空对象与深层嵌套不产生误报', () => {
        expect(findRawDuplicateKeys('{}')).toEqual([])
        expect(findRawDuplicateKeys('{"a":{"b":{"c":1}},"d":{"b":{"c":2}}}')).toEqual([])
    })
})

describe('audit-raw-duplicate-keys: CLI 退出码', () => {
    async function createProjectWithDuplicate() {
        const root = await createLocaleRoot()
        await mkdir(join(root, 'i18n', 'locales', 'zh-CN'), { recursive: true })
        await writeFile(join(root, 'i18n', 'locales', 'zh-CN', 'admin.json'), '{"a":"1","a":"2"}', 'utf8')
        return root
    }

    it('warn 模式有重复键仍退出 0（可观测面）', async () => {
        const root = await createProjectWithDuplicate()
        const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH], { cwd: root })

        expect(stdout).toContain('发现 1 个文件存在同对象重复键')
    })

    it('error 模式有重复键退出 1', async () => {
        const root = await createProjectWithDuplicate()
        await expect(execFileAsync(process.execPath, [SCRIPT_PATH, '--mode=error'], { cwd: root }))
            .rejects.toMatchObject({ code: 1 })
    })

    it('--format=json 输出可解析，非法 --mode 退出 1', async () => {
        const root = await createProjectWithDuplicate()
        const { stdout } = await execFileAsync(process.execPath, [SCRIPT_PATH, '--format=json'], { cwd: root })
        const report = JSON.parse(stdout) as { fileCount: number, results: unknown[] }

        expect(report.fileCount).toBe(1)
        expect(report.results).toHaveLength(1)

        await expect(execFileAsync(process.execPath, [SCRIPT_PATH, '--mode=bogus'], { cwd: root }))
            .rejects.toMatchObject({ code: 1 })
    })
})

describe('audit-raw-duplicate-keys: 目录扫描', () => {
    it('只报告存在重复键的文件', async () => {
        const root = await createLocaleRoot()
        await mkdir(join(root, 'zh-CN'), { recursive: true })
        await writeFile(join(root, 'zh-CN', 'clean.json'), '{"a":"1","b":"2"}', 'utf8')
        await writeFile(join(root, 'zh-CN', 'duplicated.json'), '{"a":"1","a":"2"}', 'utf8')

        const report = await auditRawDuplicateKeys(root)

        expect(report.fileCount).toBe(2)
        expect(report.results).toHaveLength(1)
        expect(report.results[0]?.file.endsWith('duplicated.json')).toBe(true)
        expect(report.results[0]?.findings).toEqual([
            { key: 'a', path: '', line: 1, firstLine: 1 },
        ])
    })
})
