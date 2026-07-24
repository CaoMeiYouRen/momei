/**
 * Date conversion utilities for campaign and other date fields.
 *
 * Two variants to handle different partial-update semantics:
 * - `toDateOrNull` treats `undefined`/`null`/empty string all as `null`
 * - `toDateOrUndefined` preserves `undefined` (meaning "don't update"),
 *   while treating `null`/empty string as explicit `null` (meaning "clear the field")
 */

/**
 * Convert a string, Date, or null/undefined value to Date | null.
 * Treats all falsy values (undefined, null, '') as null.
 * Invalid date strings also result in null.
 */
export function toDateOrNull(value?: string | Date | null): Date | null {
    if (!value) {
        return null
    }

    if (value instanceof Date) {
        return value
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Convert a string, Date, or null/undefined value to Date | null | undefined.
 * Preserves `undefined` to mean "don't update this field".
 * Treats `null`/empty string as explicit `null` to mean "clear the field".
 * Invalid date strings also result in null.
 */
export function toDateOrUndefined(value?: string | Date | null): Date | null | undefined {
    if (value === undefined) {
        return undefined
    }

    if (value === null || value === '') {
        return null
    }

    if (value instanceof Date) {
        return value
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}
