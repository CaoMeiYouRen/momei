import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveFedActorContext } from './actor-context'

const { findOne } = vi.hoisted(() => ({ findOne: vi.fn() }))

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: () => ({ findOne }),
    },
}))

vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteUrl: 'https://momei.app' } }))

function createEvent(params: Record<string, string> = {}) {
    return { context: { params } } as unknown as Parameters<typeof resolveFedActorContext>[0]
}

describe('resolveFedActorContext', () => {
    beforeEach(() => {
        findOne.mockReset()
    })

    it('缺少 username 时返回 400', async () => {
        await expect(resolveFedActorContext(createEvent())).rejects.toMatchObject({
            statusCode: 400,
            message: 'Username is required',
        })
    })

    it('用户不存在时返回 404', async () => {
        findOne.mockResolvedValue(null)

        await expect(resolveFedActorContext(createEvent({ username: 'ghost' }))).rejects.toMatchObject({
            statusCode: 404,
            message: 'Actor not found',
        })
    })

    it('命中用户时返回 username / user / siteUrl', async () => {
        const user = { id: 'u1', username: 'alice' }
        findOne.mockResolvedValue(user)

        await expect(resolveFedActorContext(createEvent({ username: 'alice' }))).resolves.toEqual({
            username: 'alice',
            user,
            siteUrl: 'https://momei.app',
        })
        expect(findOne).toHaveBeenCalledWith({ where: { username: 'alice' } })
    })
})
