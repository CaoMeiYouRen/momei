import { describe, expect, it } from 'vitest'
import type { CAC } from 'cac'
import { getParser, registerImportCommand } from './import-command'
import { parseHexoFiles } from './parser'
import { HugoParser } from './hugo-parser'
import { JekyllParser } from './jekyll-parser'
import { WordPressParser } from './wordpress-parser'

function createStubCac() {
    const options: Array<{ flags: string, description: string }> = []
    const chain = {
        command: () => chain,
        option: (flags: string, description: string) => {
            options.push({ flags, description })
            return chain
        },
        action: () => chain,
    }

    return {
        cli: chain as unknown as CAC,
        options,
    }
}

describe('import-command', () => {
    it('按 --format 选择对应解析器', () => {
        expect(getParser('jekyll')).toBeInstanceOf(JekyllParser)
        expect(getParser('hugo')).toBeInstanceOf(HugoParser)
        expect(getParser('wordpress')).toBeInstanceOf(WordPressParser)
    })

    it('未指定或未知 format 时回退到 Hexo 解析器', () => {
        expect(getParser(undefined).parse).toBe(parseHexoFiles)
        expect(getParser('unknown-format').parse).toBe(parseHexoFiles)
    })

    it('--format 帮助文本包含 jekyll', () => {
        const { cli, options } = createStubCac()
        registerImportCommand(cli)

        const formatOption = options.find((option) => option.flags.startsWith('--format'))

        expect(formatOption?.description).toContain('jekyll')
    })
})
