import { describe, it, expect } from 'vitest'
import { cleanTextForTTS } from './tts-cleaner'

describe('cleanTextForTTS', () => {
    it('should remove basic markdown elements', () => {
        const input = '# Heading\n\n**Bold** and *italic* and ~~strikethrough~~.\n\n- List item\n\n[Link](https://example.com)\n\n![Image](https://example.com/image.png)\n\n`code` and\n\n```\nblock code\n```'
        const output = cleanTextForTTS(input)
        expect(output).toContain('Heading')
        expect(output).toContain('Bold and italic and strikethrough')
        expect(output).toContain('List item')
        expect(output).toContain('Link')
        expect(output).not.toContain('https://example.com')
        expect(output).not.toContain('Image')
        expect(output).not.toContain('#')
        expect(output).not.toContain('**')
        expect(output).not.toContain('*')
        expect(output).not.toContain('~~')
        expect(output).not.toContain('`')
    })

    it('should remove HTML tags including nested ones', () => {
        const input = 'Hello <script>alert(1)</script> World'
        expect(cleanTextForTTS(input)).toBe('Hello alert(1) World')

        const nested = '<<script>alert(1)</script>>'
        const result = cleanTextForTTS(nested)
        expect(result).not.toContain('<script>')
        expect(result).not.toContain('</script>')
        expect(result).toBe('alert(1)') // Now correctly removes stray >
    })

    it('should remove independent URLs', () => {
        const input = 'Check out https://github.com/CaoMeiYouRen/momei for more details.'
        expect(cleanTextForTTS(input)).toBe('Check out  for more details.')
    })
})
