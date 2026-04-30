import { dataSource } from '@/server/database'
import { BenefitWaitlist } from '@/server/entities/benefit-waitlist'
import { assignDefined } from '@/server/utils/object'

/**
 * 候补列表服务
 * 注意：本轮不做邮箱去重校验，同一邮箱可多次提交。
 * 后续若需唯一约束，可在 DB 层添加 unique index 或应用层 findOne + early return。
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
