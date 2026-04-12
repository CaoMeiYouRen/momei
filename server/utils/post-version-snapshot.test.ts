import { describe, it, expect } from 'vitest'
import {
    buildPostVersionSnapshot,
    buildLegacyPostVersionSnapshot,
    createSnapshotHash,
    getChangedFields,
    buildCommitSummary,
} from './post-version-snapshot'
import { PostVisibility } from '@/types/post'
import { PostVersionDiffField } from '@/types/post-version'

describe('post-version-snapshot', () => {
    describe('buildPostVersionSnapshot', () => {
        it('should build snapshot with required fields', () => {
            const snapshot = buildPostVersionSnapshot({
                title: '测试标题',
                content: '# 内容',
            })

            expect(snapshot.title).toBe('测试标题')
            expect(snapshot.content).toBe('# 内容')
            expect(snapshot.summary).toBeNull()
            expect(snapshot.coverImage).toBeNull()
            expect(snapshot.categoryId).toBeNull()
            expect(snapshot.tagIds).toEqual([])
            expect(snapshot.visibility).toBe(PostVisibility.PUBLIC)
            expect(snapshot.copyright).toBeNull()
            expect(snapshot.metaVersion).toBe(1)
            expect(snapshot.metadata).toBeNull()
            expect(snapshot.language).toBe('zh-CN')
            expect(snapshot.translationId).toBeNull()
        })

        it('should normalize tagIds from tags array and deduplicate', () => {
            const snapshot = buildPostVersionSnapshot({
                title: 'T',
                content: 'C',
                tags: [{ id: 'b' }, { id: 'a' }, { id: 'a' }],
            })
            expect(snapshot.tagIds).toEqual(['a', 'b'])
        })

        it('should prefer tagIds over tags', () => {
            const snapshot = buildPostVersionSnapshot({
                title: 'T',
                content: 'C',
                tagIds: ['z', 'y'],
                tags: [{ id: 'a' }],
            })
            expect(snapshot.tagIds).toEqual(['y', 'z'])
        })

        it('should deep-clone metadata', () => {
            const metadata = { custom: { nested: true } }
            const snapshot = buildPostVersionSnapshot({ title: 'T', content: 'C', metadata: metadata as any })
            expect(snapshot.metadata).toEqual(metadata)
            expect(snapshot.metadata).not.toBe(metadata)
        })

        it('should use provided visibility when given', () => {
            const snapshot = buildPostVersionSnapshot({
                title: 'T',
                content: 'C',
                visibility: PostVisibility.PRIVATE,
            })
            expect(snapshot.visibility).toBe(PostVisibility.PRIVATE)
        })
    })

    describe('buildLegacyPostVersionSnapshot', () => {
        it('should build minimal legacy snapshot with only title/content/summary', () => {
            const snapshot = buildLegacyPostVersionSnapshot({
                title: 'Legacy',
                content: 'Body',
                summary: 'Short',
            })
            expect(snapshot.title).toBe('Legacy')
            expect(snapshot.content).toBe('Body')
            expect(snapshot.summary).toBe('Short')
        })

        it('should merge fallback fields', () => {
            const snapshot = buildLegacyPostVersionSnapshot(
                { title: 'New', content: 'Body', summary: null },
                { categoryId: 'cat-1', language: 'en-US' },
            )
            expect(snapshot.categoryId).toBe('cat-1')
            expect(snapshot.language).toBe('en-US')
            expect(snapshot.title).toBe('New')
        })
    })

    describe('createSnapshotHash', () => {
        it('should produce consistent SHA-256 hex for same snapshot', () => {
            const snapshot = buildPostVersionSnapshot({ title: 'A', content: 'B' })
            expect(createSnapshotHash(snapshot)).toBe(createSnapshotHash(snapshot))
        })

        it('should produce different hashes for different snapshots', () => {
            const s1 = buildPostVersionSnapshot({ title: 'A', content: 'B' })
            const s2 = buildPostVersionSnapshot({ title: 'A', content: 'C' })
            expect(createSnapshotHash(s1)).not.toBe(createSnapshotHash(s2))
        })
    })

    describe('getChangedFields', () => {
        it('should return all fields when compared against null', () => {
            const snapshot = buildPostVersionSnapshot({ title: 'T', content: 'C', summary: 'S' })
            const changed = getChangedFields(null, snapshot)
            expect(changed).toContain(PostVersionDiffField.TITLE)
            expect(changed).toContain(PostVersionDiffField.CONTENT)
        })

        it('should return only modified fields when comparing two snapshots', () => {
            const base = buildPostVersionSnapshot({ title: 'T', content: 'C' })
            const updated = buildPostVersionSnapshot({ title: 'T', content: 'C2' })
            const changed = getChangedFields(base, updated)
            expect(changed).toContain(PostVersionDiffField.CONTENT)
            expect(changed).not.toContain(PostVersionDiffField.TITLE)
        })

        it('should return empty array when snapshots are identical', () => {
            const snapshot = buildPostVersionSnapshot({ title: 'T', content: 'C' })
            expect(getChangedFields(snapshot, snapshot)).toEqual([])
        })
    })

    describe('buildCommitSummary', () => {
        it('should join source and changed fields', () => {
            expect(buildCommitSummary(
                'manual' as any,
                [PostVersionDiffField.TITLE, PostVersionDiffField.CONTENT],
            )).toBe(`manual:${PostVersionDiffField.TITLE},${PostVersionDiffField.CONTENT}`)
        })

        it('should use no_changes for empty diff', () => {
            expect(buildCommitSummary('auto-save' as any, [])).toBe('auto-save:no_changes')
        })
    })
})
