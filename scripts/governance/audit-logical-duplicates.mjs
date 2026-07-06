import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseCliOptions } from '../shared/cli.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

const SOURCE_FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs'])

function parseArgs(argv = process.argv) {
    return parseCliOptions(argv, {
        defaults: {
            output: null,
            roots: ['utils', 'server/utils'],
        },
        values: {
            '--output': { key: 'output' },
            '--root': {
                key: 'roots',
                parse: (value) => value.split(',').map((item) => item.trim()).filter(Boolean),
                collect: (current = [], next = []) => [...current, ...next],
            },
        },
    })
}

async function collectSourceFiles(targetPath) {
    try {
        const entries = await readdir(targetPath, { withFileTypes: true })
        const files = []

        for (const entry of entries) {
            const absolutePath = path.join(targetPath, entry.name)

            if (entry.isDirectory()) {
                files.push(...await collectSourceFiles(absolutePath))
                continue
            }

            if (entry.isFile() && SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))
                && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
                files.push(absolutePath)
            }
        }

        return files.sort()
    } catch {
        return []
    }
}

function extractFunctions(content, filePath) {
    const functions = []
    const lines = content.split('\n')
    
    // 简单正则匹配导出函数
    const exportFunctionRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/g
    const exportConstRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?(?:<[^>]*>)?\s*\(([^)]*)\)\s*=>/g
    
    let match
    
    while ((match = exportFunctionRegex.exec(content)) !== null) {
        const name = match[1]
        const params = match[2]
        const startIndex = match.index
        const lineNumber = content.slice(0, startIndex).split('\n').length
        
        // 提取函数体（简单实现：找到匹配的花括号）
        const bodyStart = content.indexOf('{', startIndex)
        if (bodyStart === -1) {
            continue
        }
        
        let braceCount = 1
        let bodyEnd = bodyStart + 1
        while (braceCount > 0 && bodyEnd < content.length) {
            if (content[bodyEnd] === '{') {
                braceCount++
            }
            if (content[bodyEnd] === '}') {
                braceCount--
            }
            bodyEnd++
        }
        
        const body = content.slice(bodyStart, bodyEnd)
        const bodyLength = body.split('\n').length
        
        functions.push({
            name,
            params: params.trim(),
            bodyLength,
            filePath,
            lineNumber,
            body: body.slice(0, 500), // 只保留前500字符用于比较
        })
    }
    
    while ((match = exportConstRegex.exec(content)) !== null) {
        const name = match[1]
        const params = match[2]
        const startIndex = match.index
        const lineNumber = content.slice(0, startIndex).split('\n').length
        
        // 箭头函数体
        const arrowIndex = content.indexOf('=>', startIndex)
        if (arrowIndex === -1) {
            continue
        }
        
        const bodyStart = content.indexOf('{', arrowIndex)
        if (bodyStart === -1) {
            continue
        }
        
        let braceCount = 1
        let bodyEnd = bodyStart + 1
        while (braceCount > 0 && bodyEnd < content.length) {
            if (content[bodyEnd] === '{') {
                braceCount++
            }
            if (content[bodyEnd] === '}') {
                braceCount--
            }
            bodyEnd++
        }
        
        const body = content.slice(bodyStart, bodyEnd)
        const bodyLength = body.split('\n').length
        
        functions.push({
            name,
            params: params.trim(),
            bodyLength,
            filePath,
            lineNumber,
            body: body.slice(0, 500),
        })
    }
    
    return functions
}

function calculateSimilarity(func1, func2) {
    let score = 0
    
    // 参数数量相似度
    const params1 = func1.params.split(',').filter((p) => p.trim()).length
    const params2 = func2.params.split(',').filter((p) => p.trim()).length
    const paramDiff = Math.abs(params1 - params2)
    if (paramDiff === 0) {
        score += 30
    } else if (paramDiff === 1) {
        score += 15
    }
    
    // 函数体长度相似度
    const lengthDiff = Math.abs(func1.bodyLength - func2.bodyLength)
    const avgLength = (func1.bodyLength + func2.bodyLength) / 2
    if (avgLength > 0) {
        const lengthSimilarity = 1 - (lengthDiff / avgLength)
        score += Math.max(0, lengthSimilarity * 40)
    }
    
    // 函数名相似度（基于编辑距离）
    const name1 = func1.name.toLowerCase()
    const name2 = func2.name.toLowerCase()
    if (name1 === name2) {
        score += 30
    } else {
        // 简单的前缀匹配
        const prefix1 = name1.slice(0, Math.min(4, name1.length))
        const prefix2 = name2.slice(0, Math.min(4, name2.length))
        if (prefix1 === prefix2) {
            score += 10
        }
        
        // 后缀匹配
        const suffix1 = name1.slice(-3)
        const suffix2 = name2.slice(-3)
        if (suffix1 === suffix2) {
            score += 5
        }
    }
    
    return score
}

function findLogicalDuplicates(functions) {
    const duplicates = []
    const processed = new Set()
    
    for (let i = 0; i < functions.length; i++) {
        if (processed.has(i)) {
            continue
        }
        
        const group = [functions[i]]
        processed.add(i)
        
        for (let j = i + 1; j < functions.length; j++) {
            if (processed.has(j)) {
                continue
            }
            
            const similarity = calculateSimilarity(functions[i], functions[j])
            if (similarity >= 60) { // 阈值
                group.push(functions[j])
                processed.add(j)
            }
        }
        
        if (group.length >= 2) {
            duplicates.push({
                functions: group,
                similarityScore: group.reduce((sum, f, idx) => {
                    if (idx === 0) {
                        return 0
                    }
                    return sum + calculateSimilarity(group[0], f)
                }, 0) / (group.length - 1),
            })
        }
    }
    
    return duplicates.sort((a, b) => b.similarityScore - a.similarityScore)
}

async function main() {
    const args = parseArgs()
    const allFunctions = []
    
    for (const root of args.roots) {
        const rootPath = path.join(repoRoot, root)
        const files = await collectSourceFiles(rootPath)
        
        for (const filePath of files) {
            try {
                const content = await readFile(filePath, 'utf-8')
                const functions = extractFunctions(content, filePath)
                allFunctions.push(...functions)
            } catch (error) {
                console.error(`Error processing ${filePath}:`, error.message)
            }
        }
    }
    
    console.info(`扫描文件数: ${args.roots.length} 个目录`)
    console.info(`提取函数数: ${allFunctions.length}`)
    
    const logicalDuplicates = findLogicalDuplicates(allFunctions)
    
    console.info(`逻辑重复候选组数: ${logicalDuplicates.length}`)
    
    const report = {
        timestamp: new Date().toISOString(),
        scanRoots: args.roots,
        totalFunctions: allFunctions.length,
        logicalDuplicateGroups: logicalDuplicates.length,
        groups: logicalDuplicates.map((group) => ({
            functions: group.functions.map((f) => ({
                name: f.name,
                file: path.relative(repoRoot, f.filePath).replace(/\\/g, '/'),
                line: f.lineNumber,
                paramCount: f.params.split(',').filter((p) => p.trim()).length,
                bodyLength: f.bodyLength,
            })),
            averageSimilarity: Math.round(group.similarityScore),
        })),
    }
    
    if (args.output) {
        const outputPath = path.resolve(repoRoot, args.output)
        await writeFile(outputPath, JSON.stringify(report, null, 2))
        console.info(`JSON 报告已保存到: ${outputPath}`)
    } else {
        console.info(JSON.stringify(report, null, 2))
    }
}

main().catch(console.error)
