export interface WechatSyncRawAccount {
    id?: string | number | null
    type?: string | number | null
    title?: string | null
    displayName?: string | null
    icon?: string | null
    avatar?: string | null
    uid?: string | null
    home?: string | null
    supportTypes?: string[] | null
    checked?: boolean
}

export interface WechatSyncAccount {
    id: string
    type: string
    title: string
    displayName?: string
    icon?: string
    avatar?: string
    uid?: string
    home?: string
    supportTypes?: string[]
    checked: boolean
}

export interface WechatSyncTaskAccount {
    id?: string | null
    type?: string | null
    title: string
    status: 'pending' | 'uploading' | 'done' | 'failed'
    msg?: string
    error?: string
    icon?: string
    editResp?: {
        draftLink?: string
    }
}

export interface WechatSyncTaskStatus {
    accounts?: WechatSyncTaskAccount[]
}

export interface WechatSyncCompletionAccount {
    id: string
    title: string
    status: 'uploading' | 'done' | 'failed'
    msg?: string
    error?: string
    draftLink?: string
}

function normalizeWechatSyncToken(value: unknown) {
    if (value === null || value === undefined) {
        return null
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
        return null
    }

    const normalizedValue = String(value).trim()
    return normalizedValue || null
}

export function resolveWechatSyncAccountKey(account: Pick<WechatSyncRawAccount, 'id' | 'type' | 'title'>) {
    return normalizeWechatSyncToken(account.id)
        || normalizeWechatSyncToken(account.type)
        || account.title?.trim()
        || 'unknown'
}

export function normalizeWechatSyncAccount(account: WechatSyncRawAccount, checked = false): WechatSyncAccount | null {
    const type = normalizeWechatSyncToken(account.type) || normalizeWechatSyncToken(account.id)
    if (!type) {
        return null
    }

    const id = normalizeWechatSyncToken(account.id) || type
    const title = account.title?.trim() || account.displayName?.trim() || type

    return {
        id,
        type,
        title,
        displayName: account.displayName?.trim() || undefined,
        icon: account.icon || undefined,
        avatar: account.avatar || undefined,
        uid: account.uid?.trim() || undefined,
        home: account.home?.trim() || undefined,
        supportTypes: Array.isArray(account.supportTypes)
            ? account.supportTypes.filter((supportType) => Boolean(supportType?.trim()))
            : undefined,
        checked,
    }
}

export function normalizeWechatSyncAccounts(
    accounts: readonly WechatSyncRawAccount[],
    previousAccounts: readonly WechatSyncAccount[] = [],
) {
    const checkedTypes = new Set(
        previousAccounts
            .filter((account) => account.checked)
            .map((account) => account.type),
    )

    return accounts.reduce<WechatSyncAccount[]>((normalizedAccounts, account) => {
        const type = normalizeWechatSyncToken(account.type) || normalizeWechatSyncToken(account.id)
        const normalizedAccount = normalizeWechatSyncAccount(account, Boolean(type && checkedTypes.has(type)))
        if (normalizedAccount) {
            normalizedAccounts.push(normalizedAccount)
        }
        return normalizedAccounts
    }, [])
}

function findMatchingWechatSyncAccount(
    taskAccount: WechatSyncTaskAccount,
    selectedAccounts: readonly WechatSyncAccount[],
) {
    const taskToken = normalizeWechatSyncToken(taskAccount.type) || normalizeWechatSyncToken(taskAccount.id)
    if (taskToken) {
        return selectedAccounts.find((account) => account.type === taskToken || account.id === taskToken) || null
    }

    return selectedAccounts.find((account) => account.title === taskAccount.title) || null
}

export function mapWechatSyncTaskAccountsForCompletion(
    taskAccounts: readonly WechatSyncTaskAccount[],
    selectedAccounts: readonly WechatSyncAccount[],
) {
    return taskAccounts.map<WechatSyncCompletionAccount>((taskAccount) => {
        const matchedAccount = findMatchingWechatSyncAccount(taskAccount, selectedAccounts)

        return {
            id: normalizeWechatSyncToken(taskAccount.id)
                || normalizeWechatSyncToken(taskAccount.type)
                || matchedAccount?.id
                || matchedAccount?.type
                || taskAccount.title,
            title: taskAccount.title,
            status: taskAccount.status === 'pending' ? 'uploading' : taskAccount.status,
            msg: taskAccount.msg,
            error: taskAccount.error,
            draftLink: taskAccount.editResp?.draftLink,
        }
    })
}

export function buildWechatSyncFailureResults(
    selectedAccounts: readonly WechatSyncAccount[],
    errorMessage: string,
) {
    const normalizedErrorMessage = errorMessage.trim() || 'WechatSync task failed to start'

    return selectedAccounts.map<WechatSyncCompletionAccount>((account) => ({
        id: account.id || account.type,
        title: account.title,
        status: 'failed',
        error: normalizedErrorMessage,
    }))
}
