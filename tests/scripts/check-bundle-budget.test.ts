import { describe, expect, it } from 'vitest'
import { collectEntryPayloadFilesFromManifest } from '@/scripts/perf/check-bundle-budget.mjs'

describe('collectEntryPayloadFilesFromManifest', () => {
    it('收集入口文件与其 preload 中的 JS 依赖并去重', () => {
        const manifest = {
            entrypoints: ['nuxt/entry.js'],
            modules: {
                'nuxt/entry.js': { file: 'entry-hash.js' },
            },
            dependencies: {
                'nuxt/entry.js': {
                    preload: {
                        '_a.js': { file: 'a.js' },
                        '_b.js': { file: 'b.js' },
                        '_entry.js': { file: 'entry-hash.js' },
                    },
                },
            },
        }

        const result = collectEntryPayloadFilesFromManifest(manifest)

        expect(result.strategy).toBe('manifest-entry-preload')
        expect(result.files.toSorted()).toEqual(['a.js', 'b.js', 'entry-hash.js'])
    })

    it('不把 CSS 计入入口 JS 载荷', () => {
        const manifest = {
            entrypoints: ['nuxt/entry.js'],
            modules: { 'nuxt/entry.js': { file: 'entry-hash.js' } },
            dependencies: {
                'nuxt/entry.js': {
                    preload: {
                        '_style.css': { file: 'entry.css' },
                        '_a.js': { file: 'a.js' },
                    },
                },
            },
        }

        const result = collectEntryPayloadFilesFromManifest(manifest)

        expect(result.files).toEqual(['a.js', 'entry-hash.js'])
    })

    it('支持多个 entrypoint 并忽略缺少 file 的依赖', () => {
        const manifest = {
            entrypoints: ['e1.js', 'e2.js'],
            modules: { 'e1.js': { file: 'one.js' }, 'e2.js': { file: 'two.js' } },
            dependencies: {
                'e1.js': { preload: { '_x.js': { file: 'x.js' }, '_missing.js': {} } },
                'e2.js': { preload: {} },
            },
        }

        const result = collectEntryPayloadFilesFromManifest(manifest)

        expect(result.files.toSorted()).toEqual(['one.js', 'two.js', 'x.js'])
    })

    it('结构不符或缺失时返回不可用，而不是退化为代理口径', () => {
        expect(collectEntryPayloadFilesFromManifest(undefined)).toEqual({ files: [], strategy: 'unavailable' })
        expect(collectEntryPayloadFilesFromManifest({})).toEqual({ files: [], strategy: 'unavailable' })
        expect(collectEntryPayloadFilesFromManifest({ entrypoints: ['e.js'], modules: {} })).toEqual({
            files: [],
            strategy: 'unavailable',
        })
    })
})
