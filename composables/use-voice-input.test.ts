import { describe, expect, it, vi } from 'vitest'

const { usePostEditorVoiceMock } = vi.hoisted(() => ({
    usePostEditorVoiceMock: vi.fn(),
}))

vi.mock('./use-post-editor-voice', () => ({
    usePostEditorVoice: usePostEditorVoiceMock,
}))

import { useVoiceInput } from './use-voice-input'

describe('useVoiceInput', () => {
    it('forwards options to usePostEditorVoice and returns its result', () => {
        const result = { isListening: { value: false } }
        usePostEditorVoiceMock.mockReturnValueOnce(result)

        const voiceInput = useVoiceInput({ directMode: true })

        expect(usePostEditorVoiceMock).toHaveBeenCalledWith({ directMode: true })
        expect(voiceInput).toBe(result)
    })
})
