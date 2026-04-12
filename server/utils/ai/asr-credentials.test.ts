import { describe, it, expect } from 'vitest'
import {
    resolveASRCredentialTtlMilliseconds,
    getASRConfigStatus,
    DEFAULT_ASR_CREDENTIAL_TTL_SECONDS,
    MIN_ASR_CREDENTIAL_TTL_SECONDS,
    MAX_ASR_CREDENTIAL_TTL_SECONDS,
} from './asr-credentials'
import { SettingKey } from '~/types/setting'

describe('resolveASRCredentialTtlMilliseconds', () => {
    it('returns default in ms when value is null', () => {
        expect(resolveASRCredentialTtlMilliseconds(null)).toBe(DEFAULT_ASR_CREDENTIAL_TTL_SECONDS * 1000)
    })

    it('returns default in ms when value is undefined', () => {
        expect(resolveASRCredentialTtlMilliseconds(undefined)).toBe(DEFAULT_ASR_CREDENTIAL_TTL_SECONDS * 1000)
    })

    it('converts numeric value to milliseconds', () => {
        expect(resolveASRCredentialTtlMilliseconds(1200)).toBe(1200000)
    })

    it('converts string number to milliseconds', () => {
        expect(resolveASRCredentialTtlMilliseconds('900')).toBe(900000)
    })

    it('clamps at minimum TTL', () => {
        expect(resolveASRCredentialTtlMilliseconds(1)).toBe(MIN_ASR_CREDENTIAL_TTL_SECONDS * 1000)
    })

    it('clamps at maximum TTL', () => {
        expect(resolveASRCredentialTtlMilliseconds(99999)).toBe(MAX_ASR_CREDENTIAL_TTL_SECONDS * 1000)
    })

    it('accepts value equal to minimum', () => {
        expect(resolveASRCredentialTtlMilliseconds(MIN_ASR_CREDENTIAL_TTL_SECONDS)).toBe(MIN_ASR_CREDENTIAL_TTL_SECONDS * 1000)
    })

    it('accepts value equal to maximum', () => {
        expect(resolveASRCredentialTtlMilliseconds(MAX_ASR_CREDENTIAL_TTL_SECONDS)).toBe(MAX_ASR_CREDENTIAL_TTL_SECONDS * 1000)
    })
})

describe('getASRConfigStatus', () => {
    it('returns all false when settings empty', () => {
        expect(getASRConfigStatus({})).toEqual({ enabled: false, siliconflow: false, volcengine: false })
    })

    it('detects siliconflow via ASR_SILICONFLOW_API_KEY', () => {
        const settings = { [SettingKey.ASR_SILICONFLOW_API_KEY]: 'sk-xxx' }
        const result = getASRConfigStatus(settings)
        expect(result.siliconflow).toBe(true)
        expect(result.enabled).toBe(true)
    })

    it('detects siliconflow via legacy ASR_API_KEY', () => {
        const settings = { [SettingKey.ASR_API_KEY]: 'sk-legacy' }
        const result = getASRConfigStatus(settings)
        expect(result.siliconflow).toBe(true)
        expect(result.enabled).toBe(true)
    })

    it('detects volcengine with ASR_VOLCENGINE_APP_ID + ASR_VOLCENGINE_ACCESS_KEY', () => {
        const settings = {
            [SettingKey.ASR_VOLCENGINE_APP_ID]: 'app-id',
            [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'access-key',
        }
        const result = getASRConfigStatus(settings)
        expect(result.volcengine).toBe(true)
        expect(result.enabled).toBe(true)
    })

    it('detects volcengine with shared VOLCENGINE_APP_ID + VOLCENGINE_ACCESS_KEY', () => {
        const settings = {
            [SettingKey.VOLCENGINE_APP_ID]: 'app-id',
            [SettingKey.VOLCENGINE_ACCESS_KEY]: 'access-key',
        }
        const result = getASRConfigStatus(settings)
        expect(result.volcengine).toBe(true)
        expect(result.enabled).toBe(true)
    })

    it('volcengine false if only app id present', () => {
        const settings = { [SettingKey.ASR_VOLCENGINE_APP_ID]: 'app-id' }
        const result = getASRConfigStatus(settings)
        expect(result.volcengine).toBe(false)
    })

    it('volcengine false if only access key present', () => {
        const settings = { [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'access-key' }
        const result = getASRConfigStatus(settings)
        expect(result.volcengine).toBe(false)
    })

    it('enabled true when both providers configured', () => {
        const settings = {
            [SettingKey.ASR_SILICONFLOW_API_KEY]: 'sk-xxx',
            [SettingKey.ASR_VOLCENGINE_APP_ID]: 'app-id',
            [SettingKey.ASR_VOLCENGINE_ACCESS_KEY]: 'access-key',
        }
        const result = getASRConfigStatus(settings)
        expect(result.enabled).toBe(true)
        expect(result.siliconflow).toBe(true)
        expect(result.volcengine).toBe(true)
    })
})
