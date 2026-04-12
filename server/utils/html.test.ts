import { describe, it, expect } from 'vitest'
import { htmlToPlainText } from './html'

describe('htmlToPlainText', () => {
    it('returns empty string for empty input', () => {
        expect(htmlToPlainText('')).toBe('')
        expect(htmlToPlainText(null as any)).toBe('')
    })

    it('strips HTML tags and returns plain text', () => {
        expect(htmlToPlainText('<p>Hello World</p>')).toBe('Hello World')
    })

    it('handles nested HTML structure', () => {
        const result = htmlToPlainText('<div><p>First</p><p>Second</p></div>')
        expect(result).toContain('First')
        expect(result).toContain('Second')
    })

    it('strips images (no alt text fallback)', () => {
        const result = htmlToPlainText('<p>Text <img src="x.png" alt="Image"> after</p>')
        expect(result).not.toContain('Image')
        expect(result).toContain('Text')
    })

    it('trims leading and trailing whitespace', () => {
        const result = htmlToPlainText('  <p>Content</p>  ')
        expect(result).toBe('Content')
    })

    it('flattens links with same href and text', () => {
        const result = htmlToPlainText('<a href="https://example.com">https://example.com</a>')
        expect(result).not.toContain('[https://example.com]')
    })
})
