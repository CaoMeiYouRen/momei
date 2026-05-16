const DEFAULT_VOLCENGINE_SPEAKER = 'zh_female_shuangkuaisisi_moon_bigtts'

export function normalizeVolcengineSpeaker(speaker: string | null | undefined): string {
    const normalizedSpeaker = speaker?.trim()
    return normalizedSpeaker || DEFAULT_VOLCENGINE_SPEAKER
}

export function isVolcengineV2Speaker(speaker: string): boolean {
    return speaker.startsWith('saturn_') || speaker.endsWith('_uranus_bigtts')
}

export function isVolcengineIclSpeaker(speaker: string): boolean {
    return speaker.startsWith('ICL_')
        || speaker.startsWith('icl_')
        || speaker.startsWith('S_')
        || speaker.startsWith('s_')
}

export function resolveVolcengineSpeechResourceId(speaker: string | null | undefined): string {
    const normalizedSpeaker = normalizeVolcengineSpeaker(speaker)

    if (isVolcengineV2Speaker(normalizedSpeaker)) {
        return 'seed-tts-2.0'
    }

    if (isVolcengineIclSpeaker(normalizedSpeaker)) {
        return 'seed-icl-1.0'
    }

    return 'seed-tts-1.0'
}

export function resolveVolcengineBodyModel(
    speaker: string | null | undefined,
    explicitModel?: string,
): string {
    if (explicitModel && explicitModel !== 'unknown' && explicitModel !== 'seed-tts-2.0') {
        return explicitModel
    }

    return isVolcengineV2Speaker(normalizeVolcengineSpeaker(speaker))
        ? 'seed-tts-2.0-expressive'
        : 'seed-tts-1.1'
}

export function resolveVolcengineSpeechRate(speed?: number): number {
    const normalizedSpeed = speed ?? 1
    return normalizedSpeed >= 1
        ? Math.min(100, Math.round((normalizedSpeed - 1) * 100))
        : Math.max(-50, Math.round((normalizedSpeed - 1) * 100))
}

export function resolveVolcengineLoudnessRate(volume?: number): number {
    const normalizedVolume = volume ?? 1
    return normalizedVolume >= 1
        ? Math.min(100, Math.round((normalizedVolume - 1) * 100))
        : Math.max(-50, Math.round((normalizedVolume - 1) * 100))
}
