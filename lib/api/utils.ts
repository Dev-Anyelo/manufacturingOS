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

export function getFileExtension(filename: string) {
  const lastDot = filename.lastIndexOf(".")

  if (lastDot === -1) {
    return "bin"
  }

  return filename.slice(lastDot + 1)
}
