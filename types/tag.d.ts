export interface Tag {
    id: string
    name: string
    slug: string
    language: string
    translationId?: string | null
    translations?: {
        id: string
        language: string
        name: string
        slug: string
    }[]
}
