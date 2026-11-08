import { beforeEach, describe, expect, it, vi } from 'vitest'
import { typeormAdapter } from './typeorm-adapter'

const { generateIdMock, getAuthTablesMock } = vi.hoisted(() => ({
    generateIdMock: vi.fn(() => 'generated-id'),
    getAuthTablesMock: vi.fn(),
}))

vi.mock('better-auth', async () => {
    const actual = await vi.importActual<typeof import('better-auth')>('better-auth')
    return {
        ...actual,
        generateId: generateIdMock,
    }
})

vi.mock('better-auth/db', () => ({
    getAuthTables: getAuthTablesMock,
}))

interface MockRelation {
    propertyName: string
    inverseEntityMetadata?: {
        name: string
        tableName: string
    }
    target?: string | (() => unknown)
}

interface MockQueryBuilder {
    update: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
    where: ReturnType<typeof vi.fn>
    execute: ReturnType<typeof vi.fn>
}

interface MockRepository {
    metadata: {
        relations: MockRelation[]
    }
    save: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    find: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    createQueryBuilder: ReturnType<typeof vi.fn>
    queryBuilder: MockQueryBuilder
}

interface MockManager {
    getRepository: ReturnType<typeof vi.fn>
}

interface MockDataSource {
    entityMetadatas: {
        name: string
        tableName: string
        target?: unknown
    }[]
    options: {
        entityPrefix?: string
    }
    namingStrategy: {
        tableName: (targetName: string, userSpecifiedName?: string) => string
    }
    manager: MockManager
    getRepository: ReturnType<typeof vi.fn>
    transaction: ReturnType<typeof vi.fn>
}

const authSchema = {
    user: {
        modelName: 'User',
        fields: {
            id: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'number', fieldName: 'user_age' },
            nickname: { type: 'string' },
        },
    },
    profile: {
        modelName: 'Profile',
        fields: {
            id: { type: 'string' },
            bio: { type: 'string', fieldName: 'biography' },
            userId: { type: 'string', fieldName: 'user_id' },
        },
    },
}

function createRepository(relations: MockRelation[] = []): MockRepository {
    const queryBuilder: MockQueryBuilder = {
        update: vi.fn(),
        set: vi.fn(),
        where: vi.fn(),
        execute: vi.fn(),
    }
    queryBuilder.update.mockReturnValue(queryBuilder)
    queryBuilder.set.mockReturnValue(queryBuilder)
    queryBuilder.where.mockReturnValue(queryBuilder)

    return {
        metadata: {
            relations,
        },
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        findOne: vi.fn(),
        find: vi.fn(),
        count: vi.fn(),
        createQueryBuilder: vi.fn(() => queryBuilder),
        queryBuilder,
    }
}

function createDataSource(options: {
    relations?: MockRelation[]
    entityMetadatas?: {
        name: string
        tableName: string
        target?: unknown
    }[]
    entityPrefix?: string
    repositoryName?: string
} = {}) {
    const userRepository = createRepository(options.relations ?? [
        {
            propertyName: 'profile',
            inverseEntityMetadata: {
                name: 'Profile',
                tableName: 'profile',
            },
            target: 'Profile',
        },
    ])
    const profileRepository = createRepository()
    const repositoryName = options.repositoryName ?? 'User'

    const manager: MockManager = {
        getRepository: vi.fn((name: string) => {
            if (name === repositoryName) {
                return userRepository
            }
            if (name === 'Profile') {
                return profileRepository
            }
            return undefined
        }),
    }

    const dataSource: MockDataSource = {
        entityMetadatas: options.entityMetadatas ?? [
            { name: repositoryName, tableName: repositoryName.toLowerCase() },
            { name: 'Profile', tableName: 'profile' },
        ],
        options: {
            entityPrefix: options.entityPrefix,
        },
        namingStrategy: {
            tableName: (_targetName: string, userSpecifiedName?: string) => userSpecifiedName ?? '',
        },
        manager,
        getRepository: vi.fn((name: string) => manager.getRepository(name)),
        transaction: vi.fn(async (callback: (manager: MockManager) => Promise<unknown>) => callback(manager)),
    }

    return {
        dataSource,
        userRepository,
        profileRepository,
        manager,
    }
}

function createAdapter(dataSource: MockDataSource) {
    return typeormAdapter(dataSource as never)({}) as any
}

describe('typeormAdapter 边界与扩展操作', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getAuthTablesMock.mockReturnValue(authSchema)
        generateIdMock.mockReturnValue('generated-id')
    })

    it('findMany 未提供条件时使用默认分页且不附加排序与关联', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.find.mockResolvedValue([
            { id: 'user-1', email: 'alice@example.com', user_age: 20, nickname: 'alice' },
        ])

        const adapter = createAdapter(dataSource)
        const result = await adapter.findMany({ model: 'user' })

        expect(userRepository.find).toHaveBeenCalledWith({
            where: {},
            take: 100,
            skip: 0,
            order: undefined,
            relations: undefined,
        })
        expect(result).toEqual([
            {
                id: 'user-1',
                email: 'alice@example.com',
                age: 20,
                nickname: 'alice',
            },
        ])
    })

    it('findOne 支持 select、数组关联与显式关闭的关联', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne.mockResolvedValue({
            id: 'user-1',
            email: 'alice@example.com',
            user_age: 20,
            nickname: 'alice',
            profile: [
                { id: 'profile-1', biography: 'bio-1', user_id: 'user-1' },
            ],
        })

        const adapter = createAdapter(dataSource)
        const result = await adapter.findOne({
            model: 'user',
            where: [{ field: 'email', value: 'alice@example.com' }],
            select: ['id', 'email'],
            join: {
                profile: true,
                ignored: false,
            },
        })

        expect(userRepository.findOne).toHaveBeenCalledWith({
            where: { email: 'alice@example.com' },
            select: { id: true, email: true },
            relations: { profile: true },
        })
        expect(result).toEqual({
            id: 'user-1',
            email: 'alice@example.com',
            profile: [
                { id: 'profile-1', bio: 'bio-1', userId: 'user-1' },
            ],
        })
    })

    it('findOne 在关联数据缺失或为空时保持输出稳定', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne
            .mockResolvedValueOnce({
                id: 'user-1',
                email: 'alice@example.com',
                user_age: 20,
                nickname: 'alice',
            })
            .mockResolvedValueOnce({
                id: 'user-2',
                email: 'bob@example.com',
                user_age: 21,
                nickname: 'bob',
                profile: null,
            })

        const adapter = createAdapter(dataSource)

        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            join: { profile: true },
        })).resolves.toMatchObject({ id: 'user-1' })

        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-2' }],
            join: { profile: true },
        })).resolves.toMatchObject({ id: 'user-2' })
    })

    it('findOne 在函数形式的关联目标上回退到属性名解析关系', async () => {
        function ProfileTarget() {
            return undefined
        }

        const { dataSource, userRepository } = createDataSource({
            relations: [
                {
                    propertyName: 'profile',
                    target: ProfileTarget,
                },
            ],
            entityMetadatas: [
                { name: 'User', tableName: 'user' },
                { name: 'ProfileTarget', tableName: 'profiles', target: ProfileTarget },
            ],
        })
        userRepository.findOne.mockResolvedValue({ id: 'user-1' })

        const adapter = createAdapter(dataSource)

        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            join: { profile: true },
        })).resolves.toEqual({ id: 'user-1' })

        expect(userRepository.findOne).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            select: undefined,
            relations: { profile: true },
        })
    })

    it('update 在单条 where 未命中时执行批量更新并返回 null', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne.mockResolvedValue(null)
        userRepository.update.mockResolvedValue({ affected: 0 })

        const adapter = createAdapter(dataSource)
        const result = await adapter.update({
            model: 'user',
            where: [{ field: 'id', value: 'missing' }],
            update: { nickname: 'neo' },
            select: ['id', 'nickname'],
        })

        expect(result).toBeNull()
        expect(userRepository.update).toHaveBeenCalledWith({ id: 'missing' }, { nickname: 'neo' })
    })

    it('支持未知操作符透传与空 where 计数', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.find.mockResolvedValue([])
        userRepository.count.mockResolvedValue(0)

        const adapter = createAdapter(dataSource)
        await adapter.findMany({
            model: 'user',
            where: [{ field: 'email', operator: 'legacy_operator' as never, value: 'a@example.com' }],
        })
        await expect(adapter.count({ model: 'user', where: [] })).resolves.toBe(0)

        expect(userRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { email: 'a@example.com' },
        }))
        expect(userRepository.count).toHaveBeenCalledWith({ where: {} })
    })

    it('consumeOne 覆盖未命中、缺少 id、删除失败与成功分支', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ email: 'no-id@example.com' })
            .mockResolvedValueOnce({ id: 'user-3', email: 'affected-0@example.com', user_age: 20, nickname: 'zero' })
            .mockResolvedValueOnce({ id: 'user-4', email: 'affected-1@example.com', user_age: 20, nickname: 'one' })
        userRepository.delete
            .mockResolvedValueOnce({ affected: 0 })
            .mockResolvedValueOnce({ affected: 1 })

        const adapter = createAdapter(dataSource)

        await expect(adapter.consumeOne({
            model: 'user',
            where: [{ field: 'email', value: 'missing@example.com' }],
        })).resolves.toBeNull()

        await expect(adapter.consumeOne({
            model: 'user',
            where: [{ field: 'email', value: 'no-id@example.com' }],
        })).resolves.toBeNull()

        await expect(adapter.consumeOne({
            model: 'user',
            where: [{ field: 'email', value: 'affected-0@example.com' }],
        })).resolves.toBeNull()

        await expect(adapter.consumeOne({
            model: 'user',
            where: [{ field: 'email', value: 'affected-1@example.com' }],
        })).resolves.toEqual({
            id: 'user-4',
            email: 'affected-1@example.com',
            age: 20,
            nickname: 'one',
        })

        expect(userRepository.delete).toHaveBeenLastCalledWith({
            email: 'affected-1@example.com',
            id: 'user-4',
        })
    })

    it('incrementOne 原子递增并回读更新后的记录', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne
            .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com', user_age: 20, nickname: 'alice' })
            .mockResolvedValueOnce({ id: 'user-1', email: 'alice@example.com', user_age: 21, nickname: 'neo' })
        userRepository.queryBuilder.execute.mockResolvedValue({ affected: 1 })

        const adapter = createAdapter(dataSource)
        const result = await adapter.incrementOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            increment: { age: 1 },
            set: { nickname: 'neo' },
        })

        expect(userRepository.queryBuilder.set).toHaveBeenCalledWith({
            age: expect.any(Function),
            nickname: 'neo',
        })
        const setArgument = userRepository.queryBuilder.set.mock.calls[0]?.[0] as Record<string, () => string>
        expect(setArgument.age?.()).toBe('"age" + 1')
        expect(userRepository.queryBuilder.where).toHaveBeenCalledWith({ id: 'user-1' })
        expect(result).toMatchObject({ id: 'user-1', age: 21, nickname: 'neo' })
    })

    it('incrementOne 在目标缺失或更新未生效时返回 null', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 'user-2', email: 'bob@example.com', user_age: 30, nickname: 'bob' })
        userRepository.queryBuilder.execute.mockResolvedValue({ affected: 0 })

        const adapter = createAdapter(dataSource)

        await expect(adapter.incrementOne({
            model: 'user',
            where: [{ field: 'id', value: 'missing' }],
            increment: { age: 1 },
        })).resolves.toBeNull()

        await expect(adapter.incrementOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-2' }],
            increment: { age: 1 },
        })).resolves.toBeNull()

        expect(userRepository.queryBuilder.set).toHaveBeenCalledWith({
            age: expect.any(Function),
        })
    })

    it('所有写操作都会将仓储异常包装为 BetterAuthError', async () => {
        const { dataSource, userRepository } = createDataSource()
        const adapter = createAdapter(dataSource)

        userRepository.update.mockRejectedValue(new Error('update failed'))
        await expect(adapter.update({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            update: { nickname: 'neo' },
        })).rejects.toThrow('Failed to update user: update failed')

        userRepository.delete.mockRejectedValue(new Error('delete failed'))
        await expect(adapter.delete({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })).rejects.toThrow('Failed to delete user: delete failed')

        await expect(adapter.updateMany({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            update: { nickname: 'neo' },
        })).rejects.toThrow('Failed to update many user: update failed')

        await expect(adapter.deleteMany({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })).rejects.toThrow('Failed to delete many user: delete failed')

        userRepository.count.mockRejectedValue(new Error('count failed'))
        await expect(adapter.count({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })).rejects.toThrow('Failed to count user: count failed')

        userRepository.find.mockRejectedValue(new Error('find many failed'))
        await expect(adapter.findMany({ model: 'user' })).rejects.toThrow('Failed to find many user: find many failed')

        userRepository.findOne.mockRejectedValue(new Error('find failed'))
        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })).rejects.toThrow('Failed to find user: find failed')

        await expect(adapter.consumeOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })).rejects.toThrow('Failed to consume user: find failed')

        await expect(adapter.incrementOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            increment: { age: 1 },
        })).rejects.toThrow('Failed to increment user: find failed')
    })

    it('实体名称未命中时回退到 schema 模型名并支持实体前缀查找', async () => {
        const { dataSource, userRepository, manager } = createDataSource({
            entityMetadatas: [
                { name: 'LegacyUserEntity', tableName: 'app_user' },
                { name: 'Profile', tableName: 'profile' },
            ],
            entityPrefix: 'app_',
            repositoryName: 'LegacyUserEntity',
        })
        userRepository.delete.mockResolvedValue({ affected: 1 })

        const adapter = createAdapter(dataSource)
        await adapter.delete({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })

        expect(manager.getRepository).toHaveBeenCalledWith('LegacyUserEntity')

        const { dataSource: emptyDataSource, userRepository: emptyRepository } = createDataSource({
            entityMetadatas: [],
        })
        emptyRepository.count.mockResolvedValue(3)

        const fallbackAdapter = createAdapter(emptyDataSource)
        await expect(fallbackAdapter.count({ model: 'user', where: [] })).resolves.toBe(3)
        expect(emptyDataSource.manager.getRepository).toHaveBeenCalledWith('User')
    })

    it('支持显式 eq 操作符和关系表名匹配', async () => {
        const { dataSource, userRepository } = createDataSource({
            relations: [
                {
                    propertyName: 'profile',
                    inverseEntityMetadata: {
                        name: 'ProfileEntity',
                        tableName: 'profile',
                    },
                },
            ],
        })
        userRepository.findOne.mockResolvedValue({
            id: 'user-1',
            email: 'alice@example.com',
            user_age: 20,
            nickname: 'alice',
            profile: { id: 'profile-1', biography: 'bio-1', user_id: 'user-1' },
        })

        const adapter = createAdapter(dataSource)
        const result = await adapter.findOne({
            model: 'user',
            where: [{ field: 'email', operator: 'eq', value: 'alice@example.com' }],
            join: { profile: true },
        })

        expect(userRepository.findOne).toHaveBeenCalledWith({
            where: { email: 'alice@example.com' },
            select: undefined,
            relations: { profile: true },
        })
        expect(result).toMatchObject({
            id: 'user-1',
            profile: {
                id: 'profile-1',
                bio: 'bio-1',
                userId: 'user-1',
            },
        })
    })

    it('支持字符串目标、实体元数据表名匹配与无匹配关联', async () => {
        const { dataSource, userRepository } = createDataSource({
            relations: [
                {
                    propertyName: 'profile',
                    target: 'ProfileEntity',
                },
            ],
            entityMetadatas: [
                { name: 'User', tableName: 'user' },
                { name: 'ProfileEntity', tableName: 'profile' },
            ],
        })
        userRepository.findOne.mockResolvedValue({
            id: 'user-1',
            email: 'alice@example.com',
            user_age: 20,
            nickname: 'alice',
            profile: { id: 'profile-1', biography: 'bio-1', user_id: 'user-1' },
        })

        const adapter = createAdapter(dataSource)
        await adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            join: { profile: true },
        })

        expect(userRepository.findOne).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            select: undefined,
            relations: { profile: true },
        })

        const { dataSource: noRelationDataSource, userRepository: noRelationRepository } = createDataSource({
            relations: [],
        })
        noRelationRepository.findOne.mockResolvedValue({ id: 'user-2' })

        const noRelationAdapter = createAdapter(noRelationDataSource)
        await noRelationAdapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-2' }],
            join: { profile: true },
        })

        expect(noRelationRepository.findOne).toHaveBeenLastCalledWith({
            where: { id: 'user-2' },
            select: undefined,
            relations: {},
        })
    })

    it('findOne 在无记录与缺少 id 时返回稳定的 null 或空对象', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ email: 'no-id@example.com', user_age: 20, nickname: 'no-id' })

        const adapter = createAdapter(dataSource)

        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'missing' }],
        })).resolves.toBeNull()

        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'email', value: 'no-id@example.com' }],
        })).resolves.toEqual({
            id: undefined,
            email: 'no-id@example.com',
            age: 20,
            nickname: 'no-id',
        })
    })

    it('select 不包含 id 时不输出主键', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne.mockResolvedValue({
            id: 'user-1',
            email: 'alice@example.com',
            user_age: 20,
            nickname: 'alice',
        })

        const adapter = createAdapter(dataSource)
        const result = await adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            select: ['email'],
        })

        expect(result).toEqual({ email: 'alice@example.com' })
    })

    it('findMany 支持对象形式的关联数据', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.find.mockResolvedValue([
            {
                id: 'user-1',
                email: 'alice@example.com',
                user_age: 20,
                nickname: 'alice',
                profile: { id: 'profile-1', biography: 'bio-1', user_id: 'user-1' },
            },
        ])

        const adapter = createAdapter(dataSource)
        const result = await adapter.findMany({
            model: 'user',
            join: { profile: true },
        })

        expect(result).toEqual([
            {
                id: 'user-1',
                email: 'alice@example.com',
                age: 20,
                nickname: 'alice',
                profile: {
                    id: 'profile-1',
                    bio: 'bio-1',
                    userId: 'user-1',
                },
            },
        ])
    })

    it('模型不存在时由 getModelName 抛出明确错误', async () => {
        const { dataSource } = createDataSource()
        const adapter = createAdapter(dataSource)

        await expect(adapter.delete({
            model: 'missing-model',
            where: [],
        })).rejects.toThrow('Model missing-model not found in schema')
    })
})
