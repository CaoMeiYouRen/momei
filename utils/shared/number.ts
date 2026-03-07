import { toNumber } from '@/utils/shared/coerce'

export const roundTo = (value: number, digits = 2): number => {
    return Number(value.toFixed(digits))
}

export const formatDecimal = (value: unknown, digits = 2): string => {
    return toNumber(value).toFixed(digits)
}

export const formatCurrency = (value: unknown, digits = 4, symbol = '$'): string => {
    return `${symbol}${formatDecimal(value, digits)}`
}
