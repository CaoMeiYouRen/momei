import { describe, it, expect } from 'vitest'
import { SnakeCaseNamingStrategy } from './naming-strategy'

describe('SnakeCaseNamingStrategy', () => {
    const strategy = new SnakeCaseNamingStrategy()

    it('should convert table name to snake_case', () => {
        expect(strategy.tableName('UserAccount', '')).toBe('user_account')
        expect(strategy.tableName('UserAccount', 'customName')).toBe('custom_name')
    })

    it('should convert column name to snake_case', () => {
        expect(strategy.columnName('firstName', '', [])).toBe('first_name')
        expect(strategy.columnName('firstName', 'customName', [])).toBe('custom_name')
        expect(strategy.columnName('firstName', '', ['prefix'])).toBe('prefix_first_name')
    })

    it('should convert relation name to snake_case', () => {
        expect(strategy.relationName('userAccount')).toBe('user_account')
    })

    it('should convert join column name to snake_case', () => {
        expect(strategy.joinColumnName('user', 'id')).toBe('user_id')
    })

    it('should convert join table name to snake_case', () => {
        expect(strategy.joinTableName('user', 'role', 'id', 'id')).toBe('user_id_role_id')
    })

    it('should convert join table column name to snake_case', () => {
        expect(strategy.joinTableColumnName('user_role', 'userId', 'id')).toBe('user_role_id')
        expect(strategy.joinTableColumnName('user_role', 'userId')).toBe('user_role_user_id')
    })

    it('should convert class table inheritance parent column name to snake_case', () => {
        expect(strategy.classTableInheritanceParentColumnName('user', 'id')).toBe('user_id')
    })

    it('should convert eager join relation alias to snake_case', () => {
        expect(strategy.eagerJoinRelationAlias('user', 'role.name')).toBe('user_role_name')
    })
})
