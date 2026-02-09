import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyAdmins, createCampaignFromPost, getTargetSubscribers, sendMarketingCampaign } from './notification'
import { dataSource } from '@/server/database'
import { AdminNotificationEvent, MarketingCampaignStatus, MarketingCampaignType } from '@/utils/shared/notification'
import { sendEmail } from '@/server/utils/email'
import logger from '@/server/utils/logger'

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/email', () => ({
    sendEmail: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
    },
}))

describe('notification service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('notifyAdmins', () => {
        it('应该发送邮件给所有管理员（默认配置）', async () => {
            const mockSettingsRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }
            const mockUserRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue([
                        { id: 'admin1', email: 'admin1@example.com', role: 'admin' },
                        { id: 'admin2', email: 'admin2@example.com', role: 'admin,editor' },
                    ]),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'AdminNotificationSettings') {
                    return mockSettingsRepo as any
                }
                if (entity.name === 'User') {
                    return mockUserRepo as any
                }
                return {} as any
            })

            await notifyAdmins(AdminNotificationEvent.NEW_COMMENT, {
                title: '新评论',
                content: '有新评论待审核',
            })

            expect(sendEmail).toHaveBeenCalledTimes(2)
            expect(sendEmail).toHaveBeenCalledWith({
                to: 'admin1@example.com',
                subject: '[站务通知] 新评论',
                html: '有新评论待审核',
            })
        })

        it('应该根据配置决定是否发送邮件', async () => {
            const mockSettingsRepo = {
                findOne: vi.fn().mockResolvedValue({
                    event: AdminNotificationEvent.NEW_COMMENT,
                    isEmailEnabled: false,
                    isBrowserEnabled: false,
                }),
            }
            const mockUserRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue([]),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'AdminNotificationSettings') {
                    return mockSettingsRepo as any
                }
                if (entity.name === 'User') {
                    return mockUserRepo as any
                }
                return {} as any
            })

            await notifyAdmins(AdminNotificationEvent.NEW_COMMENT, {
                title: '新评论',
                content: '有新评论待审核',
            })

            expect(sendEmail).not.toHaveBeenCalled()
        })

        it('应该过滤掉非管理员用户', async () => {
            const mockSettingsRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }
            const mockUserRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue([
                        { id: 'admin1', email: 'admin1@example.com', role: 'admin' },
                        { id: 'user1', email: 'user1@example.com', role: 'user' },
                    ]),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'AdminNotificationSettings') {
                    return mockSettingsRepo as any
                }
                if (entity.name === 'User') {
                    return mockUserRepo as any
                }
                return {} as any
            })

            await notifyAdmins(AdminNotificationEvent.NEW_COMMENT, {
                title: '新评论',
                content: '有新评论待审核',
            })

            expect(sendEmail).toHaveBeenCalledTimes(1)
            expect(sendEmail).toHaveBeenCalledWith({
                to: 'admin1@example.com',
                subject: '[站务通知] 新评论',
                html: '有新评论待审核',
            })
        })

        it('应该处理邮件发送失败的情况', async () => {
            const mockSettingsRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }
            const mockUserRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue([
                        { id: 'admin1', email: 'admin1@example.com', role: 'admin' },
                    ]),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'AdminNotificationSettings') {
                    return mockSettingsRepo as any
                }
                if (entity.name === 'User') {
                    return mockUserRepo as any
                }
                return {} as any
            })

            vi.mocked(sendEmail).mockRejectedValue(new Error('SMTP error'))

            await notifyAdmins(AdminNotificationEvent.NEW_COMMENT, {
                title: '新评论',
                content: '有新评论待审核',
            })

            expect(logger.error).toHaveBeenCalled()
        })
    })

    describe('createCampaignFromPost', () => {
        it('应该从文章创建营销推送', async () => {
            const mockPost = {
                id: 'post1',
                title: '测试文章',
                summary: '这是摘要',
                content: '这是内容',
                categoryId: 'cat1',
                tags: [{ id: 'tag1' }, { id: 'tag2' }],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(mockPost),
            }

            const mockCampaignRepo = {
                save: vi.fn().mockImplementation((campaign) => Promise.resolve(campaign)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'MarketingCampaign') {
                    return mockCampaignRepo as any
                }
                return {} as any
            })

            const campaign = await createCampaignFromPost('post1', 'sender1', MarketingCampaignStatus.DRAFT)

            expect(campaign.title).toBe('测试文章')
            expect(campaign.content).toBe('这是摘要')
            expect(campaign.type).toBe(MarketingCampaignType.BLOG_POST)
            expect(campaign.senderId).toBe('sender1')
            expect(campaign.status).toBe(MarketingCampaignStatus.DRAFT)
            expect(campaign.targetCriteria).toEqual({
                categoryIds: ['cat1'],
                tagIds: ['tag1', 'tag2'],
            })
        })

        it('应该在文章没有摘要时使用内容前200字符', async () => {
            const longContent = 'a'.repeat(300)
            const mockPost = {
                id: 'post1',
                title: '测试文章',
                summary: null,
                content: longContent,
                categoryId: null,
                tags: [],
            }

            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(mockPost),
            }

            const mockCampaignRepo = {
                save: vi.fn().mockImplementation((campaign) => Promise.resolve(campaign)),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                if (entity.name === 'MarketingCampaign') {
                    return mockCampaignRepo as any
                }
                return {} as any
            })

            const campaign = await createCampaignFromPost('post1', 'sender1')

            expect(campaign.content).toBe(longContent.substring(0, 200))
        })

        it('应该在文章不存在时抛出错误', async () => {
            const mockPostRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'Post') {
                    return mockPostRepo as any
                }
                return {} as any
            })

            await expect(createCampaignFromPost('nonexistent', 'sender1')).rejects.toThrow('Post not found')
        })
    })

    describe('getTargetSubscribers', () => {
        it('应该获取所有活跃且启用营销的订阅者', async () => {
            const mockSubscribers = [
                {
                    id: 'sub1',
                    email: 'sub1@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: ['cat1'],
                    subscribedTagIds: ['tag1'],
                },
                {
                    id: 'sub2',
                    email: 'sub2@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: ['cat2'],
                    subscribedTagIds: ['tag2'],
                },
            ]

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue(mockSubscribers),
                }),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)

            const result = await getTargetSubscribers({})

            expect(result).toHaveLength(2)
        })

        it('应该根据分类ID过滤订阅者', async () => {
            const mockSubscribers = [
                {
                    id: 'sub1',
                    email: 'sub1@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: ['cat1', 'cat2'],
                    subscribedTagIds: [],
                },
                {
                    id: 'sub2',
                    email: 'sub2@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: ['cat3'],
                    subscribedTagIds: [],
                },
            ]

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue(mockSubscribers),
                }),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)

            const result = await getTargetSubscribers({ categoryIds: ['cat1'] })

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('sub1')
        })

        it('应该根据标签ID过滤订阅者', async () => {
            const mockSubscribers = [
                {
                    id: 'sub1',
                    email: 'sub1@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: [],
                    subscribedTagIds: ['tag1', 'tag2'],
                },
                {
                    id: 'sub2',
                    email: 'sub2@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: [],
                    subscribedTagIds: ['tag3'],
                },
            ]

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue(mockSubscribers),
                }),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)

            const result = await getTargetSubscribers({ tagIds: ['tag1'] })

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('sub1')
        })

        it('应该同时根据分类和标签过滤', async () => {
            const mockSubscribers = [
                {
                    id: 'sub1',
                    email: 'sub1@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: ['cat1'],
                    subscribedTagIds: ['tag1'],
                },
                {
                    id: 'sub2',
                    email: 'sub2@example.com',
                    isActive: true,
                    isMarketingEnabled: true,
                    subscribedCategoryIds: ['cat1'],
                    subscribedTagIds: ['tag2'],
                },
            ]

            const mockRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue(mockSubscribers),
                }),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)

            const result = await getTargetSubscribers({ categoryIds: ['cat1'], tagIds: ['tag1'] })

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('sub1')
        })
    })

    describe('sendMarketingCampaign', () => {
        it('应该成功发送营销推送', async () => {
            const mockCampaign = {
                id: 'campaign1',
                title: '测试推送',
                content: '推送内容',
                status: MarketingCampaignStatus.DRAFT,
                targetCriteria: {},
            }

            const mockSubscribers = [
                { id: 'sub1', email: 'sub1@example.com', isActive: true, isMarketingEnabled: true },
                { id: 'sub2', email: 'sub2@example.com', isActive: true, isMarketingEnabled: true },
            ]

            const mockCampaignRepo = {
                findOne: vi.fn().mockResolvedValue(mockCampaign),
                save: vi.fn().mockImplementation((campaign) => Promise.resolve(campaign)),
            }

            const mockSubscriberRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue(mockSubscribers),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'MarketingCampaign') {
                    return mockCampaignRepo as any
                }
                if (entity.name === 'Subscriber') {
                    return mockSubscriberRepo as any
                }
                return {} as any
            })

            vi.mocked(sendEmail).mockResolvedValue(undefined)

            await sendMarketingCampaign('campaign1')

            expect(mockCampaignRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: MarketingCampaignStatus.COMPLETED,
                }),
            )
            expect(sendEmail).toHaveBeenCalledTimes(2)
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Success: 2, Fail: 0'),
            )
        })

        it('应该处理部分发送失败的情况', async () => {
            const mockCampaign = {
                id: 'campaign1',
                title: '测试推送',
                content: '推送内容',
                status: MarketingCampaignStatus.DRAFT,
                targetCriteria: {},
            }

            const mockSubscribers = [
                { id: 'sub1', email: 'sub1@example.com' },
                { id: 'sub2', email: 'sub2@example.com' },
            ]

            const mockCampaignRepo = {
                findOne: vi.fn().mockResolvedValue(mockCampaign),
                save: vi.fn().mockImplementation((campaign) => Promise.resolve(campaign)),
            }

            const mockSubscriberRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockResolvedValue(mockSubscribers),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'MarketingCampaign') {
                    return mockCampaignRepo as any
                }
                if (entity.name === 'Subscriber') {
                    return mockSubscriberRepo as any
                }
                return {} as any
            })

            vi.mocked(sendEmail)
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('SMTP error'))

            await sendMarketingCampaign('campaign1')

            expect(mockCampaignRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: MarketingCampaignStatus.COMPLETED,
                }),
            )
            expect(logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Success: 1, Fail: 1'),
            )
        })

        it('应该在推送不存在时直接返回', async () => {
            const mockCampaignRepo = {
                findOne: vi.fn().mockResolvedValue(null),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockCampaignRepo as any)

            await sendMarketingCampaign('nonexistent')

            expect(sendEmail).not.toHaveBeenCalled()
        })

        it('应该在推送已完成时直接返回', async () => {
            const mockCampaign = {
                id: 'campaign1',
                status: MarketingCampaignStatus.COMPLETED,
            }

            const mockCampaignRepo = {
                findOne: vi.fn().mockResolvedValue(mockCampaign),
            }

            vi.mocked(dataSource.getRepository).mockReturnValue(mockCampaignRepo as any)

            await sendMarketingCampaign('campaign1')

            expect(sendEmail).not.toHaveBeenCalled()
        })

        it('应该在发生错误时将状态设置为失败', async () => {
            const mockCampaign = {
                id: 'campaign1',
                title: '测试推送',
                status: MarketingCampaignStatus.DRAFT,
                targetCriteria: {},
            }

            const mockCampaignRepo = {
                findOne: vi.fn().mockResolvedValue(mockCampaign),
                save: vi.fn().mockImplementation((campaign) => Promise.resolve(campaign)),
            }

            const mockSubscriberRepo = {
                createQueryBuilder: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnThis(),
                    andWhere: vi.fn().mockReturnThis(),
                    getMany: vi.fn().mockRejectedValue(new Error('Database error')),
                }),
            }

            vi.mocked(dataSource.getRepository).mockImplementation((entity: any) => {
                if (entity.name === 'MarketingCampaign') {
                    return mockCampaignRepo as any
                }
                if (entity.name === 'Subscriber') {
                    return mockSubscriberRepo as any
                }
                return {} as any
            })

            await sendMarketingCampaign('campaign1')

            expect(mockCampaignRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: MarketingCampaignStatus.FAILED,
                }),
            )
            expect(logger.error).toHaveBeenCalled()
        })
    })
})
