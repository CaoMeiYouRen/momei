export function slugifyMarkdownHeading(value: string) {
    return value.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-')
}
