import { describe, expect, it } from 'vitest'
import { UserRole, hasRole, isAdmin, isAdminOrAuthor, isAuthor } from './roles'

describe('roles', () => {
    describe('UserRole enum', () => {
        it('should have correct role values', () => {
            expect(UserRole.ADMIN).toBe('admin')
            expect(UserRole.AUTHOR).toBe('author')
            expect(UserRole.USER).toBe('user')
        })
    })

    describe('hasRole', () => {
        it('should return true when user has the required role', () => {
            expect(hasRole('admin', 'admin')).toBe(true)
            expect(hasRole('author', 'author')).toBe(true)
            expect(hasRole('user', 'user')).toBe(true)
        })

        it('should return false when user does not have the required role', () => {
            expect(hasRole('user', 'admin')).toBe(false)
            expect(hasRole('author', 'admin')).toBe(false)
        })

        it('should handle multiple roles separated by comma', () => {
            expect(hasRole('admin,author', 'admin')).toBe(true)
            expect(hasRole('admin,author', 'author')).toBe(true)
            expect(hasRole('admin,author', 'user')).toBe(false)
        })

        it('should handle roles with whitespace', () => {
            expect(hasRole('admin, author', 'admin')).toBe(true)
            expect(hasRole('admin , author', 'author')).toBe(true)
        })

        it('should handle array of required roles', () => {
            expect(hasRole('admin', ['admin', 'author'])).toBe(true)
            expect(hasRole('author', ['admin', 'author'])).toBe(true)
            expect(hasRole('user', ['admin', 'author'])).toBe(false)
        })

        it('should return false for null or undefined user role', () => {
            expect(hasRole(null, 'admin')).toBe(false)
            expect(hasRole(undefined, 'admin')).toBe(false)
        })

        it('should return false for empty string user role', () => {
            expect(hasRole('', 'admin')).toBe(false)
        })
    })

    describe('isAdmin', () => {
        it('should return true for admin role', () => {
            expect(isAdmin('admin')).toBe(true)
            expect(isAdmin('admin,author')).toBe(true)
        })

        it('should return false for non-admin roles', () => {
            expect(isAdmin('author')).toBe(false)
            expect(isAdmin('user')).toBe(false)
            expect(isAdmin('author,user')).toBe(false)
        })

        it('should return false for null or undefined', () => {
            expect(isAdmin(null)).toBe(false)
            expect(isAdmin(undefined)).toBe(false)
        })
    })

    describe('isAuthor', () => {
        it('should return true for author role', () => {
            expect(isAuthor('author')).toBe(true)
            expect(isAuthor('admin,author')).toBe(true)
        })

        it('should return false for non-author roles', () => {
            expect(isAuthor('admin')).toBe(false)
            expect(isAuthor('user')).toBe(false)
        })

        it('should return false for null or undefined', () => {
            expect(isAuthor(null)).toBe(false)
            expect(isAuthor(undefined)).toBe(false)
        })
    })

    describe('isAdminOrAuthor', () => {
        it('should return true for admin role', () => {
            expect(isAdminOrAuthor('admin')).toBe(true)
        })

        it('should return true for author role', () => {
            expect(isAdminOrAuthor('author')).toBe(true)
        })

        it('should return true for combined roles', () => {
            expect(isAdminOrAuthor('admin,author')).toBe(true)
            expect(isAdminOrAuthor('admin,user')).toBe(true)
            expect(isAdminOrAuthor('author,user')).toBe(true)
        })

        it('should return false for user role only', () => {
            expect(isAdminOrAuthor('user')).toBe(false)
        })

        it('should return false for null or undefined', () => {
            expect(isAdminOrAuthor(null)).toBe(false)
            expect(isAdminOrAuthor(undefined)).toBe(false)
        })
    })
})
