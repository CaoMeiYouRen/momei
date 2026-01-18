import { dataSource } from '@/server/database'
import { Post } from '@/server/entities/post'
import { PostVisibility } from '@/types/post'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { password } = body

    if (!id || !password) {
        throw createError({ statusCode: 400, statusMessage: 'ID and Password required' })
    }

    const postRepo = dataSource.getRepository(Post)
    const post = await postRepo.findOne({ where: { id } })

    if (!post) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }

    if (post.visibility !== PostVisibility.PASSWORD) {
        throw createError({ statusCode: 400, statusMessage: 'Post is not password protected' })
    }

    if (post.password !== password) {
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
