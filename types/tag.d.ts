export interface Tag {
    id: string
    name: string
    slug: string
    postCount?: number
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
