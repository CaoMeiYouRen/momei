import { describe, it, expect, beforeEach, vi } from 'vitest'
import { submissionService } from './submission'
import { dataSource } from '@/server/database'
import { SubmissionStatus } from '@/types/submission'
import { PostStatus, PostVisibility } from '@/types/post'

vi.mock('@/server/database')
vi.mock('./post', () => ({
    createPostService: vi.fn(),
}))

describe('submissionService', () => {
    const mockSubmissionRepo = {
        createQueryBuilder: vi.fn(),
        findOne: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(mockSubmissionRepo as any)
    })

    describe('getSubmissions', () => {
        it('should return paginated submissions', async () => {
            const mockSubmissions = [
                { id: '1', title: 'Test 1', status: SubmissionStatus.PENDING },
                { id: '2', title: 'Test 2', status: SubmissionStatus.PENDING },
            ]

            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                take: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getManyAndCount: vi.fn().mockResolvedValue([mockSubmissions, 2]),
            }

            mockSubmissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            const result = await submissionService.getSubmissions({ page: 1, limit: 10 })

            expect(result).toEqual({
                items: mockSubmissions,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            })
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0)
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10)
        })

        it('should filter by status when provided', async () => {
            const mockQueryBuilder = {
                leftJoinAndSelect: vi.fn().mockReturnThis(),
                orderBy: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                take: vi.fn().mockReturnThis(),
                andWhere: vi.fn().mockReturnThis(),
                getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
            }

            mockSubmissionRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)

            await submissionService.getSubmissions({ status: SubmissionStatus.ACCEPTED })

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'submission.status = :status',
                { status: SubmissionStatus.ACCEPTED },
            )
        })
    })

    describe('getSubmissionById', () => {
        it('should return submission by id', async () => {
            const mockSubmission = { id: '1', title: 'Test' }
            mockSubmissionRepo.findOne.mockResolvedValue(mockSubmission)

            const result = await submissionService.getSubmissionById('1')

            expect(result).toEqual(mockSubmission)
            expect(mockSubmissionRepo.findOne).toHaveBeenCalledWith({
                where: { id: '1' },
                relations: ['author'],
            })
        })
    })

    describe('createSubmission', () => {
        it('should create a new submission', async () => {
            const submissionData = {
                title: 'Test Submission',
                content: 'Test content',
                contributorName: 'John Doe',
                contributorEmail: 'john@example.com',
            }

            const savedSubmission = { id: '1', ...submissionData, status: SubmissionStatus.PENDING }
            mockSubmissionRepo.save.mockResolvedValue(savedSubmission)

            const result = await submissionService.createSubmission(submissionData)

            expect(result).toEqual(savedSubmission)
            expect(mockSubmissionRepo.save).toHaveBeenCalled()
        })

        it('should handle optional fields', async () => {
            const submissionData = {
                title: 'Test',
                content: 'Content',
                contributorName: 'John',
                contributorEmail: 'john@example.com',
                contributorUrl: 'https://example.com',
                authorId: 'author-1',
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
            }

            mockSubmissionRepo.save.mockResolvedValue({ id: '1', ...submissionData })

            await submissionService.createSubmission(submissionData)

            expect(mockSubmissionRepo.save).toHaveBeenCalled()
        })
    })

    describe('reviewSubmission', () => {
        it('should update submission status', async () => {
            const mockSubmission = {
                id: '1',
                title: 'Test',
                content: 'Content',
                status: SubmissionStatus.PENDING,
            }

            mockSubmissionRepo.findOne.mockResolvedValue(mockSubmission)
            mockSubmissionRepo.save.mockResolvedValue({
                ...mockSubmission,
                status: SubmissionStatus.REJECTED,
            })

            const result = await submissionService.reviewSubmission(
                '1',
                { status: SubmissionStatus.REJECTED, adminNote: 'Not suitable' },
                'reviewer-1',
            )

            expect(result.status).toBe(SubmissionStatus.REJECTED)
            expect(mockSubmissionRepo.save).toHaveBeenCalled()
        })

        it('should throw error if submission not found', async () => {
            mockSubmissionRepo.findOne.mockResolvedValue(null)

            await expect(
                submissionService.reviewSubmission('999', { status: SubmissionStatus.REJECTED }, 'reviewer-1'),
            ).rejects.toThrow()
        })

        it('should create post when accepting submission', async () => {
            const { createPostService } = await import('./post')
            const mockSubmission = {
                id: '1',
                title: 'Test',
                content: 'Content',
                status: SubmissionStatus.PENDING,
                authorId: 'author-1',
            }

            mockSubmissionRepo.findOne.mockResolvedValue(mockSubmission)
            mockSubmissionRepo.save.mockResolvedValue({
                ...mockSubmission,
                status: SubmissionStatus.ACCEPTED,
            })

            await submissionService.reviewSubmission(
                '1',
                {
                    status: SubmissionStatus.ACCEPTED,
                    acceptOptions: {
                        categoryId: 'cat-1',
                        tags: ['tag1'],
                        language: 'zh-CN',
                        publishImmediately: true,
                    },
                },
                'reviewer-1',
            )

            expect(createPostService).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test',
                    content: 'Content',
                    status: PostStatus.PUBLISHED,
                    visibility: PostVisibility.PUBLIC,
                }),
                'author-1',
                { isAdmin: true },
            )
        })
    })

    describe('deleteSubmission', () => {
        it('should delete submission', async () => {
            const mockSubmission = { id: '1', title: 'Test' }
            mockSubmissionRepo.findOne.mockResolvedValue(mockSubmission)
            mockSubmissionRepo.remove.mockResolvedValue(mockSubmission)

            await submissionService.deleteSubmission(1)

            expect(mockSubmissionRepo.remove).toHaveBeenCalledWith(mockSubmission)
        })

        it('should throw error if submission not found', async () => {
            mockSubmissionRepo.findOne.mockResolvedValue(null)

            await expect(submissionService.deleteSubmission(999)).rejects.toThrow()
        })
    })
})
