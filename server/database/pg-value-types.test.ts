import { describe, expect, it, vi } from 'vitest'
import {
    POSTGRES_VALUE_TYPE_PROBE_SQL,
    checkPostgresValueTypes,
    evaluatePostgresValueTypes,
} from './pg-value-types'

describe('evaluatePostgresValueTypes', () => {
    it('驱动解析正常时通过', () => {
        const result = evaluatePostgresValueTypes({
            bool_value: false,
            int_value: 0,
            json_value: { ok: true },
        })

        expect(result.ok).toBe(true)
        expect(result.issues).toEqual([])
    })

    it('解析器退化（字符串形态）时报告 bool/int/json 三类问题', () => {
        const result = evaluatePostgresValueTypes({
            bool_value: 'f',
            int_value: '0',
            json_value: '{"ok":true}',
        })

        expect(result.ok).toBe(false)
        expect(result.issues).toHaveLength(3)
        expect(result.issues[0]).toContain('bool')
        expect(result.issues[1]).toContain('integer')
        expect(result.issues[2]).toContain('json')
    })

    it('空的 json 值视为异常', () => {
        const result = evaluatePostgresValueTypes({
            bool_value: false,
            int_value: 1,
            json_value: null,
        })

        expect(result.ok).toBe(false)
        expect(result.issues).toEqual([expect.stringContaining('json')])
    })

    it('探针无返回行时视为异常', () => {
        expect(evaluatePostgresValueTypes(undefined).ok).toBe(false)
        expect(evaluatePostgresValueTypes(null).issues).toEqual(['探针未返回任何行'])
    })
})

describe('checkPostgresValueTypes', () => {
    it('执行探针 SQL 并返回首行校验结果', async () => {
        const query = vi.fn().mockResolvedValue([{
            bool_value: true,
            int_value: 1,
            json_value: { ok: true },
        }])

        const result = await checkPostgresValueTypes({ query })

        expect(query).toHaveBeenCalledWith(POSTGRES_VALUE_TYPE_PROBE_SQL)
        expect(result.ok).toBe(true)
    })

    it('返回非数组结果时判定为异常', async () => {
        const query = vi.fn().mockResolvedValue(undefined)

        const result = await checkPostgresValueTypes({ query })

        expect(result.ok).toBe(false)
    })
})
