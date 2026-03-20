#!/usr/bin/env node
/**
 * 文档事实源一致性检查脚本
 *
 * 检查文档层级是否遵循 AGENTS.md 定义的权威层级：
 * - L0: AGENTS.md
 * - L1: docs/standards/*.md
 * - L2: docs/design/*.md
 * - L3: CLAUDE.md / 平台适配文件
 *
 * 约束规则：
 * 1. 低层级文档不得重复高层级已定义的规则
 * 2. CLAUDE.md 不应包含层级定义（如 L0, L1 等）
 * 3. docs/standards/documentation.md 必须包含"事实源收敛"相关章节
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '../..')

// 检查规则定义
const RULES = [
  {
    file: 'CLAUDE.md',
    maxAge: 90, // 天
    check: (content) => {
      // CLAUDE.md 不应定义层级
      if (content.includes('L0') || content.includes('L1') || content.includes('L2') || content.includes('L3')) {
        return { pass: false, reason: 'CLAUDE.md 不应包含层级定义（L0/L1/L2/L3）' }
      }
      // CLAUDE.md 不应重复 AGENTS.md 的详细内容
      // 允许在表格中引用 PDTFC+，只要不是定义性描述
      // 排除条件：表格行（包含 | 符号）中的引用
      const lines = content.split('\n')
      for (const line of lines) {
        // 跳过表格行
        if (line.includes('|') && line.trim().startsWith('|')) continue
        // 跳过标题和链接引用行
        if (line.startsWith('#') || line.startsWith('-') || line.startsWith('*')) continue
        // 检查是否有 PDTFC+ 定义性描述（而非引用）
        if (line.includes('PDTFC+') && (line.includes('是') || line.includes('定义') || line.includes('指'))) {
          return { pass: false, reason: 'CLAUDE.md 不应定义 PDTFC+，应引用 AGENTS.md' }
        }
      }
      return { pass: true }
    }
  },
  {
    file: 'docs/standards/documentation.md',
    mustContain: ['事实源', 'Source of Truth', '收敛'],
    check: (content) => {
      const hasConvergence = RULES[1].mustContain.some(term => content.includes(term))
      if (!hasConvergence) {
        return {
          pass: false,
          reason: `docs/standards/documentation.md 必须包含"事实源收敛"相关章节，需包含以下之一：${RULES[1].mustContain.join('、')}`
        }
      }
      return { pass: true }
    }
  }
]

// 翻译文档过时检查
const TRANSLATED_DOCS = [
  { path: 'docs/i18n/en-US/', maxAge: 30 },
  { path: 'docs/i18n/zh-TW/', maxAge: 30 },
  { path: 'docs/i18n/ko-KR/', maxAge: 30 },
  { path: 'docs/i18n/ja-JP/', maxAge: 30 }
]

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(ROOT, filePath), 'utf-8')
  } catch {
    return null
  }
}

function getFrontmatterDate(content) {
  const match = content.match(/last_sync:\s*(\d{4}-\d{2}-\d{2})/)
  if (match) {
    return new Date(match[1])
  }
  return null
}

function daysSince(date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function checkFile(filePath, rule) {
  const content = readFile(filePath)
  if (!content) {
    return { pass: false, reason: `文件不存在: ${filePath}` }
  }

  // 基本检查
  const result = rule.check(content)
  if (!result.pass) {
    return result
  }

  // 如果有 maxAge 检查文件修改时间
  if (rule.maxAge) {
    const stats = fs.statSync(path.join(ROOT, filePath))
    const age = daysSince(stats.mtime)
    if (age > rule.maxAge) {
      return {
        pass: false,
        reason: `${filePath} 已超过 ${rule.maxAge} 天未更新（当前：${age} 天）`
      }
    }
  }

  return { pass: true }
}

function checkTranslatedDocs() {
  const results = []

  for (const { path: dir, maxAge } of TRANSLATED_DOCS) {
    const fullPath = path.join(ROOT, dir)
    if (!fs.existsSync(fullPath)) continue

    const files = fs.readdirSync(fullPath, { recursive: true })
      .filter(f => f.endsWith('.md'))

    for (const file of files) {
      const filePath = path.join(dir, file)
      const content = readFile(filePath)
      if (!content) continue

      const lastSync = getFrontmatterDate(content)
      if (lastSync) {
        const age = daysSince(lastSync)
        if (age > maxAge) {
          results.push({
            file: filePath,
            age,
            maxAge,
            pass: false,
            reason: `翻译文档已 ${age} 天未同步（限制：${maxAge} 天）`
          })
        }
      } else {
        results.push({
          file: filePath,
          pass: false,
          reason: `翻译文档缺少 last_sync 元数据: ${filePath}`
        })
      }
    }
  }

  return results
}

// 主检查流程
console.log('🔍 开始文档事实源一致性检查...\n')

let hasErrors = false

// 检查基础规则
for (const rule of RULES) {
  const result = checkFile(rule.file, rule)
  const status = result.pass ? '✅' : '❌'
  console.log(`${status} ${rule.file}`)
  if (!result.pass) {
    console.log(`   └─ ${result.reason}`)
    hasErrors = true
  }
}

// 检查翻译文档
console.log('\n📚 翻译文档时效性检查:')
const translationResults = checkTranslatedDocs()
if (translationResults.length === 0) {
  console.log('✅ 所有翻译文档均在时效范围内')
} else {
  hasErrors = true
  for (const result of translationResults) {
    console.log(`❌ ${result.file}`)
    console.log(`   └─ ${result.reason}`)
  }
}

// 总结
console.log('\n' + '='.repeat(50))
if (hasErrors) {
  console.log('❌ 检查未通过：发现事实源一致性问题')
  process.exit(1)
} else {
  console.log('✅ 所有检查通过：文档事实源层级正确')
  process.exit(0)
}
