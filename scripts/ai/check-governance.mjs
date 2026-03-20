import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..', '..')

const governanceRoots = {
    githubAgents: path.join(projectRoot, '.github', 'agents'),
    claudeAgents: path.join(projectRoot, '.claude', 'agents'),
    githubSkills: path.join(projectRoot, '.github', 'skills'),
    claudeSkills: path.join(projectRoot, '.claude', 'skills'),
}

const governanceDocs = [
    path.join(projectRoot, 'AGENTS.md'),
    path.join(projectRoot, 'CLAUDE.md'),
    path.join(projectRoot, '.github', 'copilot-instructions.md'),
    path.join(projectRoot, '.cursor', 'rules', 'momei-governance.mdc'),
    path.join(projectRoot, 'docs', 'guide', 'ai-development.md'),
    path.join(projectRoot, 'docs', 'standards', 'ai-governance.md'),
    path.join(projectRoot, 'docs', 'standards', 'development.md'),
]

const scriptRoot = path.join(projectRoot, 'scripts')
const scriptSearchRoots = [
    path.join(projectRoot, 'package.json'),
    path.join(projectRoot, 'AGENTS.md'),
    path.join(projectRoot, 'CLAUDE.md'),
    path.join(projectRoot, 'docs'),
    path.join(projectRoot, '.github', 'workflows'),
]
const scriptTempDirNames = new Set(['temp', 'tmp', '_temp', '_tmp'])

const supportedSkillFrontmatterKeys = new Set([
    'argument-hint',
    'compatibility',
    'description',
    'disable-model-invocation',
    'license',
    'metadata',
    'name',
    'user-invocable',
])

function toPosixPath(targetPath) {
    return path.relative(projectRoot, targetPath).replaceAll('\\', '/')
}

async function pathExists(targetPath) {
    try {
        await access(targetPath)
        return true
    } catch {
        return false
    }
}

async function listFilesRecursive(baseDir, matcher, currentDir = '') {
    const targetDir = path.join(baseDir, currentDir)
    const entries = await readdir(targetDir, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
        const relativePath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
            files.push(...await listFilesRecursive(baseDir, matcher, relativePath))
            continue
        }

        if (entry.isFile() && matcher(entry.name)) {
            files.push(relativePath.replaceAll('\\', '/'))
        }
    }

    return files.sort()
}

async function listDirectoriesRecursive(baseDir, currentDir = '') {
    const targetDir = path.join(baseDir, currentDir)
    const entries = await readdir(targetDir, { withFileTypes: true })
    const directories = []

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue
        }

        const relativePath = path.join(currentDir, entry.name)
        const normalizedPath = relativePath.replaceAll('\\', '/')

        directories.push(normalizedPath)
        directories.push(...await listDirectoriesRecursive(baseDir, relativePath))
    }

    return directories.sort()
}

async function readUtf8(filePath) {
    return readFile(filePath, 'utf8')
}

async function readRaw(filePath) {
    return readFile(filePath)
}

function isScriptFile(fileName) {
    return ['.mjs', '.js', '.cjs', '.ts'].includes(path.extname(fileName))
}

function isTemporaryScript(relativeFile) {
    const segments = relativeFile.split('/')
    return segments.some((segment) => scriptTempDirNames.has(segment))
}

function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)

    if (!match) {
        return null
    }

    const raw = match[1]
    const keys = []

    for (const line of raw.split(/\r?\n/u)) {
        const keyMatch = line.match(/^([A-Za-z0-9_-]+):/u)

        if (keyMatch) {
            keys.push(keyMatch[1])
        }
    }

    return {
        raw,
        keys,
    }
}

function extractMarkdownLinks(content) {
    const links = []
    const regex = /\[[^\]]+\]\(([^)]+)\)/gu

    for (const match of content.matchAll(regex)) {
        links.push(match[1].trim())
    }

    return links
}

function isExternalLink(target) {
    return /^[a-z][a-z0-9+.-]*:/iu.test(target)
}

function normalizeLocalTarget(target) {
    return target.split('#')[0]
}

function buildIssue(type, filePath, message, severity = 'error') {
    return {
        type,
        filePath,
        message,
        severity,
    }
}

async function validateSkillFile(filePath, issues) {
    const content = await readUtf8(filePath)
    const relativePath = toPosixPath(filePath)
    const frontmatter = parseFrontmatter(content)

    if (!frontmatter) {
        issues.push(buildIssue('missing-frontmatter', relativePath, '缺少 frontmatter。'))
        return
    }

    if (!frontmatter.keys.includes('name')) {
        issues.push(buildIssue('missing-name', relativePath, '缺少 name 字段。'))
    }

    if (!frontmatter.keys.includes('description')) {
        issues.push(buildIssue('missing-description', relativePath, '缺少 description 字段。'))
    }

    for (const key of frontmatter.keys) {
        if (!supportedSkillFrontmatterKeys.has(key)) {
            issues.push(buildIssue('unsupported-skill-frontmatter', relativePath, `包含不受支持的 skill frontmatter 字段: ${key}`))
        }
    }

    const folderName = path.basename(path.dirname(filePath))
    const declaredName = frontmatter.raw.match(/^name:\s*(.+)$/mu)?.[1]?.trim()

    if (declaredName && declaredName !== folderName) {
        issues.push(buildIssue('skill-name-mismatch', relativePath, `frontmatter name 与目录名不一致: ${declaredName} != ${folderName}`))
    }

    for (const target of extractMarkdownLinks(content)) {
        if (isExternalLink(target) || target.startsWith('#')) {
            continue
        }

        if (target.includes('#')) {
            issues.push(buildIssue('skill-anchor-link', relativePath, `skill 相对链接不能携带锚点: ${target}`))
        }

        const normalizedTarget = normalizeLocalTarget(target)

        if (!normalizedTarget) {
            continue
        }

        const resolvedPath = path.resolve(path.dirname(filePath), normalizedTarget)

        if (!(await pathExists(resolvedPath))) {
            issues.push(buildIssue('missing-link-target', relativePath, `相对链接目标不存在: ${target}`))
        }
    }
}

async function validateAgentOrDocLinks(filePath, issues) {
    const content = await readUtf8(filePath)
    const relativePath = toPosixPath(filePath)

    for (const target of extractMarkdownLinks(content)) {
        if (isExternalLink(target) || target.startsWith('#')) {
            continue
        }

        const normalizedTarget = normalizeLocalTarget(target)

        if (!normalizedTarget) {
            continue
        }

        const resolvedPath = path.resolve(path.dirname(filePath), normalizedTarget)

        if (!(await pathExists(resolvedPath))) {
            issues.push(buildIssue('missing-link-target', relativePath, `相对链接目标不存在: ${target}`))
        }
    }
}

async function compareMirrorTrees(mainRoot, mirrorRoot, relativeFiles, issues, type) {
    for (const relativeFile of relativeFiles) {
        const mainPath = path.join(mainRoot, relativeFile)
        const mirrorPath = path.join(mirrorRoot, relativeFile)

        if (!(await pathExists(mirrorPath))) {
            issues.push(buildIssue('missing-mirror-file', toPosixPath(mainPath), `${type} 镜像缺失: ${toPosixPath(mirrorPath)}`))
            continue
        }

        const [mainContent, mirrorContent] = await Promise.all([
            readRaw(mainPath),
            readRaw(mirrorPath),
        ])

        if (!mainContent.equals(mirrorContent)) {
            issues.push(buildIssue('mirror-drift', toPosixPath(mainPath), `${type} 主定义与镜像内容不一致: ${toPosixPath(mirrorPath)}`))
        }
    }
}

function findMissingRelativeFiles(mainFiles, mirrorFiles) {
    const mirrorSet = new Set(mirrorFiles)
    return mainFiles.filter((file) => !mirrorSet.has(file))
}

function findExtraRelativeFiles(mainFiles, mirrorFiles) {
    const mainSet = new Set(mainFiles)
    return mirrorFiles.filter((file) => !mainSet.has(file))
}

async function listImmediateDirectories(baseDir) {
    if (!(await pathExists(baseDir))) {
        return []
    }

    const entries = await readdir(baseDir, { withFileTypes: true })
    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
}

async function collectReferenceWarnings(skillFiles, agentFiles) {
    const searchableFiles = [
        ...governanceDocs,
        ...agentFiles,
        ...skillFiles,
    ]
    const searchableContents = new Map()

    for (const filePath of searchableFiles) {
        searchableContents.set(filePath, await readUtf8(filePath))
    }

    const warnings = []

    for (const skillPath of skillFiles) {
        const skillName = path.basename(path.dirname(skillPath))
        const skillNeedle = `${skillName}/SKILL.md`
        let referenced = false

        for (const [filePath, content] of searchableContents.entries()) {
            if (filePath === skillPath) {
                continue
            }

            if (content.includes(skillNeedle) || content.includes(skillName)) {
                referenced = true
                break
            }
        }

        if (!referenced) {
            warnings.push(buildIssue('unreferenced-skill', toPosixPath(skillPath), '未在其他治理文件中发现引用，建议确认是否仍需保留。', 'warning'))
        }
    }

    for (const agentPath of agentFiles) {
        const fileName = path.basename(agentPath)
        const agentKey = fileName.replace(/\.agent\.md$/u, '')
        let referenced = false

        for (const [filePath, content] of searchableContents.entries()) {
            if (filePath === agentPath) {
                continue
            }

            if (content.includes(fileName) || content.includes(agentKey)) {
                referenced = true
                break
            }
        }

        if (!referenced) {
            warnings.push(buildIssue('unreferenced-agent', toPosixPath(agentPath), '未在其他治理文件中发现引用，建议确认是否仍需保留。', 'warning'))
        }
    }

    return warnings
}

async function collectSearchableFiles(targetPath) {
    if (!(await pathExists(targetPath))) {
        return []
    }

    const statLikeFiles = []

    try {
        const entries = await readdir(targetPath, { withFileTypes: true })

        for (const entry of entries) {
            const absolutePath = path.join(targetPath, entry.name)

            if (entry.isDirectory()) {
                statLikeFiles.push(...await collectSearchableFiles(absolutePath))
                continue
            }

            if (entry.isFile() && ['.md', '.json', '.yml', '.yaml'].includes(path.extname(entry.name))) {
                statLikeFiles.push(absolutePath)
            }
        }

        return statLikeFiles
    } catch {
        return [targetPath]
    }
}

async function collectScriptReferenceWarnings(scriptFiles) {
    const searchableFiles = []

    for (const root of scriptSearchRoots) {
        searchableFiles.push(...await collectSearchableFiles(root))
    }

    const uniqueSearchableFiles = unique(searchableFiles)
    const searchableContents = new Map()

    for (const filePath of uniqueSearchableFiles) {
        searchableContents.set(filePath, await readUtf8(filePath))
    }

    const warnings = []

    for (const scriptPath of scriptFiles) {
        const relativePath = toPosixPath(scriptPath)

        if (isTemporaryScript(relativePath.replace(/^scripts\//u, ''))) {
            continue
        }

        let referenced = false

        for (const content of searchableContents.values()) {
            if (content.includes(relativePath)) {
                referenced = true
                break
            }
        }

        if (!referenced) {
            warnings.push(buildIssue('unreferenced-script', relativePath, '未在 package.json、工作流或规范文档中发现稳定入口，建议确认是否仍应作为长期脚本保留。', 'warning'))
        }
    }

    return warnings
}

function printSection(title, lines) {
    console.info(`${title}:`)

    if (lines.length === 0) {
        console.info('- 无')
        return
    }

    for (const line of lines) {
        console.info(`- ${line}`)
    }
}

function unique(values) {
    return [...new Set(values)].sort()
}

async function main() {
    const issues = []

    const githubSkillRelFiles = await listFilesRecursive(governanceRoots.githubSkills, (name) => name === 'SKILL.md')
    const claudeSkillRelFiles = await listFilesRecursive(governanceRoots.claudeSkills, (name) => name === 'SKILL.md')
    const githubAgentRelFiles = await listFilesRecursive(governanceRoots.githubAgents, (name) => name.endsWith('.agent.md'))
    const claudeAgentRelFiles = await listFilesRecursive(governanceRoots.claudeAgents, (name) => name.endsWith('.agent.md'))
    const githubSkillMirrorFiles = await listFilesRecursive(governanceRoots.githubSkills, () => true)
    const claudeSkillMirrorFiles = await listFilesRecursive(governanceRoots.claudeSkills, () => true)
    const githubAgentMirrorFiles = await listFilesRecursive(governanceRoots.githubAgents, () => true)
    const claudeAgentMirrorFiles = await listFilesRecursive(governanceRoots.claudeAgents, () => true)
    const githubSkillDirs = await listDirectoriesRecursive(governanceRoots.githubSkills)
    const claudeSkillDirs = await listDirectoriesRecursive(governanceRoots.claudeSkills)
    const githubAgentDirs = await listDirectoriesRecursive(governanceRoots.githubAgents)
    const claudeAgentDirs = await listDirectoriesRecursive(governanceRoots.claudeAgents)

    const missingSkillMirrors = findMissingRelativeFiles(githubSkillMirrorFiles, claudeSkillMirrorFiles)
    const missingAgentMirrors = findMissingRelativeFiles(githubAgentMirrorFiles, claudeAgentMirrorFiles)
    const extraSkillMirrors = findExtraRelativeFiles(githubSkillMirrorFiles, claudeSkillMirrorFiles)
    const extraAgentMirrors = findExtraRelativeFiles(githubAgentMirrorFiles, claudeAgentMirrorFiles)
    const extraSkillDirs = findExtraRelativeFiles(githubSkillDirs, claudeSkillDirs)
    const extraAgentDirs = findExtraRelativeFiles(githubAgentDirs, claudeAgentDirs)

    for (const relativeFile of missingSkillMirrors) {
        issues.push(buildIssue('missing-mirror-file', `.github/skills/${relativeFile}`, `缺少 .claude skill 镜像: .claude/skills/${relativeFile}`))
    }

    for (const relativeFile of missingAgentMirrors) {
        issues.push(buildIssue('missing-mirror-file', `.github/agents/${relativeFile}`, `缺少 .claude agent 镜像: .claude/agents/${relativeFile}`))
    }

    for (const relativeFile of extraSkillMirrors) {
        issues.push(buildIssue('extra-mirror-file', `.claude/skills/${relativeFile}`, `发现多余的 .claude skill 镜像定义: .claude/skills/${relativeFile}`))
    }

    for (const relativeFile of extraAgentMirrors) {
        issues.push(buildIssue('extra-mirror-file', `.claude/agents/${relativeFile}`, `发现多余的 .claude agent 镜像定义: .claude/agents/${relativeFile}`))
    }

    for (const directoryName of extraSkillDirs) {
        issues.push(buildIssue('extra-mirror-directory', `.claude/skills/${directoryName}`, `发现未在 .github/skills 中定义的残留镜像目录: .claude/skills/${directoryName}`))
    }

    for (const directoryName of extraAgentDirs) {
        issues.push(buildIssue('extra-mirror-directory', `.claude/agents/${directoryName}`, `发现未在 .github/agents 中定义的残留镜像目录: .claude/agents/${directoryName}`))
    }

    const githubSkillFiles = githubSkillRelFiles.map((relativeFile) => path.join(governanceRoots.githubSkills, relativeFile))
    const githubAgentFiles = githubAgentRelFiles.map((relativeFile) => path.join(governanceRoots.githubAgents, relativeFile))
    const projectScriptRelFiles = await listFilesRecursive(scriptRoot, isScriptFile)
    const projectScriptFiles = projectScriptRelFiles.map((relativeFile) => path.join(scriptRoot, relativeFile))

    await compareMirrorTrees(governanceRoots.githubSkills, governanceRoots.claudeSkills, githubSkillMirrorFiles, issues, 'skill')
    await compareMirrorTrees(governanceRoots.githubAgents, governanceRoots.claudeAgents, githubAgentMirrorFiles, issues, 'agent')

    for (const skillFile of githubSkillFiles) {
        await validateSkillFile(skillFile, issues)
    }

    for (const agentFile of githubAgentFiles) {
        await validateAgentOrDocLinks(agentFile, issues)
    }

    for (const docFile of governanceDocs) {
        await validateAgentOrDocLinks(docFile, issues)
    }

    const deferredIssues = [
        ...await collectReferenceWarnings(githubSkillFiles, githubAgentFiles),
        ...await collectScriptReferenceWarnings(projectScriptFiles),
    ]

    const blockingIssues = issues.filter((issue) => issue.severity === 'error')
    const impactPaths = unique([...blockingIssues, ...deferredIssues].map((issue) => issue.filePath))
    const suggestionLines = unique([
        blockingIssues.some((issue) => issue.type === 'unsupported-skill-frontmatter')
            ? '删除 skill frontmatter 中不受支持的字段，仅保留受支持键。'
            : null,
        blockingIssues.some((issue) => issue.type === 'skill-anchor-link')
            ? '移除 skill 相对链接中的锚点，仅保留实际文件路径。'
            : null,
        blockingIssues.some((issue) => issue.type === 'missing-link-target')
            ? '修正治理文档中的相对路径，确保目标文件真实存在。'
            : null,
        blockingIssues.some((issue) => ['mirror-drift', 'missing-mirror-file', 'extra-mirror-file', 'extra-mirror-directory'].includes(issue.type))
            ? '以 .github 作为主定义，并将 .claude 镜像同步到逐文件一致。'
            : null,
        deferredIssues.some((issue) => issue.type === 'unreferenced-script')
            ? '为长期脚本补充 package.json、工作流或规范文档入口；若仅服务于单次任务，则改为短期脚本并在收口前删除。'
            : null,
        deferredIssues.length > 0
            ? '为未被引用的 agent / skill 补充入口引用，或确认后归档删除。'
            : null,
    ].filter(Boolean))

    console.info(blockingIssues.length === 0 ? 'AI governance check passed.' : 'AI governance check failed.')

    printSection('问题清单', blockingIssues.map((issue) => `[${issue.type}] ${issue.filePath}: ${issue.message}`))
    printSection('影响范围', impactPaths)
    printSection('修复建议', suggestionLines)
    printSection('可延后事项', deferredIssues.map((issue) => `[${issue.type}] ${issue.filePath}: ${issue.message}`))

    if (blockingIssues.length > 0) {
        process.exitCode = 1
    }
}

await main()
