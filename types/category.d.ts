export interface Category {
    id: string
    name: string
    slug: string
    description?: string | null
    parentId?: string | null
    parent?: Category | null
    language: string
    translationId?: string | null
    translations?: Array<{
        id: string
        language: string
        name: string
        slug: string
    }>
}
