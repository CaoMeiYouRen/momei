import { z } from 'zod'
import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostVisibility } from '@/types/post'
import { verifyPassword } from '@/server/utils/password'
import { rateLimit } from '@/server/utils/rate-limit'
import { isSnowflakeId } from '@/utils/shared/validate'
import { rememberUnlockedPost } from '@/server/utils/post-unlock'

const postIdParamSchema = z.object({
    id: z.string().trim().refine((value) => isSnowflakeId(value), {
        message: 'ID and Password required',
    }),
})

const verifyPasswordBodySchema = z.object({
    password: z.string().trim().min(1).max(128),
})

export default defineEventHandler(async (event) => {
    const { id } = postIdParamSchema.parse({ id: getRouterParam(event, 'id') })
    const { password } = await readValidatedBody(event, (body) => verifyPasswordBodySchema.parse(body))

    // 1. Rate Limiting: Max 5 attempts per minute per IP for this post
    await rateLimit(event, { window: 60, max: 5 })

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({
        where: { id },
        select: ['id', 'visibility', 'password'], // Explicitly select password since it has select: false
    })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    if (post.visibility !== PostVisibility.PASSWORD) {
        throw createError({ statusCode: 400, statusMessage: 'Post is not password protected' })
    }

    // 2. Hash Verification & 3. Constant-time comparison (inside verifyPassword)
    if (!post.password || !verifyPassword(password, post.password)) {
        throw createError({ statusCode: 403, statusMessage: 'Incorrect password' })
    }

    rememberUnlockedPost(event, id)

    return {
        code: 200,
        message: 'Password verified',
    }
})
