export const cloneJsonValue = <T>(value: T): T => {
    if (value === null || value === undefined) {
        return value
    }

    return JSON.parse(JSON.stringify(value)) as T
}
