import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostVisibility } from '@/types/post'
import { verifyPassword } from '@/server/utils/password'
import { rateLimit } from '@/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { password } = body

    if (!id || !password) {
        throw createError({ statusCode: 400, statusMessage: 'ID and Password required' })
    }

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

    // Add to unlocked posts cookie
    const unlockedPosts = (getCookie(event, 'momei_unlocked_posts') || '').split(',').filter(Boolean)
    if (!unlockedPosts.includes(id)) {
        unlockedPosts.push(id)
    }

    setCookie(event, 'momei_unlocked_posts', unlockedPosts.join(','), {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
    })

    return {
        code: 200,
        message: 'Password verified',
    }
})
