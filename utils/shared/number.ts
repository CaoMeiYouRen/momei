import { toNumber } from '@/utils/shared/coerce'

export const roundTo = (value: number, digits = 2): number => Number(value.toFixed(digits))

export const formatDecimal = (value: unknown, digits = 2): string => toNumber(value).toFixed(digits)

export const formatCurrency = (value: unknown, digits = 4, symbol = '$'): string => `${symbol}${formatDecimal(value, digits)}`
