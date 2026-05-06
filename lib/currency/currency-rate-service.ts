import { prisma } from "@/lib/prisma"
import { Prisma, Currency } from "@prisma/client"

export interface RateLookupResult {
  rate: Prisma.Decimal
  from: Currency
  to: Currency
  asOfDate: Date
  isInverse: boolean
}

/**
 * CurrencyRateService: Unified source of truth for FX rates
 * - Server: queries Prisma for exact/inverse pairs
 * - Client: fetches pre-normalized rate table, no hardcoded fallbacks
 */
export class CurrencyRateService {
  /**
   * Resolves exchange rate for a given pair and date
   * @throws Error if rate not found (no fallback)
   */
  static async getRate(
    fromCurrency: Currency,
    toCurrency: Currency,
    onDate: Date = new Date()
  ): Promise<RateLookupResult> {
    // Identity: same currency = 1
    if (fromCurrency === toCurrency) {
      return {
        rate: new Prisma.Decimal(1),
        from: fromCurrency,
        to: toCurrency,
        asOfDate: onDate,
        isInverse: false,
      }
    }

    // Exact pair lookup
    const exactRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        validFrom: { lte: onDate },
        OR: [{ validTo: null }, { validTo: { gte: onDate } }],
      },
      orderBy: { validFrom: "desc" },
    })

    if (exactRate) {
      return {
        rate: exactRate.rate,
        from: fromCurrency,
        to: toCurrency,
        asOfDate: onDate,
        isInverse: false,
      }
    }

    // Inverse pair lookup
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
      return {
        rate: new Prisma.Decimal(1).div(inverseRate.rate),
        from: fromCurrency,
        to: toCurrency,
        asOfDate: onDate,
        isInverse: true,
      }
    }

    // No rate found - log and throw
    const dateStr = onDate.toISOString().split("T")[0]
    console.error(
      `[CurrencyRateService] Rate not found: ${fromCurrency} → ${toCurrency} @ ${dateStr}`
    )

    throw new Error(
      `Exchange rate not available: ${fromCurrency} → ${toCurrency} on ${dateStr}. ` +
        `Please ensure the rate is configured in the database.`
    )
  }

  /**
   * Converts amount between currencies
   * @throws Error if rate not found
   */
  static async convert(
    amount: Prisma.Decimal | number,
    fromCurrency: Currency,
    toCurrency: Currency,
    onDate: Date = new Date()
  ): Promise<Prisma.Decimal> {
    const decimalAmount = new Prisma.Decimal(amount)
    if (fromCurrency === toCurrency) return decimalAmount

    const result = await this.getRate(fromCurrency, toCurrency, onDate)
    return decimalAmount.times(result.rate)
  }

  /**
   * Batch fetch normalized rates for client components
   * Returns a map: "FROM_TO" -> rate value
   */
  static async fetchNormalizedRates(
    pairs: Array<{ from: Currency; to: Currency }>,
    onDate: Date = new Date()
  ): Promise<Record<string, number>> {
    const rates: Record<string, number> = {}

    // Prepare deduped queries
    const uniquePairs = Array.from(
      new Map(pairs.map((p) => [`${p.from}_${p.to}`, p])).values()
    )

    // Query all pairs in parallel
    const results = await Promise.allSettled(
      uniquePairs.map((pair) =>
        this.getRate(pair.from, pair.to, onDate).then((result) => ({
          key: `${pair.from}_${pair.to}`,
          rate: parseFloat(result.rate.toString()),
        }))
      )
    )

    // Collect successful results, skip failures (logging handled in getRate)
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        rates[result.value.key] = result.value.rate
      }
    })

    return rates
  }

  /**
   * Client-side conversion using pre-fetched rate table
   * Safer than hardcoded fallback; throws if rate missing
   */
  static convertClient(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    rateMap: Record<string, number>
  ): number | null {
    if (fromCurrency === toCurrency) return amount

    const key = `${fromCurrency}_${toCurrency}`
    const rate = rateMap[key]

    if (!rate) {
      console.warn(
        `[CurrencyRateService.convertClient] Rate missing: ${key}. Returning null.`
      )
      return null
    }

    return amount * rate
  }
}
