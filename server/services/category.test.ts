import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCategory, updateCategory } from './category'
import { dataSource } from '@/server/database'

vi.mock('@/server/database')

describe('category service', () => {
    const mockCategoryRepo = {
        findOneBy: vi.fn(),
        findOne: vi.fn(),
        save: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
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
    })
})
