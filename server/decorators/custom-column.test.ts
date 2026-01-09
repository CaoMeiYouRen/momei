import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('CustomColumn', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('sqlite: converts bigint to integer', async () => {
        vi.doMock('@/utils/shared/env', () => ({
            DATABASE_TYPE: 'sqlite',
        }))
        const { CustomColumn } = await import('./custom-column')
        const options: any = { type: 'bigint' }

        // Mock applyDecorators to avoid real TypeORM interaction
        vi.mock('./apply-decorators', () => ({
            applyDecorators: () => { },
        }))
        // Mock TypeORM decorators
        vi.mock('typeorm', () => ({
            Column: () => { },
            Index: () => { },
        }))

        CustomColumn(options)
        expect(options.type).toBe('integer')
    })

    it('mysql: truncates index length', async () => {
        vi.doMock('@/utils/shared/env', () => ({
            DATABASE_TYPE: 'mysql',
        }))
        const { CustomColumn } = await import('./custom-column')
        const options: any = { type: 'varchar', length: 1000, index: true }

        vi.mock('./apply-decorators', () => ({ applyDecorators: () => { } }))
        vi.mock('typeorm', () => ({ Column: () => { }, Index: () => { } }))

        CustomColumn(options)
        expect(options.length).toBe(768)
    })
})
