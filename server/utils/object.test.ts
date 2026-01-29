import { describe, expect, it } from 'vitest'
import { assignDefined } from './object'

describe('object utils', () => {
    describe('assignDefined', () => {
        it('should assign defined values to target', () => {
            const target = { name: 'old', age: 20, email: 'old@test.com' }
            const source = { name: 'new', age: 30 }

            assignDefined(target, source, ['name', 'age'])

            expect(target.name).toBe('new')
            expect(target.age).toBe(30)
            expect(target.email).toBe('old@test.com')
        })

        it('should not assign undefined values', () => {
            const target = { name: 'old', age: 20 }
            const source = { name: 'new', age: undefined }

            assignDefined(target, source, ['name', 'age'])

            expect(target.name).toBe('new')
            expect(target.age).toBe(20)
        })

        it('should handle empty keys array', () => {
            const target = { name: 'old', age: 20 }
            const source = { name: 'new', age: 30 }

            assignDefined(target, source, [])

            expect(target.name).toBe('old')
            expect(target.age).toBe(20)
        })

        it('should handle null values', () => {
            const target = { name: 'old', age: 20 }
            const source = { name: null, age: 30 }

            assignDefined(target, source, ['name', 'age'])

            expect(target.name).toBe(null)
            expect(target.age).toBe(30)
        })

        it('should handle nested objects', () => {
            const target = { user: { name: 'old' }, count: 10 }
            const source = { user: { name: 'new' }, count: 20 }

            assignDefined(target, source, ['user', 'count'])

            expect(target.user).toEqual({ name: 'new' })
            expect(target.count).toBe(20)
        })
    })
})
