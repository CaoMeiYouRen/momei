import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCategory, ensureCategory, updateCategory } from './category'
import { dataSource } from '@/server/database'
import { generateRandomString } from '@/utils/shared/random'

vi.mock('@/server/database')
vi.mock('@/utils/shared/random')

describe('category service', () => {
    const mockCategoryRepo = {
        findOneBy: vi.fn(),
        findOne: vi.fn(),
        save: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // mockReset 清空 once 队列，避免 mockRejectedValueOnce / mockImplementationOnce 跨测试累积污染
        mockCategoryRepo.findOneBy.mockReset()
        mockCategoryRepo.findOne.mockReset()
        mockCategoryRepo.save.mockReset()
        vi.mocked(dataSource.getRepository).mockReturnValue(mockCategoryRepo as any)
    })

    describe('createCategory', () => {
        it('should create a new category', async () => {
            const categoryData = {
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(null)
            mockCategoryRepo.save.mockResolvedValue({ id: '1', ...categoryData })

            const result = await createCategory(categoryData)

            expect(result).toMatchObject(categoryData)
            expect(mockCategoryRepo.save).toHaveBeenCalled()
        })

        it('should throw error if slug already exists in same language', async () => {
            const categoryData = {
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy.mockResolvedValueOnce({ id: '1', slug: 'technology' })

            await expect(createCategory(categoryData)).rejects.toThrow('Category slug already exists')
        })

        it('should throw error if name already exists in same language', async () => {
            const categoryData = {
                name: 'Technology',
                slug: 'tech',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy
                .mockResolvedValueOnce(null) // slug check
                .mockResolvedValueOnce({ id: '1', name: 'Technology' }) // name check

            await expect(createCategory(categoryData)).rejects.toThrow('Category name already exists')
        })

        it('should throw error if translation already exists in same language', async () => {
            const categoryData = {
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
                translationId: 'tech-group',
            }

            mockCategoryRepo.findOneBy
                .mockResolvedValueOnce(null) // slug check
                .mockResolvedValueOnce(null) // name check
                .mockResolvedValueOnce({ id: '1', translationId: 'tech-group' }) // translation check

            await expect(createCategory(categoryData)).rejects.toThrow('A translation for this group already exists')
        })

        it('should throw error if parent category not found', async () => {
            const categoryData = {
                name: 'Subcategory',
                slug: 'subcategory',
                language: 'zh-CN',
                parentId: 'non-existent',
            }

            mockCategoryRepo.findOneBy
                .mockResolvedValueOnce(null) // slug check
                .mockResolvedValueOnce(null) // name check
                .mockResolvedValueOnce(null) // translation check
                .mockResolvedValueOnce(null) // parent check

            await expect(createCategory(categoryData)).rejects.toThrow('Parent category not found')
        })

        it('should set translationId to slug if not provided', async () => {
            const categoryData = {
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(null)
            mockCategoryRepo.save.mockImplementation((cat) => Promise.resolve(cat))

            await createCategory(categoryData)

            expect(mockCategoryRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    translationId: 'technology',
                }),
            )
        })
    })

    describe('updateCategory', () => {
        it('should update category', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            const updates = {
                name: 'Tech',
                description: 'Updated description',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(existingCategory)
            mockCategoryRepo.findOne.mockResolvedValue(null)
            mockCategoryRepo.save.mockResolvedValue({ ...existingCategory, ...updates })

            const result = await updateCategory('1', updates)

            expect(result).toMatchObject(updates)
            expect(mockCategoryRepo.save).toHaveBeenCalled()
        })

        it('should throw error if category not found', async () => {
            mockCategoryRepo.findOneBy.mockResolvedValue(null)

            await expect(updateCategory('999', { name: 'New Name' })).rejects.toThrow('Category not found')
        })

        it('should throw error if updated slug conflicts', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(existingCategory)
            mockCategoryRepo.findOne.mockResolvedValue({ id: '2', slug: 'tech' })

            await expect(updateCategory('1', { slug: 'tech' })).rejects.toThrow('Category slug already exists')
        })

        it('should throw error if updated name conflicts', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(existingCategory)
            mockCategoryRepo.findOne.mockResolvedValue({ id: '2', name: 'Tech' })
            mockCategoryRepo.save.mockResolvedValue({ ...existingCategory, name: 'Tech' })

            await expect(updateCategory('1', { name: 'Tech' })).rejects.toThrow('Category name already exists')
        })

        it('should allow updating without conflicts', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
                translationId: 'tech',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(existingCategory)
            mockCategoryRepo.findOne.mockResolvedValue(null)
            mockCategoryRepo.save.mockImplementation((cat) => Promise.resolve(cat))

            await updateCategory('1', { description: 'New description' })

            expect(mockCategoryRepo.save).toHaveBeenCalled()
        })

        it('should fall back to slug when translationId is cleared', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
                translationId: 'legacy-cluster',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(existingCategory)
            mockCategoryRepo.findOne.mockResolvedValue(null)
            mockCategoryRepo.save.mockImplementation((cat) => Promise.resolve(cat))

            await updateCategory('1', {
                slug: 'frontend',
                translationId: ' ',
            })

            expect(mockCategoryRepo.save).toHaveBeenCalledWith(expect.objectContaining({
                slug: 'frontend',
                translationId: 'frontend',
            }))
        })

        it('should throw error when updated translation group conflicts in same language', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
                translationId: 'old-cluster',
            }

            mockCategoryRepo.findOneBy.mockResolvedValue(existingCategory)
            // slug/name checks 条件不满足（slug/name 未变更且语言相同），仅 translation check 触发 findOne
            mockCategoryRepo.findOne.mockResolvedValueOnce({ id: '2', translationId: 'new-cluster' })

            await expect(updateCategory('1', {
                translationId: 'new-cluster',
                language: 'zh-CN',
            })).rejects.toThrow('A translation for this group already exists in this language')
        })

        it('should throw error when updated parent category does not exist', async () => {
            const existingCategory = {
                id: '1',
                name: 'Technology',
                slug: 'technology',
                language: 'zh-CN',
            }

            mockCategoryRepo.findOneBy
                .mockResolvedValueOnce(existingCategory) // category lookup
                .mockResolvedValueOnce(null) // parent lookup
            mockCategoryRepo.findOne.mockResolvedValue(null)

            await expect(updateCategory('1', { parentId: 'missing-parent' })).rejects.toThrow('Parent category not found')
        })
    })

    describe('ensureCategory', () => {
        it('should return existing category when name matches', async () => {
            const existing = { id: '1', name: 'Technology', slug: 'technology', language: 'zh-CN' }
            mockCategoryRepo.findOne.mockResolvedValue(existing)

            const result = await ensureCategory('Technology', 'zh-CN')

            expect(result).toBe(existing)
            expect(mockCategoryRepo.save).not.toHaveBeenCalled()
        })

        it('should create category with kebab-case slug when not found', async () => {
            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // name lookup
                .mockResolvedValueOnce(null) // slug lookup
            mockCategoryRepo.save.mockImplementation((cat) => Promise.resolve({ id: '2', ...cat }))

            const result = await ensureCategory('Web Development', 'en-US')

            expect(result).toMatchObject({
                name: 'Web Development',
                slug: 'web-development',
                language: 'en-US',
            })
        })

        it('should fall back to random slug when name has no slug-able characters', async () => {
            vi.mocked(generateRandomString).mockReturnValue('randomslug')

            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // name lookup
                .mockResolvedValueOnce(null) // slug lookup
            mockCategoryRepo.save.mockImplementation((cat) => Promise.resolve({ id: '3', ...cat }))

            const result = await ensureCategory('!!!', 'zh-CN')

            expect(result.slug).toBe('randomslug')
        })

        it('should append random suffix while slug conflicts persist', async () => {
            vi.mocked(generateRandomString).mockReturnValueOnce('suffix1').mockReturnValueOnce('suffix2')

            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // name lookup
                .mockResolvedValueOnce({ id: '9', slug: 'web' }) // first slug conflict
                .mockResolvedValueOnce({ id: '9', slug: 'web-suffix1' }) // second slug conflict
                .mockResolvedValueOnce(null) // third attempt free
            mockCategoryRepo.save.mockImplementation((cat) => Promise.resolve({ id: '4', ...cat }))

            const result = await ensureCategory('Web', 'en-US')

            expect(result.slug).toBe('web-suffix1-suffix2')
            expect(generateRandomString).toHaveBeenCalledWith(4)
        })

        it('should re-read the category when concurrent creation conflicts', async () => {
            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // name lookup
                .mockResolvedValueOnce(null) // slug lookup
            mockCategoryRepo.save.mockRejectedValueOnce(new Error('duplicate key value violates unique constraint'))
            mockCategoryRepo.findOne
                .mockResolvedValueOnce({ id: '5', name: 'Web', slug: 'web', language: 'en-US' }) // re-read after conflict

            const result = await ensureCategory('Web', 'en-US')

            expect(result).toMatchObject({ id: '5', name: 'Web' })
        })

        it('should retry with a suffixed slug when conflict re-read finds nothing', async () => {
            vi.mocked(generateRandomString).mockReturnValue('retry')

            const conflictError = Object.assign(new Error('conflict'), { statusCode: 409 })

            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // name lookup
                .mockResolvedValueOnce(null) // slug lookup
            mockCategoryRepo.save
                .mockRejectedValueOnce(conflictError) // createCategory conflict
            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // re-read after conflict (name gone)
            mockCategoryRepo.save
                .mockImplementationOnce((cat) => Promise.resolve({ id: '6', ...cat })) // retry create

            const result = await ensureCategory('Web', 'en-US')

            expect(result.slug).toBe('web-retry')
        })

        it('should rethrow non-conflict errors', async () => {
            mockCategoryRepo.findOne
                .mockResolvedValueOnce(null) // name lookup
                .mockResolvedValueOnce(null) // slug lookup
            mockCategoryRepo.save.mockRejectedValueOnce(new Error('connection lost'))

            await expect(ensureCategory('Web', 'en-US')).rejects.toThrow('connection lost')
        })
    })
})
