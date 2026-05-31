export type ManagedUserRole = 'admin' | 'author' | 'user'

export interface ManagedUser {
    id: string
    name?: string | null
}

export interface ManagedUserWithRole extends ManagedUser {
    role: ManagedUserRole
}
