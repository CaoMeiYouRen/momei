import { describe, expect, it } from 'vitest'
import {
    isVolcengineIclSpeaker,
    isVolcengineV2Speaker,
    normalizeVolcengineSpeaker,
    resolveVolcengineBodyModel,
    resolveVolcengineLoudnessRate,
    resolveVolcengineSpeechRate,
    resolveVolcengineSpeechResourceId,
} from './volcengine-tts-profile'

describe('volcengine tts profile helpers', () => {
    it('normalizes speaker and falls back to default voice', () => {
        expect(normalizeVolcengineSpeaker('')).toBe('zh_female_shuangkuaisisi_moon_bigtts')
        expect(normalizeVolcengineSpeaker('  ')).toBe('zh_female_shuangkuaisisi_moon_bigtts')
        expect(normalizeVolcengineSpeaker(' saturn_zh_female_cancan_tob ')).toBe('saturn_zh_female_cancan_tob')
    })

    it('detects v2 and icl speakers', () => {
        expect(isVolcengineV2Speaker('saturn_zh_female_cancan_tob')).toBe(true)
        expect(isVolcengineV2Speaker('zh_female_vv_uranus_bigtts')).toBe(true)
        expect(isVolcengineV2Speaker('legacy_voice')).toBe(false)

        expect(isVolcengineIclSpeaker('ICL_zh_female_yry_tob')).toBe(true)
        expect(isVolcengineIclSpeaker('S_custom_voice')).toBe(true)
        expect(isVolcengineIclSpeaker('legacy_voice')).toBe(false)
    })

    it('resolves resource id by speaker version', () => {
        expect(resolveVolcengineSpeechResourceId('saturn_zh_female_cancan_tob')).toBe('seed-tts-2.0')
        expect(resolveVolcengineSpeechResourceId('zh_female_vv_uranus_bigtts')).toBe('seed-tts-2.0')
        expect(resolveVolcengineSpeechResourceId('ICL_zh_female_yry_tob')).toBe('seed-icl-1.0')
        expect(resolveVolcengineSpeechResourceId('legacy_voice')).toBe('seed-tts-1.0')
    })

    it('resolves body model with explicit override and defaults', () => {
        expect(resolveVolcengineBodyModel('legacy_voice', 'seed-tts-custom')).toBe('seed-tts-custom')
        expect(resolveVolcengineBodyModel('zh_female_vv_uranus_bigtts', 'unknown')).toBe('seed-tts-2.0-expressive')
        expect(resolveVolcengineBodyModel('legacy_voice')).toBe('seed-tts-1.1')
    })

    it('maps speed and volume to volcengine ranges', () => {
        expect(resolveVolcengineSpeechRate(1.25)).toBe(25)
        expect(resolveVolcengineSpeechRate(0.4)).toBe(-50)
        expect(resolveVolcengineSpeechRate(5)).toBe(100)

        expect(resolveVolcengineLoudnessRate(0.6)).toBe(-40)
        expect(resolveVolcengineLoudnessRate(0.2)).toBe(-50)
        expect(resolveVolcengineLoudnessRate(5)).toBe(100)
    })
})
