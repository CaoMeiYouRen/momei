import crypto from 'node:crypto'
import { z } from 'zod'
import { commentTranslationService } from '@/server/services/comment-translation'
import { signCookieValue, verifyCookieValue } from '@/server/utils/security'
import { isSnowflakeId } from '@/utils/shared/validate'
import { isAdmin } from '@/utils/shared/roles'

const COMMENT_TRANSLATION_VISITOR_COOKIE_NAME = 'momei_comment_translation_actor'

const commentTranslationBodySchema = z.object({
    commentId: z.string().trim().refine((value) => isSnowflakeId(value), {
        message: 'Invalid commentId',
    }),
    targetLanguage: z.string().trim().min(2).max(16),
})

function resolveCommentTranslationActorId(event: Parameters<typeof getCookie>[0]) {
    const signedActorId = getCookie(event, COMMENT_TRANSLATION_VISITOR_COOKIE_NAME)
    const verifiedActorId = verifyCookieValue(signedActorId)
    if (verifiedActorId) {
        return {
            actorId: verifiedActorId,
            shouldPersist: false,
        }
    }

    return {
        actorId: crypto.randomUUID(),
        shouldPersist: true,
    }
}

export { COMMENT_TRANSLATION_VISITOR_COOKIE_NAME }

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const result = commentTranslationBodySchema.safeParse(body)

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid parameters',
            data: z.treeifyError(result.error),
        })
    }

    const session = event.context?.auth
    const signedGuestEmail = getCookie(event, 'momei_guest_email')
    const guestEmail = verifyCookieValue(signedGuestEmail)
    const actor = session?.user
        ? {
            actorId: session.user.id,
            shouldPersist: false,
        }
        : resolveCommentTranslationActorId(event)

    if (actor.shouldPersist) {
        setCookie(event, COMMENT_TRANSLATION_VISITOR_COOKIE_NAME, signCookieValue(actor.actorId), {
            httpOnly: true,
            maxAge: 30 * 24 * 3600,
            path: '/',
            sameSite: 'lax',
        })
    }

    const translation = await commentTranslationService.getOrCreateTranslation({
        actorId: actor.actorId,
        commentId: result.data.commentId,
        targetLanguage: result.data.targetLanguage,
        isAdmin: Boolean(session?.user && isAdmin(session.user.role)),
        viewerEmail: (session?.user?.email || guestEmail) ?? undefined,
        viewerId: session?.user?.id,
    })

    return {
        code: 200,
        data: translation,
    }
})
