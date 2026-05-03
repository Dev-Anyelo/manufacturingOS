import { Prisma, Currency } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Obtiene la tasa de cambio válida en una fecha específica
 */
export async function getExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  onDate: Date = new Date()
): Promise<Prisma.Decimal> {
  if (fromCurrency === toCurrency) {
    return new Prisma.Decimal(1)
  }

  const rate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency,
      toCurrency,
      validFrom: { lte: onDate },
      OR: [{ validTo: null }, { validTo: { gte: onDate } }],
    },
    orderBy: { validFrom: "desc" },
  })

  if (!rate) {
    // Si no hay tasa para el par exacto, intentar la inversa
    const inverseRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: toCurrency,
        toCurrency: fromCurrency,
        validFrom: { lte: onDate },
        OR: [{ validTo: null }, { validTo: { gte: onDate } }],
      },
      orderBy: { validFrom: "desc" },
    })

    if (inverseRate) {
      return new Prisma.Decimal(1).div(inverseRate.rate)
    }

    throw new Error(
      `No se encontró tasa de cambio de ${fromCurrency} a ${toCurrency} para la fecha ${
        onDate.toISOString().split("T")[0]
      }`
    )
  }

  return rate.rate
}

/**
 * Convierte un monto de una moneda a otra
 */
export async function convertCurrency(
  amount: Prisma.Decimal | number,
  fromCurrency: Currency,
  toCurrency: Currency,
  onDate: Date = new Date()
): Promise<Prisma.Decimal> {
  const decimalAmount = new Prisma.Decimal(amount)
  if (fromCurrency === toCurrency) return decimalAmount

  const rate = await getExchangeRate(fromCurrency, toCurrency, onDate)
  return decimalAmount.times(rate)
}

/**
 * Convierte un monto de forma sincrónica (Client Components)
 * @param rate Tasa de cambio (opcional, si no se provee usa 36.62 temporalmente)
 */
export function convertAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rate: number = 36.62 // TODO: Obtener del estado global/Zustand en el componente que lo usa
): number {
  if (fromCurrency === toCurrency) return amount

  if (fromCurrency === Currency.USD && toCurrency === Currency.NIO) {
    return amount * rate
  }

  if (fromCurrency === Currency.NIO && toCurrency === Currency.USD) {
    return amount / rate
  }

  return amount
}

/**
 * Calcula el saldo pendiente (balance_due) considerando monedas mixtas
 * @param total Monto total
 * @param totalCurrency Moneda del total
 * @param advance Adelanto pagado
 * @param advanceCurrency Moneda del adelanto
 * @param rate Tasa de cambio para conversión
 */
export function calculateBalanceDue(
  total: number,
  totalCurrency: Currency,
  advance: number,
  advanceCurrency: Currency,
  rate: number = 36.62
): number {
  const convertedAdvance = convertAmount(advance, advanceCurrency, totalCurrency, rate)
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
 * Formatea una fecha con locale es-NI (estándar nicaragüense)
 */
export function formatDateNI(
  date: Date | string,
  format: "short" | "long" = "short"
): string {
  const parsed = typeof date === "string" ? new Date(date) : date
  if (isNaN(parsed.getTime())) return "Fecha inválida"

  return new Intl.DateTimeFormat("es-NI", {
    year: "numeric",
    month: format === "long" ? "long" : "2-digit",
    day: "2-digit",
  }).format(parsed)
}

/**
 * Formatea hora en formato es-NI
 */
export function formatTimeNI(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date
  if (isNaN(parsed.getTime())) return "Hora inválida"

  return new Intl.DateTimeFormat("es-NI", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed)
}

/**
 * Formatea fecha y hora en formato es-NI
 */
export function formatDateTimeNI(date: Date | string): string {
  const parsed = typeof date === "string" ? new Date(date) : date
  if (isNaN(parsed.getTime())) return "Fecha/Hora inválida"

  return `${formatDateNI(parsed)} ${formatTimeNI(parsed)}`
}

/**
 * Formatea un rango de fechas para períodos (ej. nómina) en es-NI
 */
export function formatDateRangeNI(startDate: Date | string, endDate: Date | string): string {
  const start = formatDateNI(startDate, "long")
  const end = formatDateNI(endDate, "long")
  return `${start} - ${end}`
}
