import { es } from "date-fns/locale"
import { parseISO, isValid } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Prisma, Currency } from "@prisma/client"
import { CurrencyRateService } from "./currency-rate-service"

export { CurrencyRateService }

const DEFAULT_TIMEZONE = "America/Managua"
const DEFAULT_LOCALE = es
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function normalizeDateOnlyValue(date: Date | string | number): Date {
  if (date instanceof Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)
    )
  }

  if (typeof date === "string") {
    const trimmed = date.trim()
    const match = DATE_ONLY_PATTERN.exec(trimmed)
    if (match) {
      const year = Number(match[1])
      const month = Number(match[2]) - 1
      const day = Number(match[3])
      return new Date(Date.UTC(year, month, day, 12))
    }

    const parsed = parseISO(trimmed)
    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        12
      )
    )
  }

  const parsed = new Date(date)
  return new Date(
    Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate(),
      12
    )
  )
}

export function normalizeDateOnly(
  date: Date | string | number | null | undefined
): Date | null {
  if (!date) return null
  return normalizeDateOnlyValue(date)
}

/**
 * Formats a date-only value to es-NI standard (dd/MM/yyyy) in America/Managua.
 */
export function formatDateOnlyNI(
  date: Date | string | number | null | undefined,
  formatStr: string = "dd/MM/yyyy"
): string {
  if (!date) return "N/A"
  try {
    const normalized = normalizeDateOnlyValue(date)
    if (!isValid(normalized)) return "Fecha inválida"
    return formatInTimeZone(normalized, DEFAULT_TIMEZONE, formatStr, {
      locale: DEFAULT_LOCALE,
    })
  } catch (error) {
    return "Error fecha"
  }
}

/**
 * Formats a date to es-NI standard (dd/MM/yyyy) in America/Managua timezone.
 */
export function formatDateNI(
  date: Date | string | number | null | undefined,
  formatStr: string = "dd/MM/yyyy"
): string {
  if (!date) return "N/A"
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date)
    if (!isValid(d)) return "Fecha inválida"
    return formatInTimeZone(d, DEFAULT_TIMEZONE, formatStr, {
      locale: DEFAULT_LOCALE,
    })
  } catch (error) {
    return "Error fecha"
  }
}

/**
 * Formats a time to es-NI standard (hh:mm a) in America/Managua timezone.
 */
export function formatTimeNI(
  date: Date | string | number | null | undefined
): string {
  if (!date) return "N/A"
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date)
    if (!isValid(d)) return "Hora inválida"
    return formatInTimeZone(d, DEFAULT_TIMEZONE, "hh:mm a", {
      locale: DEFAULT_LOCALE,
    })
  } catch (error) {
    return "Error hora"
  }
}

/**
 * Formats a date and time to es-NI standard (dd/MM/yyyy hh:mm a) in America/Managua timezone.
 */
export function formatDateTimeNI(
  date: Date | string | number | null | undefined
): string {
  if (!date) return "N/A"
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date)
    if (!isValid(d)) return "Fecha/hora inválida"
    return formatInTimeZone(d, DEFAULT_TIMEZONE, "dd/MM/yyyy hh:mm a", {
      locale: DEFAULT_LOCALE,
    })
  } catch (error) {
    return "Error fecha/hora"
  }
}

/**
 * Obtiene la tasa de cambio válida en una fecha específica
 * Delegator to CurrencyRateService
 */
export async function getExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  onDate: Date = new Date()
): Promise<Prisma.Decimal> {
  const result = await CurrencyRateService.getRate(
    fromCurrency,
    toCurrency,
    onDate
  )
  return result.rate
}

/**
 * Convierte un monto de una moneda a otra
 * Delegator to CurrencyRateService
 */
export async function convertCurrency(
  amount: Prisma.Decimal | number,
  fromCurrency: Currency,
  toCurrency: Currency,
  onDate: Date = new Date()
): Promise<Prisma.Decimal> {
  return CurrencyRateService.convert(amount, fromCurrency, toCurrency, onDate)
}

/**
 * Client-side currency conversion using pre-fetched rate map
 * Safe: no hardcoded fallback; throws if rate missing
 *
 * Usage:
 *   const rates = await CurrencyRateService.fetchNormalizedRates([
 *     { from: Currency.USD, to: Currency.NIO },
 *   ])
 *   const result = convertAmount(100, Currency.USD, Currency.NIO, rates)
 *
 * @param rateMap Pre-fetched normalized rate map from CurrencyRateService.fetchNormalizedRates
 * @returns Converted amount or null if rate unavailable (will log warning)
 */
export function convertAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rateMap: Record<string, number>
): number | null {
  return CurrencyRateService.convertClient(
    amount,
    fromCurrency,
    toCurrency,
    rateMap
  )
}

/**
 * Calcula el saldo pendiente (balance_due) considerando monedas mixtas
 *
 * @param total Monto total
 * @param totalCurrency Moneda del total
 * @param advance Adelanto pagado
 * @param advanceCurrency Moneda del adelanto
 * @param rateMap Pre-fetched normalized rate map from CurrencyRateService.fetchNormalizedRates
 * @returns Balance due in totalCurrency, or null if conversion fails
 */
export function calculateBalanceDue(
  total: number,
  totalCurrency: Currency,
  advance: number,
  advanceCurrency: Currency,
  rateMap: Record<string, number>
): number | null {
  const convertedAdvance = convertAmount(
    advance,
    advanceCurrency,
    totalCurrency,
    rateMap
  )

  if (convertedAdvance === null) return null

  return Math.max(total - convertedAdvance, 0)
}

/**
 * Formatea un monto con símbolo de moneda — LOCALE es-NI
 */
export function formatCurrencyNI(
  amount: Prisma.Decimal | number,
  currency: Currency | string
): string {
  const numericAmount =
    typeof amount === "number" ? amount : parseFloat(amount.toString())

  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "NIO",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

/**
 * Obtiene el símbolo de moneda para visualización rápida
 */
export function getCurrencySymbol(currency: Currency | string): string {
  return currency === "USD" ? "$" : "C$"
}

/**
 * Formats a date range for periods (e.g. payroll) in es-NI
 */
export function formatDateRangeNI(
  startDate: Date | string,
  endDate: Date | string
): string {
  const start = formatDateOnlyNI(startDate, "dd 'de' MMMM, yyyy")
  const end = formatDateOnlyNI(endDate, "dd 'de' MMMM, yyyy")
  return `${start} - ${end}`
}
