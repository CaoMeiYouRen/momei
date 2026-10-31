import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, '..', '..')
export const DEFAULT_SCAN_ROOTS = ['pages', 'components', 'layouts']
export const DEFAULT_LOCALE = 'zh-CN'
export const DEFAULT_FORMAT = 'text'
export const DEFAULT_LIMIT = 0

// 只覆盖“同一字段的 label 与 placeholder 同义”和“placeholder 承载规则信息”两条可判定规则。
// 其余文案密度问题（口号、区块三层说明）属主观判断，不进入本脚本，避免告警噪声。
export const CONTROL_TAGS = new Set([
    'AutoComplete',
    'CaomeiInput',
    'CaomeiInputNumber',
    'CaomeiSelect',
    'CaomeiTextarea',
    'DatePicker',
    'InputNumber',
    'InputText',
    'MultiSelect',
    'Password',
    'Select',
    'Textarea',
])

const EXAMPLE_PLACEHOLDER_PATTERN = /^(?:例如|示例|比如|如[:：]|e\.g\.)/iu
const NATIVE_BLOCKED_INPUT_PATTERN = /type\s*=\s*["'](?:submit|button|hidden|checkbox|radio|file|range|color|date|datetime-local|month|week|time|image|reset)["']/iu
const RULE_PLACEHOLDER_PATTERNS = [
    /[（(]可选[）)]/u,
    /^(?:可选|必填|必选|非必填)/u,
    /^(?:用于|用来|仅支持|只支持|仅限|只能|不支持)/u,
    /^(?:支持|不选|留空|默认)/u,
]
const COPY_PREFIX_PATTERN = /^(?:请再次输入|请重新输入|请再输入|请再次填写|请输入|请填写|请选择|请确认|输入|填写|选择|确认|请)/u
const COPY_PUNCTUATION_PATTERN = /[\s，。、,.：:；;！!？?""'“”‘’（）()【】[\]…·—-]/gu
const COPY_SYNONYMS = [
    ['电子邮件', 'email'],
    ['用户名', 'name'],
    ['称呼', 'name'],
    ['昵称', 'name'],
    ['名字', 'name'],
    ['姓名', 'name'],
    ['邮箱', 'email'],
    ['邮件', 'email'],
    ['口令', 'password'],
    ['密码', 'password'],
    ['网址', 'url'],
    ['链接', 'url'],
    ['地址', 'url'],
]

export function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            format: DEFAULT_FORMAT,
            limit: DEFAULT_LIMIT,
            locale: DEFAULT_LOCALE,
            output: null,
            root: null,
        },
        flags: {
            '--fail-on-findings': { key: 'failOnFindings' },
        },
        values: {
            '--format': {
                key: 'format',
                allowedValues: ['text', 'json', 'markdown'],
                invalidMessage: (value) => `Unsupported format value: ${value}`,
            },
            '--limit': {
                key: 'limit',
                parse: (value) => {
                    const parsed = Number(value)

                    if (!Number.isInteger(parsed) || parsed < 0) {
                        throw new Error(`Expected a non-negative integer, received: ${value}`)
                    }

                    return parsed
                },
            },
            '--locale': { key: 'locale' },
            '--output': { key: 'output' },
            '--root': { key: 'root' },
        },
    })
}

export function toPosixPath(targetPath, projectRoot = repoRoot) {
    return path.relative(projectRoot, targetPath).replaceAll('\\', '/') || '.'
}

export function extractTemplateBlock(sourceText) {
    const startIndex = sourceText.indexOf('<template>')
    const endIndex = sourceText.lastIndexOf('</template>')

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        return sourceText
    }

    return sourceText.slice(startIndex, endIndex + '</template>'.length)
}

export function maskHtmlComments(text) {
    return text.replace(/<!--[\s\S]*?-->/gu, (comment) => comment.replace(/[^\n]/gu, ' '))
}

export function normalizeCopy(value) {
    if (!value) {
        return ''
    }

    let normalized = value.toLowerCase().replace(COPY_PUNCTUATION_PATTERN, '')
    normalized = normalized.replace(/\.{3,}$/u, '')

    for (let index = 0; index < 2; index++) {
        const nextValue = normalized.replace(COPY_PREFIX_PATTERN, '')

        if (nextValue === normalized) {
            break
        }

        normalized = nextValue
    }

    normalized = normalized.replace(/您的|你的/gu, '')

    for (const [source, target] of COPY_SYNONYMS) {
        normalized = normalized.replaceAll(source, target)
    }

    return normalized
}

export function isExamplePlaceholder(value) {
    return EXAMPLE_PLACEHOLDER_PATTERN.test(value.trim())
}

export function isRuleLikePlaceholder(value) {
    const text = value.trim()

    if (!text || isExamplePlaceholder(text)) {
        return false
    }

    return RULE_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(text))
}

export function computeDiceCoefficient(left, right) {
    if (!left || !right) {
        return 0
    }

    const leftChars = new Set(left)
    const rightChars = new Set(right)
    let intersection = 0

    for (const char of leftChars) {
        if (rightChars.has(char)) {
            intersection++
        }
    }

    return (2 * intersection) / (leftChars.size + rightChars.size)
}

export function compareFieldCopy(labelValue, placeholderValue) {
    const label = normalizeCopy(labelValue)
    const placeholder = normalizeCopy(placeholderValue)

    if (!label || !placeholder) {
        return null
    }

    if (label === placeholder) {
        return 'identical'
    }

    if (label.length >= 2 && placeholder.length >= 2 && (label.includes(placeholder) || placeholder.includes(label))) {
        return 'contains'
    }

    if (computeDiceCoefficient(label, placeholder) >= 0.8) {
        return 'similar'
    }

    return null
}

function extractTranslateKey(expression) {
    const match = expression.match(/(?<![\w$.])(?:\$t|tt|rt|t)\(\s*['"]([^'"]+)['"]/u)

    return match?.[1] ?? null
}

function collectTagBlock(lines, startIndex) {
    const block = []

    for (let index = startIndex; index < Math.min(lines.length, startIndex + 12); index++) {
        block.push(lines[index])

        if (lines[index].includes('>')) {
            break
        }
    }

    return block.join('\n')
}

function extractPlaceholderKey(block) {
    const match = block.match(/:placeholder\s*=\s*(?:"([^"]*)"|'([^']*)')/u)

    if (!match) {
        return null
    }

    return extractTranslateKey(match[1] ?? match[2] ?? '')
}

function isControlLine(line) {
    const match = line.match(/<([A-Za-z][A-Za-z0-9_]*)\b/u)

    if (!match) {
        return false
    }

    return CONTROL_TAGS.has(match[1]) || match[1] === 'input'
}

function resolveControlName(tag, block) {
    if (!tag) {
        return null
    }

    if (CONTROL_TAGS.has(tag)) {
        return tag
    }

    if (tag === 'input' && !NATIVE_BLOCKED_INPUT_PATTERN.test(block)) {
        return tag
    }

    return null
}

function collectLabelWindow(lines, controlIndex) {
    const windowLines = []

    for (let index = controlIndex - 1; index >= Math.max(0, controlIndex - 12); index--) {
        if (isControlLine(lines[index])) {
            break
        }

        windowLines.unshift(lines[index])
    }

    return windowLines.join('\n')
}

function extractLabelKey(block) {
    const labelMatches = [...block.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gu)]

    if (labelMatches.length === 0) {
        return null
    }

    return extractTranslateKey(labelMatches.at(-1)[1])
}

export function extractFieldCopyCandidates(sourceText, filePath = '') {
    const template = maskHtmlComments(extractTemplateBlock(sourceText))
    const lines = template.split('\n')
    const candidates = []

    for (let index = 0; index < lines.length; index++) {
        if (!isControlLine(lines[index])) {
            continue
        }

        const block = collectTagBlock(lines, index)
        const controlMatch = lines[index].match(/<([A-Za-z][A-Za-z0-9_]*)\b/u)
        const control = resolveControlName(controlMatch?.[1], block)

        if (!control) {
            continue
        }

        const placeholderKey = extractPlaceholderKey(block)

        if (!placeholderKey) {
            continue
        }

        candidates.push({
            control,
            file: filePath,
            labelKey: extractLabelKey(collectLabelWindow(lines, index)),
            line: index + 1,
            placeholderKey,
        })
    }

    return candidates
}

export function buildFindings(candidates, messagesByKey) {
    const findings = []

    for (const candidate of candidates) {
        const placeholder = messagesByKey.get(candidate.placeholderKey)

        if (!placeholder) {
            continue
        }

        if (isRuleLikePlaceholder(placeholder)) {
            findings.push({
                ...candidate,
                confidence: 'rule-pattern',
                kind: 'placeholder-carries-rule',
                label: candidate.labelKey ? (messagesByKey.get(candidate.labelKey) ?? '') : '',
                placeholder,
                reason: '占位符承载了可选性 / 用途 / 限制条件，输入后即消失',
            })
            continue
        }

        if (!candidate.labelKey || isExamplePlaceholder(placeholder)) {
            continue
        }

        const label = messagesByKey.get(candidate.labelKey)

        if (!label) {
            continue
        }

        const overlap = compareFieldCopy(label, placeholder)

        if (!overlap) {
            continue
        }

        findings.push({
            ...candidate,
            confidence: overlap,
            kind: 'label-placeholder-overlap',
            label,
            placeholder,
            reason: '标签与占位符表达同一语义',
        })
    }

    const groupedFindings = new Map()

    for (const finding of findings) {
        const identity = [finding.file, finding.kind, finding.placeholderKey].join('|')
        const existing = groupedFindings.get(identity)

        // 同一字段可能在 ClientOnly / fallback 分支里重复渲染，优先保留能解析出标签的那条
        if (!existing || (!existing.labelKey && finding.labelKey)) {
            groupedFindings.set(identity, finding)
        }
    }

    return [...groupedFindings.values()]
}

async function pathExists(targetPath) {
    try {
        await readdir(targetPath, { withFileTypes: true })
        return true
    } catch {
        return false
    }
}

async function collectVueFiles(directory) {
    if (!(await pathExists(directory))) {
        return []
    }

    const entries = await readdir(directory, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const absolutePath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '__snapshots__') {
                continue
            }

            files.push(...await collectVueFiles(absolutePath))
            continue
        }

        if (entry.isFile() && entry.name.endsWith('.vue')) {
            files.push(absolutePath)
        }
    }

    return files
}

async function readJson(targetPath) {
    return JSON.parse(await readFile(targetPath, 'utf8'))
}

function flattenMessages(source, prefix = '', result = new Map()) {
    for (const [key, value] of Object.entries(source)) {
        const nextKey = prefix ? `${prefix}.${key}` : key

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenMessages(value, nextKey, result)
            continue
        }

        result.set(nextKey, String(value))
    }

    return result
}

export async function loadLocaleMessages(projectRoot, locale = DEFAULT_LOCALE) {
    const localeDirectory = path.join(projectRoot, 'i18n', 'locales', locale)
    const entries = await readdir(localeDirectory, { withFileTypes: true })
    const messages = new Map()

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue
        }

        const moduleMessages = flattenMessages(await readJson(path.join(localeDirectory, entry.name)))

        for (const [key, value] of moduleMessages) {
            messages.set(key, value)
        }
    }

    return messages
}

export async function collectFieldCopyReport(options = {}) {
    const projectRoot = options.projectRoot ?? repoRoot
    const locale = options.locale ?? DEFAULT_LOCALE
    const roots = (options.roots ?? DEFAULT_SCAN_ROOTS)
        .map((rootPath) => (path.isAbsolute(rootPath) ? rootPath : path.join(projectRoot, rootPath)))
    const messagesByKey = await loadLocaleMessages(projectRoot, locale)
    const files = (await Promise.all(roots.map((rootPath) => collectVueFiles(rootPath)))).flat()
    const candidates = []

    for (const absoluteFilePath of files) {
        const sourceText = await readFile(absoluteFilePath, 'utf8')
        candidates.push(...extractFieldCopyCandidates(sourceText, toPosixPath(absoluteFilePath, projectRoot)))
    }

    const findings = buildFindings(candidates, messagesByKey)
    const overlapFindings = findings.filter((finding) => finding.kind === 'label-placeholder-overlap')
    const ruleFindings = findings.filter((finding) => finding.kind === 'placeholder-carries-rule')

    return {
        findings,
        generatedAt: new Date().toISOString(),
        locale,
        roots: roots.map((rootPath) => toPosixPath(rootPath, projectRoot)),
        scannedFileCount: files.length,
        summary: {
            labelPlaceholderOverlap: overlapFindings.length,
            placeholderCarriesRule: ruleFindings.length,
            scannedI18nKeys: messagesByKey.size,
            total: findings.length,
        },
    }
}

function formatFinding(finding) {
    const labelPart = finding.labelKey ? `${finding.labelKey}="${finding.label}"` : '(无标签)'

    return `- ${finding.file}:${finding.line} <${finding.control}> [${finding.confidence}]\n    label: ${labelPart}\n    placeholder: ${finding.placeholderKey}="${finding.placeholder}"\n    原因: ${finding.reason}`
}

export function renderTextReport(report, options = {}) {
    const limit = options.limit ?? DEFAULT_LIMIT
    const overlapFindings = report.findings.filter((finding) => finding.kind === 'label-placeholder-overlap')
    const ruleFindings = report.findings.filter((finding) => finding.kind === 'placeholder-carries-rule')
    const applyLimit = (items) => (limit > 0 ? items.slice(0, limit) : items)
    const lines = [
        `字段文案体检（warning 面，不阻断 CI）`,
        `locale: ${report.locale} | 扫描 Vue 文件: ${report.scannedFileCount} | ${report.locale} 词条: ${report.summary.scannedI18nKeys}`,
        '',
        `R1 标签与占位符同义: ${overlapFindings.length} 处`,
        ...applyLimit(overlapFindings).map(formatFinding),
        '',
        `R2 占位符承载规则信息: ${ruleFindings.length} 处`,
        ...applyLimit(ruleFindings).map(formatFinding),
        '',
        `合计: ${report.summary.total} 处。本检查默认只告警；确认阈值后再评估是否升级为 UI 自检条目。`,
    ]

    return lines.join('\n')
}

export function renderMarkdownReport(report, options = {}) {
    const limit = options.limit ?? DEFAULT_LIMIT
    const overlapFindings = report.findings.filter((finding) => finding.kind === 'label-placeholder-overlap')
    const ruleFindings = report.findings.filter((finding) => finding.kind === 'placeholder-carries-rule')
    const applyLimit = (items) => (limit > 0 ? items.slice(0, limit) : items)
    const toRow = (finding) => `| \`${finding.file}:${finding.line}\` | \`${finding.control}\` | ${finding.labelKey ? `\`${finding.labelKey}\`` : '—'} | ${finding.placeholderKey} | ${finding.confidence} |`

    return [
        '# 字段文案体检（warning 面）',
        '',
        `- locale: ${report.locale}`,
        `- 扫描 Vue 文件: ${report.scannedFileCount}`,
        `- ${report.locale} 词条: ${report.summary.scannedI18nKeys}`,
        `- 合计命中: ${report.summary.total}`,
        '',
        `## R1 标签与占位符同义（${overlapFindings.length}）`,
        '',
        '| 位置 | 控件 | 标签 key | 占位符 | 判定 |',
        '|:---|:---|:---|:---|:---|',
        ...applyLimit(overlapFindings).map(toRow),
        '',
        `## R2 占位符承载规则信息（${ruleFindings.length}）`,
        '',
        '| 位置 | 控件 | 标签 key | 占位符 | 判定 |',
        '|:---|:---|:---|:---|:---|',
        ...applyLimit(ruleFindings).map(toRow),
        '',
    ].join('\n')
}

export function renderReport(report, options = {}) {
    if (options.format === 'json') {
        return `${JSON.stringify({
            findings: options.limit > 0 ? report.findings.slice(0, options.limit) : report.findings,
            generatedAt: report.generatedAt,
            locale: report.locale,
            roots: report.roots,
            scannedFileCount: report.scannedFileCount,
            summary: report.summary,
        }, null, 2)}\n`
    }

    if (options.format === 'markdown') {
        return renderMarkdownReport(report, options)
    }

    return renderTextReport(report, options)
}

export async function main(argv = process.argv) {
    const options = parseArgs(argv)
    const projectRoot = options.root ? path.resolve(options.root) : repoRoot
    const report = await collectFieldCopyReport({ locale: options.locale, projectRoot })
    const rendered = renderReport(report, options)

    if (options.output) {
        const outputPath = path.resolve(projectRoot, options.output)

        await writeFile(outputPath, rendered, 'utf8')
        console.info(`Wrote field copy audit to ${outputPath}`)
    } else {
        console.info(rendered)
    }

    if (options.failOnFindings && report.summary.total > 0) {
        process.exitCode = 1
    }

    return report
}

if (isDirectExecution(import.meta.url)) {
    await main()
}
