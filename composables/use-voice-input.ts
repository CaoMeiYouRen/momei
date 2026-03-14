import {
    usePostEditorVoice,
    type UsePostEditorVoiceOptions,
    type VoiceTranscriptionMode,
} from './use-post-editor-voice'

export type VoiceInputMode = VoiceTranscriptionMode
export type UseVoiceInputOptions = UsePostEditorVoiceOptions

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
    return usePostEditorVoice(options)
}
