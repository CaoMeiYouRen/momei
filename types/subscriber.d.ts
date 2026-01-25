export interface Subscriber {
    id: string
    email: string
    isActive: boolean
    language: string
    userId: string | null
    createdAt: string
    user?: {
        name?: string | null
        email: string
        image?: string | null
    } | null
}

