import { dataSource } from '@/server/database'
import { Subscriber } from '@/server/entities/subscriber'
import { auth } from '@/lib/auth'

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session || session.user.role !== 'admin') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const subscriberRepo = dataSource.getRepository(Subscriber)
    const subscribers = await subscriberRepo.find({
        relations: ['user'],
        order: { createdAt: 'DESC' },
    })

    const header = ['ID', 'Email', 'IsActive', 'Language', 'UserID', 'UserName', 'CreatedAt']
    const rows = subscribers.map((s) => [
        s.id,
        s.email,
        s.isActive ? '1' : '0',
        s.language,
        s.userId || '',
        s.user?.name || s.user?.email || '',
        s.createdAt.toISOString(),
    ])

    const csvContent = [
        `\ufeff${header.join(',')}`, // Add BOM for Excel UTF-8 support
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')

    setHeaders(event, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=subscribers.csv',
    })

    return csvContent
})
