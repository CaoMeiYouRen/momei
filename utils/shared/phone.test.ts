import { describe, it, expect } from 'vitest'
import {
    formatPhoneNumber,
    formatPhoneNumberInternational,
    getRegionCodeForPhoneNumber,
} from './phone'

describe('phone.ts', () => {
    describe('formatPhoneNumber', () => {
        it('should format to E164', () => {
            expect(formatPhoneNumber('13800138000', 'CN')).toBe('+8613800138000')
            expect(formatPhoneNumber('+8613800138000')).toBe('+8613800138000')
        })
    })

    describe('formatPhoneNumberInternational', () => {
        it('should format to International', () => {
            expect(formatPhoneNumberInternational('13800138000', 'CN')).toBe('+86 138 0013 8000')
        })
    })

    describe('getRegionCodeForPhoneNumber', () => {
        it('should get region code', () => {
            expect(getRegionCodeForPhoneNumber('+8613800138000')).toBe('CN')
            expect(getRegionCodeForPhoneNumber('+12024561414')).toBe('US')
        })

        it('should default to CN for unknown', () => {
            // If it can't parse, it returns CN as per implementation try-catch
            expect(getRegionCodeForPhoneNumber('invalid')).toBe('CN')
        })
    })
})
