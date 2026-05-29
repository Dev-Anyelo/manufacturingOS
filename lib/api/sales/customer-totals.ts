import { Currency, Prisma, SaleStatus } from "@prisma/client"

import { convertCurrency } from "@/lib/currency/exchange"

type CustomerTotalsTx = Prisma.TransactionClient

async function getBaseCurrency(tx: CustomerTotalsTx): Promise<Currency> {
  const settings = await tx.systemSetting.findFirst({
    select: { baseCurrency: true },
  })

  return settings?.baseCurrency ?? Currency.USD
}

export async function recalculateCustomerTotalPurchases(
  tx: CustomerTotalsTx,
  customerId: string
) {
  const customer = await tx.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  })

  if (!customer) {
    return null
  }

  const baseCurrency = await getBaseCurrency(tx)

  const sales = await tx.sale.findMany({
    where: {
      customerId,
      status: { not: SaleStatus.cancelled },
    },
    select: {
      total: true,
      totalCurrency: true,
      saleDate: true,
    },
  })

  let totalPurchases = new Prisma.Decimal(0)

  for (const sale of sales) {
    const convertedTotal = await convertCurrency(
      sale.total,
      sale.totalCurrency,
      baseCurrency,
      sale.saleDate
    )

    totalPurchases = totalPurchases.add(convertedTotal)
  }

  await tx.customer.update({
    where: { id: customerId },
    data: {
      totalPurchases,
      totalPurchasesCurrency: baseCurrency,
    },
  })

  return {
    totalPurchases,
    totalPurchasesCurrency: baseCurrency,
    saleCount: sales.length,
  }
}
