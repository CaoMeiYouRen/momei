import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterAll, describe, expect, it } from 'vitest'
import {
    buildFindings,
    collectFieldCopyReport,
    compareFieldCopy,
    extractFieldCopyCandidates,
    isRuleLikePlaceholder,
    normalizeCopy,
    parseArgs,
    renderTextReport,
} from '@/scripts/i18n/audit-field-copy.mjs'

const execFileAsync = promisify(execFile)
const ROOT_DIR = resolve(import.meta.dirname, '..', '..')
const SCRIPT_PATH = resolve(ROOT_DIR, 'scripts', 'i18n', 'audit-field-copy.mjs')

const tempDirectories = new Set<string>()

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

async function createFixtureProject() {
    const directory = await mkdtemp(join(tmpdir(), 'momei-field-copy-'))
    tempDirectories.add(directory)

    await writeProjectFile(directory, 'i18n/locales/zh-CN/common.json', JSON.stringify({
        pages: {
            demo: {
                email: '电子邮箱',
                email_placeholder: '用于接收审核反馈',
                title: '文章标题',
                title_placeholder: '请输入文章标题',
            },
        },
    }, null, 2))
    await writeProjectFile(directory, 'pages/demo.vue', [
        '<template>',
        '    <form>',
        '        <label for="title">{{ $t(\'pages.demo.title\') }} *</label>',
        '        <InputText id="title" :placeholder="$t(\'pages.demo.title_placeholder\')" />',
        '        <label for="email">{{ $t(\'pages.demo.email\') }}</label>',
        '        <InputText id="email" :placeholder="$t(\'pages.demo.email_placeholder\')" />',
        '        <!-- <label>旧字段</label>',
        '        <InputText :placeholder="$t(\'pages.demo.title_placeholder\')" /> -->',
        '    </form>',
        '</template>',
    ].join('\n'))

    return directory
}

afterAll(async () => {
    await Promise.all([...tempDirectories].map(async (dirPath) => {
        await rm(dirPath, { force: true, recursive: true })
    }))
})

describe('audit-field-copy', () => {
    it('parses CLI args with warning defaults', () => {
        expect(parseArgs(['node', 'script.mjs'])).toMatchObject({
            format: 'text',
            limit: 0,
            locale: 'zh-CN',
            output: null,
        })
    })

    it('normalizes polite prefixes and synonyms', () => {
        expect(normalizeCopy('请输入文章标题')).toBe('文章标题')
        expect(normalizeCopy('请再次输入新密码')).toBe('新password')
        expect(normalizeCopy('您的称呼')).toBe('name')
        expect(normalizeCopy('（可选）')).toBe('可选')
    })

    it('compares label and placeholder copy', () => {
        expect(compareFieldCopy('文章标题', '请输入文章标题')).toBe('identical')
        expect(compareFieldCopy('昵称', '您的称呼')).toBe('identical')
        expect(compareFieldCopy('确认新密码', '请再次输入新密码')).toBe('identical')
        expect(compareFieldCopy('摘要', '文章摘要...')).toBe('contains')
        expect(compareFieldCopy('个人站点', 'https://example.com')).toBeNull()
    })

    it('detects placeholders that carry rules instead of examples', () => {
        expect(isRuleLikePlaceholder('可选')).toBe(true)
        expect(isRuleLikePlaceholder('用于接收审核反馈')).toBe(true)
        expect(isRuleLikePlaceholder('仅支持本站上传后的图片地址')).toBe(true)
        expect(isRuleLikePlaceholder('例如: 4.5MiB')).toBe(false)
        expect(isRuleLikePlaceholder('https://memos.example.com')).toBe(false)
    })

    it('extracts label and placeholder keys and ignores commented templates', () => {
        const candidates = extractFieldCopyCandidates([
            '<template>',
            '<label for="title">{{ $t(\'demo.title\') }}</label>',
            '<InputText id="title" :placeholder="$t(\'demo.title_placeholder\')" />',
            '<!-- <label>旧字段</label><InputText :placeholder="$t(\'demo.old\')" /> -->',
            '</template>',
        ].join('\n'), 'pages/demo.vue')

        expect(candidates).toHaveLength(1)
        expect(candidates[0]).toMatchObject({
            control: 'InputText',
            file: 'pages/demo.vue',
            labelKey: 'demo.title',
            line: 3,
            placeholderKey: 'demo.title_placeholder',
        })
    })

    it('recognizes native text inputs and skips submit inputs', () => {
        const candidates = extractFieldCopyCandidates([
            '<template>',
            '<label for="name">{{ $t(\'demo.name\') }}</label>',
            '<input id="name" type="text" :placeholder="$t(\'demo.name_placeholder\')">',
            '<input type="submit" :placeholder="$t(\'demo.submit_placeholder\')">',
            '</template>',
        ].join('\n'), 'pages/demo.vue')

        expect(candidates).toHaveLength(1)
        expect(candidates[0]).toMatchObject({
            control: 'input',
            labelKey: 'demo.name',
            placeholderKey: 'demo.name_placeholder',
        })
    })

    it('dedupes the same field rendered in fallback branches', () => {
        const messagesByKey = new Map([
            ['demo.title', '文章标题'],
            ['demo.title_placeholder', '请输入文章标题'],
        ])
        const findings = buildFindings([
            { control: 'InputText', file: 'pages/demo.vue', labelKey: null, line: 10, placeholderKey: 'demo.title_placeholder' },
            { control: 'InputText', file: 'pages/demo.vue', labelKey: 'demo.title', line: 4, placeholderKey: 'demo.title_placeholder' },
        ], messagesByKey)

        expect(findings).toHaveLength(1)
        expect(findings[0]).toMatchObject({ labelKey: 'demo.title', line: 4 })
    })

    it('collects overlap and rule findings from a fixture project', async () => {
        const directory = await createFixtureProject()
        const report = await collectFieldCopyReport({ projectRoot: directory })

        expect(report.scannedFileCount).toBe(1)
        expect(report.summary).toMatchObject({
            labelPlaceholderOverlap: 1,
            placeholderCarriesRule: 1,
            scannedI18nKeys: 4,
            total: 2,
        })
        expect(report.findings.map((finding) => finding.kind).sort()).toEqual([
            'label-placeholder-overlap',
            'placeholder-carries-rule',
        ])
    })

    it('renders warning-face text without blocking by default', async () => {
        const directory = await createFixtureProject()
        const report = await collectFieldCopyReport({ projectRoot: directory })
        const rendered = renderTextReport(report)

        expect(rendered).toContain('warning 面')
        expect(rendered).toContain('R1 标签与占位符同义: 1 处')
        expect(rendered).toContain('R2 占位符承载规则信息: 1 处')
    })

    it('emits json and only exits non-zero with --fail-on-findings', async () => {
        const directory = await createFixtureProject()
        const success = await execFileAsync(process.execPath, [SCRIPT_PATH, '--format=json', `--root=${directory}`], {
            cwd: ROOT_DIR,
        })
        const report = JSON.parse(success.stdout)

        expect(report.summary.total).toBe(2)

        await expect(execFileAsync(process.execPath, [SCRIPT_PATH, '--fail-on-findings', `--root=${directory}`], {
            cwd: ROOT_DIR,
        })).rejects.toMatchObject({ code: 1 })
    })
})
