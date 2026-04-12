import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BetterAuthError } from 'better-auth'
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
            age: { type: 'number', fieldName: 'user_age', defaultValue: 18 },
            nickname: { type: 'string', defaultValue: () => 'guest' },
            profileId: { type: 'string', fieldName: 'profile_id' },
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
    }
}

function createDataSource(options?: {
    userRepository?: MockRepository
    profileRepository?: MockRepository
    entityPrefix?: string
    relationPropertyName?: string
}): {
    dataSource: MockDataSource
    userRepository: MockRepository
    profileRepository: MockRepository
    txManager: MockManager
    txUserRepository: MockRepository
} {
    const relationPropertyName = options?.relationPropertyName ?? 'userProfile'
    const profileRepository = options?.profileRepository ?? createRepository()
    const userRepository = options?.userRepository ?? createRepository([
        {
            propertyName: relationPropertyName,
            inverseEntityMetadata: {
                name: 'Profile',
                tableName: 'profile',
            },
            target: 'Profile',
        },
    ])
    const txUserRepository = createRepository(userRepository.metadata.relations)

    const repositoryMap = new Map<string, MockRepository>([
        ['User', userRepository],
        ['Profile', profileRepository],
    ])
    const txRepositoryMap = new Map<string, MockRepository>([
        ['User', txUserRepository],
        ['Profile', profileRepository],
    ])

    const manager: MockManager = {
        getRepository: vi.fn((name: string) => repositoryMap.get(name)),
    }
    const txManager: MockManager = {
        getRepository: vi.fn((name: string) => txRepositoryMap.get(name)),
    }

    const dataSource: MockDataSource = {
        entityMetadatas: [
            { name: 'User', tableName: `${options?.entityPrefix ?? ''}user` },
            { name: 'Profile', tableName: `${options?.entityPrefix ?? ''}profile` },
        ],
        options: {
            entityPrefix: options?.entityPrefix,
        },
        namingStrategy: {
            tableName: (_targetName: string, userSpecifiedName?: string) => userSpecifiedName ?? '',
        },
        manager,
        getRepository: vi.fn((name: string) => repositoryMap.get(name)),
        transaction: vi.fn(async (callback: (manager: MockManager) => Promise<unknown>) => callback(txManager)),
    }

    return {
        dataSource,
        userRepository,
        profileRepository,
        txManager,
        txUserRepository,
    }
}

describe('typeormAdapter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getAuthTablesMock.mockReturnValue(authSchema)
        generateIdMock.mockReturnValue('generated-id')
    })

    it('creates records with generated ids, field mapping and defaults', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.save.mockResolvedValue({
            id: 'generated-id',
            email: 'alice@example.com',
            user_age: 18,
            nickname: 'guest',
            profile_id: 'profile-1',
        })

        const adapter = typeormAdapter(dataSource as never)({})
        const result = await adapter.create({
            model: 'user',
            data: {
                email: 'alice@example.com',
                profileId: 'profile-1',
            },
        })

        expect(userRepository.save).toHaveBeenCalledWith({
            id: 'generated-id',
            email: 'alice@example.com',
            user_age: 18,
            nickname: 'guest',
            profile_id: 'profile-1',
        })
        expect(result).toEqual({
            id: 'generated-id',
            email: 'alice@example.com',
            age: 18,
            nickname: 'guest',
            profileId: 'profile-1',
        })
    })

    it('supports forceAllowId, custom id generation and database-generated ids', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.save
            .mockResolvedValueOnce({ id: 'manual-id', email: 'manual@example.com', user_age: 18, nickname: 'guest' })
            .mockResolvedValueOnce({ id: 'custom-id', email: 'custom@example.com', user_age: 18, nickname: 'guest' })
            .mockResolvedValueOnce({ id: 'db-id', email: 'db@example.com', user_age: 20, nickname: 'db-user' })

        const forceAllowAdapter = typeormAdapter(dataSource as never)({})
        await forceAllowAdapter.create({
            model: 'user',
            data: {
                id: 'manual-id',
                email: 'manual@example.com',
            },
            forceAllowId: true,
        })

        const customIdAdapter = typeormAdapter(dataSource as never)({
            advanced: {
                database: {
                    generateId: ({ model }: { model: string }) => `${model}-custom-id`,
                },
            },
        })
        await customIdAdapter.create({
            model: 'user',
            data: {
                email: 'custom@example.com',
            },
        })

        const dbIdAdapter = typeormAdapter(dataSource as never)({
            advanced: {
                database: {
                    generateId: false,
                },
            },
        })
        await dbIdAdapter.create({
            model: 'user',
            data: {
                email: 'db@example.com',
                age: 20,
                nickname: 'db-user',
            },
        })

        expect(userRepository.save).toHaveBeenNthCalledWith(1, {
            id: 'manual-id',
            email: 'manual@example.com',
            user_age: 18,
            nickname: 'guest',
        })
        expect(userRepository.save).toHaveBeenNthCalledWith(2, {
            id: 'user-custom-id',
            email: 'custom@example.com',
            user_age: 18,
            nickname: 'guest',
        })
        expect(userRepository.save).toHaveBeenNthCalledWith(3, {
            email: 'db@example.com',
            user_age: 20,
            nickname: 'db-user',
        })
    })

    it('updates one record and returns selected fields from transformed output', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne
            .mockResolvedValueOnce({ id: 'user-1', email: 'before@example.com', user_age: 18, nickname: 'guest' })
            .mockResolvedValueOnce({ id: 'user-1', email: 'after@example.com', user_age: 22, nickname: 'neo' })
        userRepository.update.mockResolvedValue({ affected: 1 })

        const adapter = typeormAdapter(dataSource as never)({})
        const result = await adapter.update({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
            update: {
                email: 'after@example.com',
                age: 22,
                nickname: 'neo',
            },
        })

        expect(userRepository.update).toHaveBeenCalledWith({ id: 'user-1' }, {
            email: 'after@example.com',
            user_age: 22,
            nickname: 'neo',
        })
        expect(result).toMatchObject({
            id: 'user-1',
            email: 'after@example.com',
            age: 22,
        })
    })

    it('returns null when update receives multiple where clauses', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.update.mockResolvedValue({ affected: 1 })

        const adapter = typeormAdapter(dataSource as never)({})
        const result = await adapter.update({
            model: 'user',
            where: [
                { field: 'email', operator: 'contains', value: '@example.com' },
                { field: 'age', operator: 'gte', value: 18 },
            ],
            update: {
                nickname: 'updated',
            },
        })

        expect(result).toBeNull()
        expect(userRepository.update).toHaveBeenCalledWith({
            email: expect.objectContaining({ _type: 'like', _value: '%@example.com%' }),
            user_age: expect.objectContaining({ _type: 'moreThanOrEqual', _value: 18 }),
        }, {
            nickname: 'updated',
        })
    })

    it('finds one record with converted operators and mapped joins', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.findOne.mockResolvedValue({
            id: 'user-1',
            email: 'alice@example.com',
            user_age: 20,
            nickname: 'alice',
            userProfile: {
                id: 'profile-1',
                biography: 'profile bio',
                user_id: 'user-1',
            },
        })

        const adapter = typeormAdapter(dataSource as never)({})
        const result = await adapter.findOne({
            model: 'user',
            where: [
                { field: 'email', operator: 'starts_with', value: 'alice' },
                { field: 'age', operator: 'lt', value: 30 },
                { field: 'nickname', operator: 'ne', value: 'blocked' },
            ],
            join: {
                profile: true,
            },
        })

        expect(userRepository.findOne).toHaveBeenCalledWith({
            where: {
                email: expect.objectContaining({ _type: 'like', _value: 'alice%' }),
                user_age: expect.objectContaining({ _type: 'lessThan', _value: 30 }),
                nickname: expect.objectContaining({ _type: 'not', _value: 'blocked' }),
            },
            select: undefined,
            relations: {
                userProfile: true,
            },
        })
        expect(result).toEqual({
            id: 'user-1',
            email: 'alice@example.com',
            age: 20,
            nickname: 'alice',
            profileId: undefined,
            userProfile: {
                id: 'profile-1',
                bio: 'profile bio',
                userId: 'user-1',
            },
        })
    })

    it('finds many records with sorting, pagination and array relation mapping', async () => {
        const { dataSource, userRepository } = createDataSource({ relationPropertyName: 'profile' })
        userRepository.find.mockResolvedValue([
            {
                id: 'user-1',
                email: 'alice@example.com',
                user_age: 21,
                nickname: 'alice',
                profile: [
                    { id: 'profile-1', biography: 'bio-1', user_id: 'user-1' },
                ],
            },
        ])

        const adapter = typeormAdapter(dataSource as never)({})
        const result = await adapter.findMany({
            model: 'user',
            where: [
                { field: 'age', operator: 'lte', value: 30 },
                { field: 'id', operator: 'in', value: ['user-1', 'user-2'] },
                { field: 'email', operator: 'ends_with', value: '@example.com' },
            ],
            limit: 10,
            offset: 5,
            sortBy: {
                field: 'createdAt',
                direction: 'desc',
            },
            join: {
                profile: {
                    limit: 1,
                },
                ignored: false,
            },
        })

        expect(userRepository.find).toHaveBeenCalledWith({
            where: {
                user_age: expect.objectContaining({ _type: 'lessThanOrEqual', _value: 30 }),
                id: expect.objectContaining({ _type: 'in', _value: ['user-1', 'user-2'] }),
                email: expect.objectContaining({ _type: 'like', _value: '%@example.com' }),
            },
            take: 10,
            skip: 5,
            order: {
                createdAt: 'DESC',
            },
            relations: {
                profile: true,
            },
        })
        expect(result).toEqual([
            {
                id: 'user-1',
                email: 'alice@example.com',
                age: 21,
                nickname: 'alice',
                profileId: undefined,
                profile: [
                    {
                        id: 'profile-1',
                        bio: 'bio-1',
                        userId: 'user-1',
                    },
                ],
            },
        ])
    })

    it('counts, updates many and deletes many with converted filters', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.count.mockResolvedValue(4)
        userRepository.update.mockResolvedValue({ affected: 3 })
        userRepository.delete.mockResolvedValue({ affected: 2 })

        const adapter = typeormAdapter(dataSource as never)({})

        await expect(adapter.count({
            model: 'user',
            where: [{ field: 'age', operator: 'gt', value: 18 }],
        })).resolves.toBe(4)

        await expect(adapter.updateMany({
            model: 'user',
            where: [{ field: 'email', operator: 'contains', value: '@example.com' }],
            update: { nickname: 'bulk' },
        })).resolves.toBe(3)

        await expect(adapter.deleteMany({
            model: 'user',
            where: [{ field: 'age', operator: 'lt', value: 18 }],
        })).resolves.toBe(2)

        expect(userRepository.count).toHaveBeenCalledWith({
            where: {
                user_age: expect.objectContaining({ _type: 'moreThan', _value: 18 }),
            },
        })
        expect(userRepository.update).toHaveBeenLastCalledWith({
            email: expect.objectContaining({ _type: 'like', _value: '%@example.com%' }),
        }, {
            nickname: 'bulk',
        })
        expect(userRepository.delete).toHaveBeenLastCalledWith({
            user_age: expect.objectContaining({ _type: 'lessThan', _value: 18 }),
        })
    })

    it('deletes one record and supports prefixed table name resolution', async () => {
        const { dataSource, userRepository } = createDataSource({ entityPrefix: 'app_' })
        userRepository.delete.mockResolvedValue({ affected: 1 })

        const adapter = typeormAdapter(dataSource as never)({})
        await adapter.delete({
            model: 'user',
            where: [{ field: 'email', value: 'alice@example.com' }],
        })

        expect(dataSource.manager.getRepository).toHaveBeenCalledWith('User')
        expect(userRepository.delete).toHaveBeenCalledWith({
            email: 'alice@example.com',
        })
    })

    it('wraps repository failures in BetterAuthError', async () => {
        const { dataSource, userRepository } = createDataSource()
        userRepository.save.mockRejectedValue(new Error('write failed'))
        userRepository.findOne.mockRejectedValue(new Error('read failed'))

        const adapter = typeormAdapter(dataSource as never)({})

        await expect(adapter.create({
            model: 'user',
            data: { email: 'alice@example.com' },
        })).rejects.toEqual(expect.objectContaining<Partial<BetterAuthError>>({
            message: 'Failed to create user: write failed',
        }))

        await expect(adapter.findOne({
            model: 'user',
            where: [{ field: 'id', value: 'user-1' }],
        })).rejects.toEqual(expect.objectContaining<Partial<BetterAuthError>>({
            message: 'Failed to find user: read failed',
        }))
    })

    it('throws when schema model is missing', async () => {
        const { dataSource } = createDataSource()
        const adapter = typeormAdapter(dataSource as never)({})

        await expect(adapter.create({
            model: 'missing-model',
            data: {},
        })).rejects.toThrow('Model missing-model not found in schema')
    })

    it('runs transactions with a dedicated manager adapter', async () => {
        const { dataSource, txUserRepository, txManager } = createDataSource()
        txUserRepository.save.mockResolvedValue({
            id: 'tx-id',
            email: 'tx@example.com',
            user_age: 18,
            nickname: 'guest',
        })

        const adapter = typeormAdapter(dataSource as never)({})
        const result = await adapter.transaction(async (trx) => {
            return trx.create({
                model: 'user',
                data: {
                    email: 'tx@example.com',
                },
            })
        })

        expect(dataSource.transaction).toHaveBeenCalledTimes(1)
        expect(txManager.getRepository).toHaveBeenCalledWith('User')
        expect(result).toEqual({
            id: 'tx-id',
            email: 'tx@example.com',
            age: 18,
            nickname: 'guest',
            profileId: undefined,
        })
    })
})
