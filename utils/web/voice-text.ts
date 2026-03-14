export type VoiceTextInsertStrategy = 'append' | 'append-paragraph' | 'cursor'

export interface VoiceTextInsertionOptions {
    currentValue: string
    text: string
    strategy?: VoiceTextInsertStrategy
    selectionStart?: number | null
    selectionEnd?: number | null
}

export interface VoiceTextInsertionResult {
    value: string
    caret: number
}

function normalizeVoiceText(text: string) {
    return text.trim()
}

export function insertVoiceText({
    currentValue,
    text,
    strategy = 'append',
    selectionStart,
    selectionEnd,
}: VoiceTextInsertionOptions): VoiceTextInsertionResult {
    const normalizedText = normalizeVoiceText(text)
    const value = currentValue || ''

    if (!normalizedText) {
        const fallbackCaret = selectionEnd ?? selectionStart ?? value.length
        return {
            value,
            caret: fallbackCaret,
        }
    }

    if (strategy === 'append' || strategy === 'append-paragraph') {
        let separator = ''

        if (strategy === 'append-paragraph') {
            if (value.length > 0) {
                if (value.endsWith('\n\n')) {
                    separator = ''
                } else if (value.endsWith('\n')) {
                    separator = '\n'
                } else {
                    separator = '\n\n'
                }
            }
        } else if (value.length > 0 && !value.endsWith('\n')) {
            separator = '\n'
        }

        const nextValue = `${value}${separator}${normalizedText}`
        return {
            value: nextValue,
            caret: nextValue.length,
        }
    }

    const start = selectionStart ?? value.length
    const end = selectionEnd ?? start
    const before = value.slice(0, start)
    const after = value.slice(end)
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : ''
    const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : ''
    const insertion = `${prefix}${normalizedText}${suffix}`
    const nextValue = `${before}${insertion}${after}`

    return {
        value: nextValue,
        caret: before.length + insertion.length,
    }
}
