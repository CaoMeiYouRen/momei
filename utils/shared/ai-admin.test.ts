import { describe, it, expect } from 'vitest'
import {
    getAITaskTypeIcon,
    getAITaskStatusSeverity,
    getAIChargeStatusSeverity,
    formatAIAdminJson,
} from './ai-admin'

describe('ai-admin utils', () => {
    describe('getAITaskTypeIcon', () => {
        it('returns correct icon for each known type', () => {
            expect(getAITaskTypeIcon('image_generation')).toBe('pi pi-image')
            expect(getAITaskTypeIcon('tts')).toBe('pi pi-volume-up')
            expect(getAITaskTypeIcon('podcast')).toBe('pi pi-microphone')
            expect(getAITaskTypeIcon('transcription')).toBe('pi pi-comment')
        })

        it('returns default icon for unknown type', () => {
            expect(getAITaskTypeIcon('unknown' as any)).toBe('pi pi-align-left')
        })
    })

    describe('getAITaskStatusSeverity', () => {
        it('returns correct severity for each known status', () => {
            expect(getAITaskStatusSeverity('completed')).toBe('success')
            expect(getAITaskStatusSeverity('processing')).toBe('info')
            expect(getAITaskStatusSeverity('failed')).toBe('danger')
        })

        it('returns secondary for unknown status', () => {
            expect(getAITaskStatusSeverity('unknown' as any)).toBe('secondary')
        })
    })

    describe('getAIChargeStatusSeverity', () => {
        it('returns correct severity for each charge status', () => {
            expect(getAIChargeStatusSeverity('actual')).toBe('success')
            expect(getAIChargeStatusSeverity('estimated')).toBe('warning')
            expect(getAIChargeStatusSeverity('waived')).toBe('secondary')
        })

        it('returns contrast for unknown charge status', () => {
            expect(getAIChargeStatusSeverity(null)).toBe('contrast')
        })
    })

    describe('formatAIAdminJson', () => {
        it('returns empty string for falsy values', () => {
            expect(formatAIAdminJson(null as any)).toBe('')
            expect(formatAIAdminJson(undefined as any)).toBe('')
            expect(formatAIAdminJson('' as any)).toBe('')
        })

        it('returns string data as-is for non-JSON string', () => {
            const result = formatAIAdminJson('Some plain text' as any)
            expect(result).toBe('Some plain text')
        })

        it('pretty-prints a JSON string', () => {
            const result = formatAIAdminJson('{"key":"value"}' as any)
            expect(result).toBe('{\n  "key": "value"\n}')
        })

        it('serializes object data to pretty JSON', () => {
            const result = formatAIAdminJson({ key: 'value' } as any)
            expect(result).toBe('{\n  "key": "value"\n}')
        })
    })
})
