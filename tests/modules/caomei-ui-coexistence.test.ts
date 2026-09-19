import { describe, expect, it } from 'vitest'
import { CONFLICTING_AUTO_IMPORT_NAMES, filterConflictingImports, type AutoImportEntry } from '../../modules/caomei-ui-coexistence'

function createEntry(from: string, name: string): AutoImportEntry {
    return { from, name }
}

describe('filterConflictingImports', () => {
    it('移除 caomei-ui 的冲突条目并保留其非冲突条目', () => {
        const imports = [
            createEntry('caomei-ui', 'useToast'),
            createEntry('caomei-ui', 'useConfirm'),
            createEntry('caomei-ui', 'useTheme'),
            createEntry('caomei-ui', 'useLocale'),
            createEntry('caomei-ui', 'provideLocale'),
        ]

        expect(filterConflictingImports(imports)).toBe(3)
        expect(imports).toEqual([
            createEntry('caomei-ui', 'useLocale'),
            createEntry('caomei-ui', 'provideLocale'),
        ])
    })

    it('不影响其他来源的同名条目', () => {
        const imports = [
            createEntry('primevue/usetoast', 'useToast'),
            createEntry('primevue/useconfirm', 'useConfirm'),
            createEntry('../composables/use-theme', 'useTheme'),
        ]

        expect(filterConflictingImports(imports)).toBe(0)
        expect(imports).toHaveLength(3)
    })

    it('在同一数组中同时保留其他来源与 caomei-ui 的非冲突条目', () => {
        const imports = [
            createEntry('primevue/usetoast', 'useToast'),
            createEntry('caomei-ui', 'useToast'),
            createEntry('caomei-ui', 'useLocale'),
        ]

        expect(filterConflictingImports(imports)).toBe(1)
        expect(imports).toEqual([
            createEntry('primevue/usetoast', 'useToast'),
            createEntry('caomei-ui', 'useLocale'),
        ])
    })

    it('支持自定义冲突集合', () => {
        const imports = [
            createEntry('caomei-ui', 'useToast'),
            createEntry('caomei-ui', 'useLocale'),
        ]

        expect(filterConflictingImports(imports, new Set(['useLocale']))).toBe(1)
        expect(imports).toEqual([createEntry('caomei-ui', 'useToast')])
    })

    it('空数组与缺字段条目不会抛错', () => {
        expect(filterConflictingImports([])).toBe(0)
        expect(filterConflictingImports([{}, { from: 'caomei-ui' }])).toBe(0)
    })

    it('冲突名清单覆盖当前三个同名 composables', () => {
        expect([...CONFLICTING_AUTO_IMPORT_NAMES].toSorted()).toEqual(['useConfirm', 'useTheme', 'useToast'])
    })
})
