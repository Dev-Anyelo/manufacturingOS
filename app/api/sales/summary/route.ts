import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

export async function GET() {
  try {
    await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        total: true,
        discount: true,
        channel: true,
        paymentMethod: true,
      },
    })

    const summary = sales.reduce(
      (acc, sale) => {
        const net = decimalToNumber(sale.total) - decimalToNumber(sale.discount)

        acc.total_sales += 1
        acc.total_amount += net
        acc.by_channel[sale.channel] = (acc.by_channel[sale.channel] ?? 0) + net
        acc.by_payment_method[sale.paymentMethod] =
          (acc.by_payment_method[sale.paymentMethod] ?? 0) + net

        return acc
      },
      {
        total_sales: 0,
        total_amount: 0,
        by_channel: {} as Record<string, number>,
        by_payment_method: {} as Record<string, number>,
      }
    )

    return apiSuccess(summary)
  } catch (error) {
    return handleApiError(error)
  }
}
