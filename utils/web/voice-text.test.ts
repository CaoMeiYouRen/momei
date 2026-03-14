import { describe, expect, it } from 'vitest'
import { insertVoiceText } from './voice-text'

describe('insertVoiceText', () => {
    it('appends transcript with paragraph separation', () => {
        const result = insertVoiceText({
            currentValue: 'First line',
            text: 'Second line',
            strategy: 'append-paragraph',
        })

        expect(result.value).toBe('First line\n\nSecond line')
        expect(result.caret).toBe(result.value.length)
    })

    it('inserts transcript at textarea cursor position', () => {
        const result = insertVoiceText({
            currentValue: 'Hello',
            text: 'world',
            strategy: 'cursor',
            selectionStart: 5,
            selectionEnd: 5,
        })

        expect(result.value).toBe('Hello\nworld')
        expect(result.caret).toBe(result.value.length)
    })

    it('replaces selected content when inserting transcript', () => {
        const result = insertVoiceText({
            currentValue: 'Alpha\nBeta',
            text: 'Gamma',
            strategy: 'cursor',
            selectionStart: 6,
            selectionEnd: 10,
        })

        expect(result.value).toBe('Alpha\nGamma')
    })
})
