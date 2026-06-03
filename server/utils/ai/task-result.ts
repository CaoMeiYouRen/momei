export function parseTaskResultRecord(taskResult: string | null | undefined): Record<string, unknown> | null {
    if (!taskResult) {
        return null
    }

    try {
        const parsed = JSON.parse(taskResult) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return null
        }

        return parsed as Record<string, unknown>
    } catch {
        return null
    }
}
