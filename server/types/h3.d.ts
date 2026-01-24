import type { auth } from '@/lib/auth'

declare module 'h3' {
    interface H3EventContext {
        auth?: typeof auth.$Infer.Session | null
        user?: typeof auth.$Infer.User | null
    }
}

export {}
