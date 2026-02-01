import { type SelectQueryBuilder, type Repository, type ObjectLiteral, In } from 'typeorm'

/**
 * 为 QueryBuilder 应用翻译聚合逻辑
 * 仅显示目标语言版本，如果目标语言不存在则显示默认/第一个版本
 *
 * @param qb 主查询 QueryBuilder
 * @param repo 对应的 Repository (用于创建子查询)
 * @param options 配置项
 */
export function applyTranslationAggregation<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    repo: Repository<T>,
    options: {
        language?: string
        mainAlias: string
        subAlias?: string
        applyFilters?: (subQuery: SelectQueryBuilder<T>) => void
    },
) {
    const { language = 'zh-CN', mainAlias, subAlias = 't2', applyFilters } = options

    const subQuery = repo.createQueryBuilder(subAlias)
        .select(`COALESCE(MIN(CASE WHEN ${subAlias}.language = :prefLang THEN ${subAlias}.id END), MIN(${subAlias}.id))`)
        .groupBy(`COALESCE(${subAlias}.translationId, ${subAlias}.id)`)

    if (applyFilters) {
        applyFilters(subQuery)
    }

    qb.andWhere(`${mainAlias}.id IN (${subQuery.getQuery()})`)
    qb.setParameter('prefLang', language)
    qb.setParameters(subQuery.getParameters())

    return qb
}

/**
 * 获取并附加翻译信息
 * @param items 数据列表
 * @param repo 对应的 Repository
 * @param options 配置项
 */
export async function attachTranslations<T extends ObjectLiteral & { translationId: string | null, id: string, language: string }>(
    items: T[],
    repo: Repository<T>,
    options: {
        select?: (keyof T)[]
    } = {},
) {
    if (items.length === 0) {
        return items
    }

    const translationIds = items
        .map((item) => item.translationId)
        .filter((id): id is string => id !== null)

    if (translationIds.length === 0) {
        items.forEach((item) => {
            (item as any).translations = [{
                id: item.id,
                language: item.language,
                translationId: item.translationId,
            }]
        })
        return items
    }

    const allTranslations = await repo.find({
        where: { translationId: In(translationIds) } as any,
        select: options.select as any,
    })

    items.forEach((item) => {
        if (item.translationId) {
            (item as any).translations = allTranslations
                .filter((t) => t.translationId === item.translationId)
                .map((t) => {
                    const trans: any = {
                        id: t.id,
                        language: t.language,
                        translationId: t.translationId,
                    }
                    // 如果有其他字段在 select 中，也一并带上
                    if (options.select) {
                        options.select.forEach((key) => {
                            trans[key as string] = t[key]
                        })
                    }
                    return trans
                })
        } else {
            (item as any).translations = [{
                id: item.id,
                language: item.language,
                translationId: item.translationId,
            }]
        }
    })

    return items
}
