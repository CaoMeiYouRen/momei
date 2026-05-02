import { dataSource } from '@/server/database'
import { BenefitWaitlist } from '@/server/entities/benefit-waitlist'
import { requireAdmin } from '@/server/utils/permission'

export default defineEventHandler(async (event) => {
    await requireAdmin(event)

    const query = getQuery(event)
    const purpose = typeof query.purpose === 'string' && query.purpose.trim().length > 0
        ? query.purpose.trim()
        : undefined

    const repo = dataSource.getRepository(BenefitWaitlist)
    const queryBuilder = repo.createQueryBuilder('waitlist')
        .orderBy('waitlist.createdAt', 'DESC')

    if (purpose) {
        queryBuilder.andWhere('waitlist.purpose = :purpose', { purpose })
    }

    const entries = await queryBuilder.getMany()

    const header = ['ID', 'Name', 'Email', 'Purpose', 'Locale', 'IP', 'CreatedAt']
    const rows = entries.map((e) => [
        e.id,
        e.name,
        e.email,
        e.purpose || 'benefit',
        e.locale || '',
        e.ip || '',
        e.createdAt.toISOString(),
    ])

    const csvContent = [
        `\ufeff${header.join(',')}`,
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')

    setHeaders(event, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=waitlist.csv',
    })

    return csvContent
})
