import { Prisma } from "@prisma/client"

export function toPrismaDecimal(value: number | string | Prisma.Decimal) {
  return new Prisma.Decimal(value)
}

export function decimalToNumber(
  value: Prisma.Decimal | number | null | undefined
) {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === "number") {
    return value
  }

  return Number(value)
}

export function getSearchParam(
  params: URLSearchParams,
  key: string
): string | undefined {
  const value = params.get(key)?.trim()
  return value ? value : undefined
}

export function parseDateParam(value?: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date
}

/**
 * Normaliza una fecha del formulario (string YYYY-MM-DD o Date) a mediodia local
 * para evitar desfases al serializar/guardar en columnas tipo date.
 */
export function toLocalDate(value: string | Date) {
  if (typeof value === "string") {
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0)
  }

  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    12,
    0,
    0
  )
}

export function getFileExtension(filename: string) {
  const lastDot = filename.lastIndexOf(".")

  if (lastDot === -1) {
    return "bin"
  }

  return filename.slice(lastDot + 1)
}
