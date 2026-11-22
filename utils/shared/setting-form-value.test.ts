import { describe, expect, it } from 'vitest'
import { normalizeSettingFormValue } from './setting-form-value'
import type { SettingFormValue } from '@/types/setting'

describe('normalizeSettingFormValue', () => {
    it('null 与 undefined 归一为空串', () => {
        expect(normalizeSettingFormValue(null)).toBe('')
        expect(normalizeSettingFormValue(undefined)).toBe('')
    })

    it('字符串原样返回，数字与布尔转字符串', () => {
        expect(normalizeSettingFormValue('墨梅')).toBe('墨梅')
        expect(normalizeSettingFormValue('')).toBe('')
        expect(normalizeSettingFormValue(0)).toBe('0')
        expect(normalizeSettingFormValue(42)).toBe('42')
        expect(normalizeSettingFormValue(false)).toBe('false')
    })

    it('非标量取值按空串处理，不渲染 [object Object]', () => {
        // 运行期可能由宽松调用方传入对象 / 数组，这里验证兜底分支而非类型契约
        expect(normalizeSettingFormValue({ a: 1 } as unknown as SettingFormValue)).toBe('')
        expect(normalizeSettingFormValue(['a', 'b'] as unknown as SettingFormValue)).toBe('')
    })
})
