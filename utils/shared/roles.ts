export enum UserRole {
    ADMIN = 'admin',
    AUTHOR = 'author',
    USER = 'user',
    VISITOR = 'visitor',
}

/**
 * 校验用户是否具有指定权限
 * @param userRole 用户拥有的角色（可能是逗号分隔的字符串）
 * @param requiredRoles 需要的角色列表
 */
export function hasRole(userRole: string | null | undefined, requiredRoles: string | string[]) {
    if (!userRole) {
        return false
    }
    const userRoles = userRole.split(',').map((r) => r.trim())
    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    return rolesToCheck.some((role) => userRoles.includes(role))
}

/**
 * 校验用户是否为 Admin
 * @param role 用户角色
 */
export function isAdmin(role: string | null | undefined) {
    return hasRole(role, UserRole.ADMIN)
}

/**
 * 校验用户是否为 Author
 * @param role 用户角色
 */
export function isAuthor(role: string | null | undefined) {
    return hasRole(role, UserRole.AUTHOR)
}

/**
 * 校验用户是否为 Admin 或 Author
 * @param role 用户角色
 */
export function isAdminOrAuthor(role: string | null | undefined) {
    return hasRole(role, [UserRole.ADMIN, UserRole.AUTHOR])
}
