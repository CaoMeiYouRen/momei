export default defineEventHandler((event) => {
    const config = useRuntimeConfig()
    const siteUrl = config.public.siteUrl || 'https://momei.app'

    // 格式化当前日期作为参考（可选）
    const robots = [
        'User-agent: *',
        'Allow: /',
        'Allow: /sitemap.xml',
        'Allow: /llms.txt',
        'Allow: /llms-full.txt',
        '',
        '# 管理端与设置',
        'Disallow: /admin/',
        'Disallow: /settings/',
        'Disallow: /*/admin/',
        'Disallow: /*/settings/',
        '',
        '# 认证相关',
        'Disallow: /login',
        'Disallow: /register',
        'Disallow: /forgot-password',
        'Disallow: /reset-password',
        'Disallow: /*/login',
        'Disallow: /*/register',
        'Disallow: /*/forgot-password',
        'Disallow: /*/reset-password',
        '',
        '# API 接口',
        'Disallow: /api/',
        '',
        '# AI crawler discovery resources',
        `# llms: ${siteUrl}/llms.txt`,
        `# llms-full: ${siteUrl}/llms-full.txt`,
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
    ].join('\n')

    // 设置响应头为文本格式
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')

    return robots
})
