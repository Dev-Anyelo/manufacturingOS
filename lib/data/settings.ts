import { prisma } from "@/lib/prisma"
import { Currency } from "@prisma/client"

export async function getSystemSettings() {
  let settings = await prisma.systemSetting.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  })

  if (!settings) {
    settings = await prisma.systemSetting.create({
      data: {
        baseCurrency: Currency.USD,
        displayCurrency: Currency.USD,
        timezone: "America/Managua",
        locale: "es-NI",
      },
    })
  }

  return settings
}
