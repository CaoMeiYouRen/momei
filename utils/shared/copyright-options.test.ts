import { describe, it, expect } from 'vitest'
import { resolveDefaultCopyrightLicense, getCopyrightLicenseOptions } from './copyright-options'

describe('copyright-options', () => {
    describe('resolveDefaultCopyrightLicense', () => {
        it('returns all-rights-reserved for null', () => {
            const result = resolveDefaultCopyrightLicense(null)
            expect(result).toBeTruthy()
        })

        it('returns all-rights-reserved for undefined', () => {
            const result = resolveDefaultCopyrightLicense(undefined)
            expect(result).toBeTruthy()
        })

        it('returns expected type for known values', () => {
            expect(resolveDefaultCopyrightLicense('cc-by')).toBe('cc-by')
            expect(resolveDefaultCopyrightLicense('cc-zero')).toBe('cc-zero')
            expect(resolveDefaultCopyrightLicense('cc-by-nc')).toBe('cc-by-nc')
        })

        it('returns a fallback for unknown value', () => {
            const result = resolveDefaultCopyrightLicense('unknown-type')
            expect(result).toBeTruthy()
        })
    })

    describe('getCopyrightLicenseOptions', () => {
        it('returns 8 license option entries', () => {
            const t = (key: string) => key
            const options = getCopyrightLicenseOptions(t)
            expect(options).toHaveLength(8)
        })

        it('each option has a label and value', () => {
            const t = (key: string) => `translated:${key}`
            const options = getCopyrightLicenseOptions(t)
            for (const option of options) {
                expect(option.label).toBeTruthy()
                expect(option.value).toBeTruthy()
            }
        })

        it('uses the t function for labels', () => {
            const t = (key: string) => `LABEL:${key}`
            const options = getCopyrightLicenseOptions(t)
            expect(options[0]!.label).toMatch(/^LABEL:/)
        })
    })
})
