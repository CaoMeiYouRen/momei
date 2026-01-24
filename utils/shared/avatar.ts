/**
 * 生成 Gravatar 头像 URL
 * @param identifier 邮箱或哈希值
 * @param size 分辨率
 * @param defaultImage 默认头像类型 (mp, identicon, monsterid, wavatar, retro, robohash, blank)
 */
export function getGravatarUrl(identifier: string, size = 120, defaultImage = 'mp') {
    const baseUrl = 'https://0.gravatar.com/avatar/'
    // 如果 identifier 是邮箱，通常需要先哈希。但由于 hashing 是异步的，
    // 这里建议传入已经哈希好的字符串，或者在外部处理。
    // 如果看起来不像哈希值（没有邮箱的特征），直接拼接。
    const cleanIdentifier = identifier.trim().toLowerCase()

    // 如果包含 @，说明是原始邮箱，这里提供一个同步的回退方案或者提示
    // 不过更好的做法是在组件内先异步计算好哈希再传进来
    return `${baseUrl}${cleanIdentifier}?s=${size}&d=${defaultImage}`
}
