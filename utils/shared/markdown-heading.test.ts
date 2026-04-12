import { describe, it, expect } from 'vitest'
import { slugifyMarkdownHeading } from './markdown-heading'

describe('slugifyMarkdownHeading', () => {
    it('converts to lowercase', () => {
        expect(slugifyMarkdownHeading('Hello World')).toBe('hello-world')
    })

    it('replaces non-word ASCII characters with hyphens', () => {
        expect(slugifyMarkdownHeading('Hello, World!')).toBe('hello-world-')
    })

    it('keeps Chinese characters', () => {
        expect(slugifyMarkdownHeading('中文标题')).toBe('中文标题')
    })

    it('handles mixed Chinese and ASCII', () => {
        expect(slugifyMarkdownHeading('标题 Title')).toBe('标题-title')
    })

    it('trims surrounding whitespace', () => {
        expect(slugifyMarkdownHeading('  heading  ')).toBe('heading')
    })

    it('handles empty string', () => {
        expect(slugifyMarkdownHeading('')).toBe('')
    })

    it('handles numbers', () => {
        expect(slugifyMarkdownHeading('Section 1.2')).toBe('section-1-2')
    })
})
