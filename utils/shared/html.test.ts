import { describe, expect, it } from 'vitest'
import { plainTextToHtml, sanitizeHtmlToText } from './html'

describe('shared html utilities', () => {
    it('removes html tags while decoding entities safely', () => {
        expect(sanitizeHtmlToText('<strong>Safe &amp; Sound</strong>')).toBe('Safe & Sound')
    })

    it('does not double-unescape ampersand-prefixed entities', () => {
        expect(sanitizeHtmlToText('Heading &amp;quot; &amp;lt;tag&amp;gt;')).toBe('Heading &quot; &lt;tag&gt;')
    })

    it('escapes plain text for html output while preserving line breaks', () => {
        expect(plainTextToHtml('A&B\n<C>')).toBe('A&amp;B<br/>&lt;C&gt;')
    })
})
