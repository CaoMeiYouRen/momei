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

    it('should wait for next millisecond when sequence is exhausted', () => {
        const snowflake = new Snowflake(1)
        const now = 1600000000000
        let calls = 0
        const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
            calls += 1
            // 前两次返回同一毫秒（触发 nextTimestamp 的等待循环），第三次前进 1ms 退出
            return calls <= 2 ? now : now + 1
        })

        try {
            // 强制 12 位序列号用尽（0xfff → 回绕 0），必须等下一毫秒再取时间戳
            Object.assign(snowflake, { sequence: 0xfff, lastTimestamp: now })

            const id = snowflake.generateId()

            expect(id).toMatch(/^[0-9a-f]+$/u)
            expect(calls).toBeGreaterThanOrEqual(2)
            // ID 的高位时间戳段应为本毫秒（nextTimestamp 只推进等待，不改变本次 ID 的时间戳）
            expect(BigInt(`0x${id}`) >> 22n).toBe(BigInt(now))
        } finally {
            nowSpy.mockRestore()
        }
    })

    it('should handle sequence overflow', () => {
        vi.useRealTimers()
        const snowflake = new Snowflake(1)
        const ids = new Set()
        for (let i = 0; i < 5000; i++) {
            ids.add(snowflake.generateId())
        }
        expect(ids.size).toBe(5000)
    })
})
