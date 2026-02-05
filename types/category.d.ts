export interface Category {
    id: string
    name: string
    slug: string
    description?: string | null
    parentId?: string | null
    parent?: Category | null
    language: string
    translationId?: string | null
    translations?: {
        id: string
        language: string
        translationId: string | null
        name: string
        slug: string
    }[]
}
