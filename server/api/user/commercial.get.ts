import { requireAuth } from '@/server/utils/permission'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const userRepo = dataSource.getRepository(User)

    const user = await userRepo.findOne({
        where: { id: session.user.id },
        select: ['socialLinks', 'donationLinks'],
    })

    if (!user) {
        throw createError({
            statusCode: 404,
            message: 'User not found',
        })
    }

    return {
        code: 200,
        data: {
            socialLinks: user.socialLinks || [],
            donationLinks: user.donationLinks || [],
        },
    }
})
