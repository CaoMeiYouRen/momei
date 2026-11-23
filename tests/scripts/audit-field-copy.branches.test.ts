import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    buildFindings,
    collectFieldCopyReport,
    compareFieldCopy,
    computeDiceCoefficient,
    extractFieldCopyCandidates,
    extractTemplateBlock,
    isExamplePlaceholder,
    isRuleLikePlaceholder,
    loadLocaleMessages,
    main,
    maskHtmlComments,
    normalizeCopy,
    parseArgs,
    renderMarkdownReport,
    renderReport,
    renderTextReport,
    toPosixPath,
} from '@/scripts/i18n/audit-field-copy.mjs'

async function writeProjectFile(baseDir: string, relativePath: string, content: string) {
    const absolutePath = resolve(baseDir, relativePath)

    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, content, 'utf8')
}

async function createProjectFixture() {
    const directory = await mkdtemp(join(tmpdir(), 'field-copy-'))

    await writeProjectFile(directory, 'i18n/locales/zh-CN/common.json', JSON.stringify({
        form: {
            email: {
                label: '邮箱',
                placeholder: '请输入邮箱',
            },
            name: {
                label: '名称',
                placeholder: '例如：墨梅',
            },
            code: {
                placeholder: '可选，用于区分来源',
            },
        },
    }))

    await writeProjectFile(directory, 'i18n/locales/zh-CN/README.md', 'ignored')
    await writeProjectFile(directory, 'components/node_modules/ignored.vue', '<template><CaomeiInput :placeholder="$t(\'form.email.placeholder\')" /></template>')
    await writeProjectFile(directory, 'components/__snapshots__/snapshot.vue', '<template><CaomeiInput :placeholder="$t(\'form.email.placeholder\')" /></template>')
    await writeProjectFile(directory, 'components/forms/plain.vue', '<template><div>{{ $t(\'form.email.label\') }}</div></template>')
    await writeProjectFile(directory, 'components/form-panel.vue', [
        '<template>',
        '  <div>',
        '    <!-- <CaomeiInput :placeholder="$t(\'form.code.placeholder\')" /> -->',
        '    <label>{{ $t(\'form.email.label\') }}</label>',
        '    <CaomeiInput :placeholder="$t(\'form.email.placeholder\')" />',
        '    <CaomeiTextarea :placeholder="$t(\'form.code.placeholder\')" />',
        '    <input type="submit" :placeholder="$t(\'form.email.placeholder\')" />',
        '    <CaomeiInput id="no-key" />',
        '  </div>',
        '</template>',
    ].join('\n'))

    return directory
}

const originalExitCode = process.exitCode

afterEach(() => {
    process.exitCode = originalExitCode
    vi.restoreAllMocks()
})

describe('audit-field-copy branches', () => {
    it('normalizes copy with punctuation, prefixes and synonyms', () => {
        expect(normalizeCopy('  请输入邮箱... ')).toBe('email')
        expect(normalizeCopy('电子邮件：')).toBe('email')
        expect(normalizeCopy('')).toBe('')
        expect(normalizeCopy('请重新输入密码')).toBe('password')
    })

    it('classifies example and rule placeholders', () => {
        expect(isExamplePlaceholder('例如：墨梅')).toBe(true)
        expect(isRuleLikePlaceholder('例如：墨梅')).toBe(false)
        expect(isRuleLikePlaceholder('可选')).toBe(true)
        expect(isRuleLikePlaceholder('用于区分来源')).toBe(true)
        expect(isRuleLikePlaceholder('')).toBe(false)
    })

    it('computes dice coefficient and field copy overlap kinds', () => {
        expect(computeDiceCoefficient('', 'email')).toBe(0)
        expect(computeDiceCoefficient('email', 'email')).toBe(1)
        expect(compareFieldCopy('邮箱', '请输入邮箱')).toBe('identical')
        expect(compareFieldCopy('邮箱地址', '邮箱')).toBe('contains')
        expect(compareFieldCopy('标题', '标题文案')).toBe('contains')
        expect(compareFieldCopy('abcdef', 'abcdeg')).toBe('similar')
        expect(compareFieldCopy('邮件', '名称')).toBeNull()
        expect(compareFieldCopy('', '名称')).toBeNull()
    })

    it('falls back when template tags are missing and masks html comments', () => {
        expect(extractTemplateBlock('const a = 1')).toBe('const a = 1')
        expect(extractTemplateBlock('<template><div /></template>')).toBe('<template><div /></template>')
        expect(maskHtmlComments('<div><!-- secret --></div>')).not.toContain('secret')
        expect(toPosixPath('/tmp/project', '/tmp/project')).toBe('.')
    })

    it('extracts candidates only from supported controls with placeholder keys', () => {
        const source = [
            '<template>',
            '  <label>{{ $t(\'form.email.label\') }}</label>',
            '  <CaomeiInput :placeholder="$t(\'form.email.placeholder\')" />',
            '  <input type="submit" :placeholder="$t(\'form.email.placeholder\')" />',
            '  <CustomWidget :placeholder="$t(\'form.email.placeholder\')" />',
            '  <CaomeiInput id="no-placeholder" />',
            '</template>',
        ].join('\n')

        const candidates = extractFieldCopyCandidates(source, 'components/form-panel.vue')

        expect(candidates).toHaveLength(1)
        expect(candidates[0]).toMatchObject({
            control: 'CaomeiInput',
            file: 'components/form-panel.vue',
            labelKey: 'form.email.label',
            placeholderKey: 'form.email.placeholder',
        })
    })

    it('buildFindings keeps rule findings, dedupes and prefers labeled entries', () => {
        const messages = new Map([
            ['form.email.label', '邮箱'],
            ['form.email.placeholder', '请输入邮箱'],
            ['form.code.placeholder', '可选，用于区分来源'],
            ['form.name.placeholder', '例如：墨梅'],
            ['form.display.label', '邮箱'],
            ['form.display.placeholder', '显示名称'],
        ])

        const findings = buildFindings([
            { control: 'CaomeiInput', file: 'a.vue', labelKey: null, line: 3, placeholderKey: 'form.email.placeholder' },
            { control: 'CaomeiInput', file: 'a.vue', labelKey: 'form.email.label', line: 4, placeholderKey: 'form.email.placeholder' },
            { control: 'CaomeiTextarea', file: 'a.vue', labelKey: null, line: 5, placeholderKey: 'form.code.placeholder' },
            { control: 'CaomeiInput', file: 'a.vue', labelKey: 'form.email.label', line: 6, placeholderKey: 'form.name.placeholder' },
            { control: 'CaomeiInput', file: 'a.vue', labelKey: 'form.email.label', line: 7, placeholderKey: 'form.missing.placeholder' },
            { control: 'CaomeiInput', file: 'a.vue', labelKey: 'form.display.label', line: 9, placeholderKey: 'form.display.placeholder' },
            { control: 'CaomeiInput', file: 'a.vue', labelKey: 'form.missing.label', line: 8, placeholderKey: 'form.email.placeholder' },
        ], messages)

        expect(findings).toHaveLength(2)

        const overlap = findings.find((finding) => finding.kind === 'label-placeholder-overlap')
        const rule = findings.find((finding) => finding.kind === 'placeholder-carries-rule')

        expect(overlap).toMatchObject({ label: '邮箱', line: 4 })
        expect(rule).toMatchObject({ line: 5, placeholder: '可选，用于区分来源' })
    })

    it('collects a report from a project fixture and loads locale messages', async () => {
        const directory = await createProjectFixture()

        try {
            const messages = await loadLocaleMessages(directory, 'zh-CN')
            expect(messages.get('form.email.placeholder')).toBe('请输入邮箱')

            const report = await collectFieldCopyReport({
                locale: 'zh-CN',
                projectRoot: directory,
                roots: ['components'],
            })

            expect(report.scannedFileCount).toBe(2)
            expect(report.summary.labelPlaceholderOverlap).toBe(1)
            expect(report.summary.placeholderCarriesRule).toBe(1)
            expect(report.summary.total).toBe(2)
            expect(report.roots).toEqual(['components'])
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('renders text / json / markdown reports with limit applied', async () => {
        const directory = await createProjectFixture()

        try {
            const report = await collectFieldCopyReport({ locale: 'zh-CN', projectRoot: directory, roots: ['components'] })
            const text = renderTextReport(report)
            const limitedText = renderTextReport(report, { limit: 0 })
            const json = JSON.parse(renderReport(report, { format: 'json', limit: 1 }))
            const markdown = renderMarkdownReport(report, { limit: 1 })
            const markdownViaRender = renderReport(report, { format: 'markdown', limit: 1 })

            expect(text).toContain('R1 标签与占位符同义: 1 处')
            expect(limitedText).toBe(text)
            expect(json.findings).toHaveLength(1)
            expect(markdown).toContain('| 位置 | 控件 | 标签 key | 占位符 | 判定 |')
            expect(markdown).toContain('R2 占位符承载规则信息（1）')
            expect(markdownViaRender).toContain('# 字段文案体检（warning 面）')
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('main writes artifacts, prints reports and sets exitCode on findings', async () => {
        const directory = await createProjectFixture()
        const outputPath = join(directory, 'field-copy.json')
        const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)

        try {
            const report = await main([
                'node',
                'script.mjs',
                `--root=${directory}`,
                `--output=${outputPath}`,
                '--format=json',
                '--fail-on-findings',
                '--limit=1',
            ])

            expect(report.summary.total).toBe(2)
            expect(process.exitCode).toBe(1)
            const written = JSON.parse(await readFile(outputPath, 'utf8'))
            expect(written.findings).toHaveLength(1)
            expect(info).toHaveBeenCalled()

            process.exitCode = originalExitCode
            await main(['node', 'script.mjs', `--root=${directory}`, '--locale=zh-CN'])
            expect(process.exitCode).toBe(originalExitCode)
        } finally {
            await rm(directory, { force: true, recursive: true })
        }
    })

    it('rejects invalid CLI values', () => {
        expect(() => parseArgs(['node', 'script.mjs', '--format=yaml'])).toThrow('Unsupported format value')
        expect(() => parseArgs(['node', 'script.mjs', '--limit=-1'])).toThrow('non-negative integer')
    })
})
