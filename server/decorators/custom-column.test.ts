import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as env from '@/utils/shared/env'

// Mock applyDecorators to avoid real TypeORM interaction
vi.mock('./apply-decorators', () => ({
    applyDecorators: (...decorators: any[]) => decorators,
}))
// Mock TypeORM decorators
vi.mock('typeorm', () => ({
    Column: (options: any) => ({ type: 'Column', options }),
    Index: (options: any) => ({ type: 'Index', options }),
}))

describe('CustomColumn', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('sqlite: converts bigint to integer', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('sqlite')
        const { CustomColumn } = await import('./custom-column')
        const options: any = { type: 'bigint' }

        CustomColumn(options)
        expect(options.type).toBe('integer')
    })

    it('mysql: truncates index length', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('mysql')
        const { CustomColumn } = await import('./custom-column')
        const options: any = { type: 'varchar', length: 1000, index: true }

        CustomColumn(options)
        expect(options.length).toBe(768)
    })

    it('mysql: handles different text lengths', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('mysql')
        const { CustomColumn } = await import('./custom-column')

        // Longtext
        const options1: any = { type: 'text', length: 6000000 }
        CustomColumn(options1)
        expect(options1.type).toBe('longtext')
        expect(options1.length).toBeUndefined()

        // Mediumtext
        const options2: any = { type: 'text', length: 100000 }
        CustomColumn(options2)
        expect(options2.type).toBe('mediumtext')

        // Text
        const options3: any = { type: 'text', length: 1000 }
        CustomColumn(options3)
        expect(options3.type).toBe('text')
    })

    it('mysql: removes default for json and array', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('mysql')
        const { CustomColumn } = await import('./custom-column')

        const options1: any = { type: 'simple-json', default: {} }
        CustomColumn(options1)
        expect(options1.default).toBeUndefined()

        const options2: any = { type: 'simple-array', default: [] }
        CustomColumn(options2)
        expect(options2.default).toBeUndefined()
    })

    it('postgres: handles bigint and datetime', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('postgres')
        const { CustomColumn } = await import('./custom-column')

        const options1: any = { type: 'bigint' }
        CustomColumn(options1)
        expect(options1.type).toBe('integer')

        const options2: any = { type: 'datetime' }
        CustomColumn(options2)
        expect(options2.type).toBe('timestamp with time zone')

        const options3: any = { type: Date }
        CustomColumn(options3)
        expect(options3.type).toBe('timestamp with time zone')
    })

    it('postgres: handles index length and removes length/default from text/json', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('postgres')
        const { CustomColumn } = await import('./custom-column')

        // Index length
        const options1: any = { type: 'varchar', length: 3000, index: true }
        CustomColumn(options1)
        expect(options1.length).toBe(2730)

        // Length removal
        const options2: any = { type: 'text', length: 100 }
        CustomColumn(options2)
        expect(options2.length).toBeUndefined()

        // Default removal
        const options3: any = { type: 'simple-json', default: {} }
        CustomColumn(options3)
        expect(options3.default).toBeUndefined()
    })

    it('should handle unique index', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('sqlite')
        const { CustomColumn } = await import('./custom-column')
        const options: any = { type: 'varchar', index: true, unique: true }

        const decorators = CustomColumn(options) as any[]
        const indexDecorator = decorators.find((d) => d.type === 'Index')
        expect(indexDecorator.options.unique).toBe(true)
        expect(options.index).toBeUndefined()
        expect(options.unique).toBeUndefined()
    })

    it('should work without index', async () => {
        vi.spyOn(env, 'DATABASE_TYPE', 'get').mockReturnValue('sqlite')
        const { CustomColumn } = await import('./custom-column')
        const options: any = { type: 'varchar' }

        const decorators = CustomColumn(options) as any[]
        expect(decorators.find((d) => d.type === 'Index')).toBeUndefined()
        expect(decorators.find((d) => d.type === 'Column')).toBeDefined()
    })
})
