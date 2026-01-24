import { sha256 } from '@/utils/shared/hash'

/**
 * 处理作者隐私信息 (计算 Email Hash 并根据权限删除原文)
 * @param author 作者对象 (包含 email, image, name 等)
 * @param isAdmin 是否为管理员 (管理员可以看到原文)
 * @param emailField 邮箱字段名，默认为 'email'
 * @param hashField 哈希存储字段名，默认为 'emailHash'
 */
export async function processAuthorPrivacy(author: any, isAdmin: boolean, emailField = 'email', hashField = 'emailHash') {
    if (!author) { return author }

    if (author[emailField]) {
        // 计算 SHA256 哈希用于 Gravatar
        author[hashField] = await sha256(author[emailField])

        // 非管理员隐藏 Email 原文
        if (!isAdmin) {
            delete author[emailField]
        }
    }

    return author
}

/**
 * 批量处理作者隐私信息
 * @param items 包含作者信息的数组 (如 Post[] 或 Comment[])
 * @param isAdmin 是否为管理员
 * @param authorKey 作者字段名，默认为 'author'
 * @param emailField 邮箱字段名，默认为 'email'
 * @param hashField 哈希存储字段名，默认为 'emailHash'
 */
export async function processAuthorsPrivacy(
    items: any[],
    isAdmin: boolean,
    authorKey = 'author',
    emailField = 'email',
    hashField = 'emailHash',
) {
    if (!items || items.length === 0) { return items }

    for (const item of items) {
        const author = item[authorKey]
        if (author) {
            await processAuthorPrivacy(author, isAdmin, emailField, hashField)
        }
    }

    return items
}
