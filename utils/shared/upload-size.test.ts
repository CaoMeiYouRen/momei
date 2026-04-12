import { describe, it, expect } from 'vitest'
import { resolveUploadSizeSetting } from './upload-size'

describe('resolveUploadSizeSetting', () => {
    it('returns fallback when value is null', () => {
        const result = resolveUploadSizeSetting(null, 10)
        expect(result.bytes).toBe(10 * 1024 * 1024)
        expect(result.text).toBe('10MB')
    })

    it('returns fallback when value is undefined', () => {
        const result = resolveUploadSizeSetting(undefined, 5)
        expect(result.bytes).toBe(5 * 1024 * 1024)
        expect(result.text).toBe('5MB')
    })

    it('returns fallback when value is empty string', () => {
        const result = resolveUploadSizeSetting('', 2)
        expect(result.bytes).toBe(2 * 1024 * 1024)
        expect(result.text).toBe('2MB')
    })

    it('returns fallback when value is whitespace', () => {
        const result = resolveUploadSizeSetting('   ', 2)
        expect(result.bytes).toBe(2 * 1024 * 1024)
        expect(result.text).toBe('2MB')
    })

    it('parses a plain numeric string as megabytes', () => {
        const result = resolveUploadSizeSetting('20', 10)
        expect(result.bytes).toBe(20 * 1024 * 1024)
        expect(result.text).toBe('20MB')
    })

    it('parses a better-bytes string like 1GB', () => {
        const result = resolveUploadSizeSetting('1GB', 10)
        // better-bytes uses SI decimal: 1 GB = 1_000_000_000 bytes
        expect(result.bytes).toBe(1_000_000_000)
        expect(result.text).toBe('1GB')
    })

    it('parses a better-bytes string like 512MB', () => {
        const result = resolveUploadSizeSetting('512MB', 10)
        // better-bytes uses SI decimal: 1 MB = 1_000_000 bytes
        expect(result.bytes).toBe(512_000_000)
        expect(result.text).toBe('512MB')
    })

    it('returns fallback for invalid value', () => {
        const result = resolveUploadSizeSetting('invalid-value', 8)
        expect(result.bytes).toBe(8 * 1024 * 1024)
        expect(result.text).toBe('8MB')
    })

    it('returns fallback for negative number string', () => {
        const result = resolveUploadSizeSetting('-5', 8)
        expect(result.bytes).toBe(8 * 1024 * 1024)
        expect(result.text).toBe('8MB')
    })
})
