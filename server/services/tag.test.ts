import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTag, ensureTags, updateTag } from './tag'
import { dataSource } from '@/server/database'
import { Tag } from '@/server/entities/tag'

describe('tag service', () => {
    beforeAll(async () => {
        if (!dataSource.isInitialized) {
            await dataSource.initialize()
        }
        // 清理测试数据
        const tagRepo = dataSource.getRepository(Tag)
        const allTags = await tagRepo.find()
        if (allTags.length > 0) {
            await tagRepo.remove(allTags)
        }
    })

    afterAll(async () => {
        // 清理测试数据
        const tagRepo = dataSource.getRepository(Tag)
        const allTags = await tagRepo.find()
        if (allTags.length > 0) {
            await tagRepo.remove(allTags)
        }
    })

    describe('createTag', () => {
        it('应该成功创建标签', async () => {
            const tagData = {
                name: 'Test Tag',
                slug: 'test-tag',
                language: 'zh-CN',
            }

            const tag = await createTag(tagData)

            expect(tag).toBeDefined()
            expect(tag.name).toBe(tagData.name)
            expect(tag.slug).toBe(tagData.slug)
            expect(tag.language).toBe(tagData.language)
            expect(tag.translationId).toBe(tagData.slug)
        })

        it('应该在 slug 重复时抛出 409 错误', async () => {
            const tagData = {
                name: 'Unique Tag',
                slug: 'duplicate-slug',
                language: 'zh-CN',
            }

            await createTag(tagData)

            const duplicateData = {
                name: 'Another Tag',
                slug: 'duplicate-slug',
                language: 'zh-CN',
            }

            await expect(createTag(duplicateData)).rejects.toThrow()
        })

        it('应该在名称重复时抛出 409 错误', async () => {
            const tagData = {
                name: 'Duplicate Name',
                slug: 'duplicate-name-1',
                language: 'zh-CN',
            }

            await createTag(tagData)

            const duplicateData = {
                name: 'Duplicate Name',
                slug: 'duplicate-name-2',
                language: 'zh-CN',
            }

            await expect(createTag(duplicateData)).rejects.toThrow()
        })

        it('应该支持自定义 translationId', async () => {
            const tagData = {
                name: 'Custom Translation',
                slug: 'custom-translation',
                language: 'zh-CN',
                translationId: 'custom-id',
            }

            const tag = await createTag(tagData)

            expect(tag.translationId).toBe('custom-id')
        })

        it('应该在翻译组重复时抛出 409 错误', async () => {
            const tagData = {
                name: 'Translation Test 1',
                slug: 'translation-test-1',
                language: 'zh-CN',
                translationId: 'shared-translation-id',
            }

            await createTag(tagData)

            const duplicateData = {
                name: 'Translation Test 2',
                slug: 'translation-test-2',
                language: 'zh-CN',
                translationId: 'shared-translation-id',
            }

            await expect(createTag(duplicateData)).rejects.toThrow()
        })
    })

    describe('updateTag', () => {
        it('应该成功更新标签', async () => {
            const tagData = {
                name: 'Original Name',
                slug: 'original-slug',
                language: 'zh-CN',
            }

            const tag = await createTag(tagData)

            const updatedTag = await updateTag(tag.id, {
                name: 'Updated Name',
            })

            expect(updatedTag.name).toBe('Updated Name')
            expect(updatedTag.slug).toBe('original-slug')
        })

        it('应该在标签不存在时抛出 404 错误', async () => {
            await expect(updateTag('non-existent-id', { name: 'Test' })).rejects.toThrow()
        })

        it('应该在更新后的 slug 重复时抛出 409 错误', async () => {
            const tag1 = await createTag({
                name: 'Tag 1',
                slug: 'tag-1',
                language: 'zh-CN',
            })

            await createTag({
                name: 'Tag 2',
                slug: 'tag-2',
                language: 'zh-CN',
            })

            await expect(updateTag(tag1.id, { slug: 'tag-2' })).rejects.toThrow()
        })

        it('应该在更新后的名称重复时抛出 409 错误', async () => {
            const tag1 = await createTag({
                name: 'Name 1',
                slug: 'name-1',
                language: 'zh-CN',
            })

            await createTag({
                name: 'Name 2',
                slug: 'name-2',
                language: 'zh-CN',
            })

            await expect(updateTag(tag1.id, { name: 'Name 2' })).rejects.toThrow()
        })
    })

    describe('ensureTags', () => {
        it('应该返回空数组当输入为空时', async () => {
            const tags = await ensureTags([], 'zh-CN')
            expect(tags).toEqual([])
        })

        it('应该返回已存在的标签', async () => {
            const existingTag = await createTag({
                name: 'Existing Tag',
                slug: 'existing-tag',
                language: 'zh-CN',
            })

            const tags = await ensureTags(['Existing Tag'], 'zh-CN')

            expect(tags).toHaveLength(1)
            expect(tags[0]?.id).toBe(existingTag.id)
            expect(tags[0]?.name).toBe('Existing Tag')
        })

        it('应该自动创建不存在的标签', async () => {
            const tags = await ensureTags(['New Tag'], 'zh-CN')

            expect(tags).toHaveLength(1)
            expect(tags[0]?.name).toBe('New Tag')
            expect(tags[0]?.slug).toBe('new-tag')
        })

        it('应该混合返回已存在和新创建的标签', async () => {
            await createTag({
                name: 'Existing Mixed',
                slug: 'existing-mixed',
                language: 'zh-CN',
            })

            const tags = await ensureTags(['Existing Mixed', 'New Mixed'], 'zh-CN')

            expect(tags).toHaveLength(2)
            expect(tags[0]?.name).toBe('Existing Mixed')
            expect(tags[1]?.name).toBe('New Mixed')
        })

        it('应该在 slug 冲突时自动添加随机后缀', async () => {
            // 创建一个标签占用 slug
            await createTag({
                name: 'Conflict Test Original',
                slug: 'conflict-test',
                language: 'zh-CN',
            })

            // 尝试创建一个会生成相同 slug 的标签
            const tags = await ensureTags(['Conflict Test'], 'zh-CN')

            expect(tags).toHaveLength(1)
            expect(tags[0]?.name).toBe('Conflict Test')
            expect(tags[0]?.slug).toMatch(/^conflict-test-[a-zA-Z0-9]{4}$/)
        })
    })
})

