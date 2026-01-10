import { describe, it, expect, vi } from 'vitest'
import { getDateType } from './type'
import { DATABASE_TYPE } from '@/utils/shared/env'

describe('getDateType', () => {
    it('should return datetime for sqlite', () => {
        expect(getDateType('sqlite')).toBe('datetime')
    })

    it('should return datetime for mysql', () => {
        expect(getDateType('mysql')).toBe('datetime')
    })

    it('should return timestamp with time zone for postgres', () => {
        expect(getDateType('postgres')).toBe('timestamp with time zone')
    })

    it('should return default for unknown type', () => {
        expect(getDateType('oracle' as any)).toBe('datetime')
    })

    it('should use DATABASE_TYPE if no arg provided', () => {
        // Since DATABASE_TYPE is a constant from env,
        // it will return whatever is in the env.
        expect(getDateType()).toBe(DATABASE_TYPE === 'postgres' ? 'timestamp with time zone' : 'datetime')
    })
})
