import { Column, type ColumnOptions, Index } from 'typeorm'
import { applyDecorators } from './apply-decorators'
import { DATABASE_TYPE } from '@/utils/shared/env'

/**
 * 归一化布尔列的水合值。
 *
 * PostgreSQL 官方驱动正常返回 `true` / `false`，但一旦驱动类型解析器失效
 * （例如 Nitro/Rollup 摇树掉 `pg-types` 的默认解析器注册），`bool` 会以文本
 * `'t'` / `'f'` 返回；SQLite / MySQL 则返回 `1` / `0`。这些非布尔值一旦透传到
 * API，前端 `isPinned ? 是 : 否` 之类的真值判断会把 `'f'` 误判为真
 * （表现为「所有文章都显示置顶」）。
 *
 * 显式归一化后，布尔列在任何驱动/打包退化下都保持真实布尔语义。
 *
 * @param value 驱动返回的原始列值。
 * @returns `true` / `false`，`null` / `undefined` 原样返回。
 */
export function normalizeBooleanColumnValue(value: unknown): unknown {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        return value !== 0
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()

        if (['t', 'true', '1', 'y', 'yes', 'on'].includes(normalized)) {
            return true
        }

        if (['f', 'false', '0', 'n', 'no', 'off', ''].includes(normalized)) {
            return false
        }
    }

    return Boolean(value)
}

const BOOLEAN_COLUMN_TRANSFORMER = {
    to: (value: unknown) => value,
    from: normalizeBooleanColumnValue,
}

export function CustomColumn(options: ColumnOptions & { index?: boolean }) {
    const dbType = DATABASE_TYPE
    const decorators: PropertyDecorator[] = []
    let length = Number(options.length)

    // 非 mysql 数据库不支持 mediumtext 和 longtext，统一转换为 text
    if (
        dbType !== 'mysql'
        && ['mediumtext', 'longtext'].includes(options.type as string)
    ) {
        options.type = 'text'
    }

    if (dbType === 'sqlite') {
        // 处理 sqlite 不兼容的配置
        // sqlite AUTOINCREMENT 仅支持 integer 类型，所以 id 设置为 integer
        if (options.type === 'bigint') {
            options.type = 'integer'
        } else if (['mediumtext', 'longtext'].includes(options.type as string)) {
            // 非 mysql 数据库不支持 mediumtext 和 longtext，统一转换为 text
            options.type = 'text'
        }

    } else if (dbType === 'mysql') {
        // 处理 MySQL 不兼容的配置
        // mysql 索引最大不超过 3072 字节，在 utf8 编码下不超过 1024 字符，utf8mb4 编码不超过 768 字符
        if (options.index && length > 768) {
            length = 768
            options.length = length
        }
        // mysql 不支持在 text 类型字段上设置 length
        if (
            [
                'text',
                'mediumtext',
                'longtext',
                'simple-json',
                'simple-array',
            ].includes(options.type as string)
            && options.length
        ) {
            if (
                ['text', 'mediumtext', 'longtext'].includes(
                    options.type as string,
                )
            ) {
                if (Number(options.length) > 5592405) {
                    // 超过 MEDIUMTEXT 的范围。 16777215 B，5592405 个字符
                    options.type = 'longtext'
                } else if (Number(options.length) > 21845) {
                    // 超过 TEXT 的范围。 65535 B，21845 个字符
                    options.type = 'mediumtext'
                } else {
                    options.type = 'text'
                }
            }
            delete options.length
        }
        // mysql 不支持在 simple-json 类型字段上设置 default
        if (
            ['simple-json', 'simple-array'].includes(options.type as string)
            && typeof options.default !== 'undefined'
        ) {
            delete options.default
        }
    } else if (dbType === 'postgres') {
        // 处理 PostgreSQL 不兼容的配置
        // postgres 的 bigserial 类型的 id 在插入时返回的是 string 类型，存在 bug，所以设置为 integer
        if (options.type === 'bigint') {
            options.type = 'integer'
        } else if (options.type === Date || options.type === 'datetime') { // 处理 datetime 类型
            options.type = 'timestamp with time zone'
        } else if (['mediumtext', 'longtext'].includes(options.type as string)) {
            // 非 mysql 数据库不支持 mediumtext 和 longtext，统一转换为 text
            options.type = 'text'
        }
        // postgres 索引最大不超过 8191 字节，在 utf8 编码下不超过 2730 字符
        if (options.index && length > 2730) {
            options.length = 2730
        }
        // postgres 不支持在 text 类型字段上设置 length
        if (
            [
                'text',
                'mediumtext',
                'longtext',
                'simple-json',
                'simple-array',
            ].includes(options.type as string)
            && options.length
        ) {
            delete options.length
        }
        // postgres 不支持在 simple-json 类型字段上设置 default
        if (
            ['simple-json', 'simple-array'].includes(options.type as string)
            && typeof options.default !== 'undefined'
        ) {
            delete options.default
        }
    }
    // 布尔列统一归一化，避免驱动/打包退化时把 'f' 这类非空字符串当真值透传到 API。
    // 仅处理字符串形式 'boolean'：`type: Boolean` 在驱动层会先行 `value ? true : false`，
    // `'f'` 早在 transformer 之前就已被转成 true，无法兜底，且仓库未使用该写法。
    if (options.type === 'boolean' && !options.transformer) {
        options.transformer = BOOLEAN_COLUMN_TRANSFORMER
    }
    if (options.index) { // 设置索引
        decorators.push(Index({ unique: options.unique }))
        delete options.index
        if (options.unique) {
            delete options.unique
        }
    }
    decorators.push(Column(options))
    return applyDecorators(
        ...decorators,
    )
}
