import MarkdownIt from 'markdown-it'
import { requireAdmin } from '@/server/utils/permission'
import { marketingCampaignSchema } from '@/utils/schemas/notification'
import { emailTemplateEngine } from '@/server/utils/email/templates'
import { sendEmail } from '@/server/utils/email'

export default defineEventHandler(async (event) => {
    const session = await requireAdmin(event)
    const email = session.user.email

    if (!email) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Admin email not found',
        })
    }

    const result = await readValidatedBody(event, (body) => marketingCampaignSchema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            data: result.error.issues,
        })
    }

    const { title, content } = result.data

    // Render Markdown to HTML
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    })
    const htmlContent = md.render(content)

    // Render using marketing campaign template to keep preview consistent with real sends
    const emailResult = await emailTemplateEngine.generateMarketingEmailTemplate({
        headerIcon: 'pi pi-send',
        message: htmlContent,
        articleTitle: title,
        authorLabel: '作者：',
        authorName: 'Admin',
        categoryLabel: '分类：',
        categoryName: 'Marketing',
        dateLabel: '发布时间：',
        publishDate: new Date().toLocaleDateString('zh-CN'),
        buttonText: '阅读全文',
        actionUrl: '/',
    }, {
        title: title || 'Marketing Campaign Test',
        preheader: 'This is a test email for your marketing campaign.',
    })

    await sendEmail({
        to: session.user.email,
        subject: `[Test Preview] ${title}`,
        html: emailResult.html,
    })

    return {
        code: 200,
        message: 'Test email sent successfully',
    }
})
