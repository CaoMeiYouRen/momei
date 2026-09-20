/**
 * PostgreSQL 值类型自检。
 *
 * 背景：Nitro/Rollup 曾把 `pg-types` 顶层的默认解析器注册摇树掉，导致 PostgreSQL
 * 返回的 `bool` / `int4` / `json` 等全部以原始文本形式（`'t'` / `'f'` / `'0'` / JSON 字符串）
 * 透传到业务层。最典型的可见故障是前端 `data.isPinned ? 是 : 否` 把 `'f'` 当成真值，
 * 表现为「所有文章都显示置顶」。
 *
 * 该自检在数据库初始化完成后跑一条确定性探针，直接验证驱动返回的 JS 类型；
 * 一旦解析器再次退化，会立即以 error 日志暴露，而不是继续静默产出错误数据。
 */

export interface PostgresValueTypeCheckResult {
    ok: boolean
    issues: string[]
}

/** 探针 SQL：三类典型列各取一个值。 */
export const POSTGRES_VALUE_TYPE_PROBE_SQL =
    `SELECT true AS bool_value, 1::integer AS int_value, '{"ok":true}'::json AS json_value`

/** 仅依赖 `query` 的最小执行器接口，便于单测注入假实现。 */
export interface QueryRunnerLike {
    query: (sql: string) => Promise<unknown>
}

/**
 * 依据探针返回行判断驱动类型解析是否正常。
 *
 * @param row 探针返回的第一行。
 * @returns 校验结果与失败原因列表。
 */
export function evaluatePostgresValueTypes(
    row: Record<string, unknown> | undefined | null,
): PostgresValueTypeCheckResult {
    if (!row) {
        return { ok: false, issues: ['探针未返回任何行'] }
    }

    const issues: string[] = []

    if (typeof row.bool_value !== 'boolean') {
        issues.push(`bool 列返回 ${typeof row.bool_value}（${String(row.bool_value)}）`)
    }

    if (typeof row.int_value !== 'number') {
        issues.push(`integer 列返回 ${typeof row.int_value}（${String(row.int_value)}）`)
    }

    if (typeof row.json_value !== 'object' || row.json_value === null) {
        issues.push(`json 列返回 ${typeof row.json_value}（${String(row.json_value)}）`)
    }

    return { ok: issues.length === 0, issues }
}

/**
 * 执行探针 SQL 并校验 PostgreSQL 值类型解析。
 *
 * @param runner 任意具备 `query` 的执行器（如 TypeORM DataSource）。
 * @returns 校验结果与失败原因列表。
 */
export async function checkPostgresValueTypes(
    runner: QueryRunnerLike,
): Promise<PostgresValueTypeCheckResult> {
    const rows = await runner.query(POSTGRES_VALUE_TYPE_PROBE_SQL)
    const firstRow = Array.isArray(rows)
        ? rows[0] as Record<string, unknown> | undefined
        : undefined

    return evaluatePostgresValueTypes(firstRow)
}
