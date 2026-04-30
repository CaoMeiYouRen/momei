import { dataSource } from '@/server/database'
import { BenefitWaitlist } from '@/server/entities/benefit-waitlist'
import { assignDefined } from '@/server/utils/object'
import logger from '@/server/utils/logger'

/**
 * 候补列表服务
 *
 * 去重策略：应用层 findOne + early return，同一邮箱重复提交时静默返回已有记录。
 * 后续若需更严格的唯一约束，可在 DB 层添加 unique index。
 */
export const benefitWaitlistService = {
    async addToWaitlist(data: {
        name: string
        email: string
        locale?: string | null
        ip?: string | null
        userAgent?: string | null
    }) {
        const repo = dataSource.getRepository(BenefitWaitlist)

        // 邮箱去重：若已存在则直接返回已有记录
        const existing = await repo.findOne({ where: { email: data.email } })
        if (existing) {
            logger.info(`[benefit-waitlist] Duplicate email, returning existing entry id=${existing.id}`)
            return existing
        }

        const entry = new BenefitWaitlist()

        assignDefined(entry, data, [
            'name',
            'email',
            'locale',
            'ip',
            'userAgent',
        ])

        if (data.locale === undefined) { entry.locale = null }
        if (data.ip === undefined) { entry.ip = null }
        if (data.userAgent === undefined) { entry.userAgent = null }

        return await repo.save(entry)
    },
}
