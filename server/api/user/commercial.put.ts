import { requireAuth } from '@/server/utils/permission'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { UserCommercialConfigSchema } from '~/utils/shared/commercial-schema'

export default defineEventHandler(async (event) => {
    const session = await requireAuth(event)
    const body = await readValidatedBody(event, (b) => UserCommercialConfigSchema.parse(b))

    const userRepo = dataSource.getRepository(User)

    await userRepo.update(session.user.id, {
        socialLinks: body.socialLinks,
        donationLinks: body.donationLinks,
    })

    return {
        code: 200,
        message: 'Personal commercial links updated',
    }
})
