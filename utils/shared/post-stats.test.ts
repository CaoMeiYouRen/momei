import { describe, it, expect } from 'vitest'
import { countWords, estimateReadingTime } from '@/utils/shared/post-stats'

describe('post-stats utility', () => {
    it('should count words correctly for Chinese', () => {
        const content = '你好，世界！'
        expect(countWords(content)).toBe(4) // 你、好、世、界
    })

    it('should count words correctly for English', () => {
        const content = 'Hello, world!'
        expect(countWords(content)).toBe(2) // Hello, world
    })

    it('should count words correctly for mixed content', () => {
        const content = '你好 world!'
        expect(countWords(content)).toBe(3) // 你、好、world
    })

    it('should ignore Markdown syntax', () => {
        const content = '# Title\n\n**Bold** and *italic*\n\n[Link](https://example.com)\n\n![Image](img.png)\n\n```js\nconsole.log(1)\n```'
        // Title (1) + Bold (1) + and (1) + italic (1) = 4
        expect(countWords(content)).toBe(4)
    })

    it('should estimate reading time', () => {
        const content = 'Word '.repeat(600)
        expect(estimateReadingTime(content)).toBe(2) // 600 / 300 = 2
    })

    it('should return at least 1 minute for non-empty content', () => {
        const content = 'Short'
        expect(estimateReadingTime(content)).toBe(1)
    })
})
