import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Snowflake } from './snowflake'

describe('Snowflake', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should generate unique IDs', () => {
        const snowflake = new Snowflake(1)
        const id1 = snowflake.generateId()
        const id2 = snowflake.generateId()
        expect(id1).not.toBe(id2)
    })

    it('should generate IDs in increasing order', () => {
        const snowflake = new Snowflake(1)
        const id1 = BigInt(`0x${snowflake.generateId()}`)
        const id2 = BigInt(`0x${snowflake.generateId()}`)
        expect(id2 > id1).toBe(true)
    })

    it('should handle same millisecond', () => {
        const snowflake = new Snowflake(1)
        const now = 1600000000000
        vi.setSystemTime(now)

        const id1 = snowflake.generateId()
        const id2 = snowflake.generateId()

        expect(id1).not.toBe(id2)
    })
})
