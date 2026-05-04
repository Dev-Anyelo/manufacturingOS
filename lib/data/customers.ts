import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api/response"

export async function getCustomers() {
  await requireAuth()

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { sales: true, workOrders: true }
      }
    }
  })

  return customers
}

export async function getCustomer(id: string) {
  await requireAuth()

  return prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        orderBy: { saleDate: "desc" },
        take: 20,
        select: {
          id: true,
          saleDate: true,
          total: true,
          discount: true,
          status: true,
          channel: true,
          paymentMethod: true,
          balanceDue: true,
          totalCurrency: true,
        },
      },
      workOrders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          receivedDate: true,
          deliveryDate: true,
          status: true,
          total: true,
          balanceDue: true,
          totalCurrency: true,
          items: {
            select: { quantity: true },
          },
        },
      },
      _count: {
        select: { sales: true, workOrders: true },
      },
    },
  })
}
