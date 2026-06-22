type SaleBalanceInput = {
  total: number
  discount: number
  amountPaid: number
}

type SaleItemSubtotalInput = {
  unitPrice: number
  quantity: number
  discount: number
}

type RawSqlExecutor = {
  $executeRawUnsafe: (sql: string) => Promise<unknown>
}

export function calculateSaleBalanceDue({
  total,
  discount,
  amountPaid,
}: SaleBalanceInput) {
  return Math.max(total - discount - amountPaid, 0)
}

export function calculateSaleItemSubtotal({
  unitPrice,
  quantity,
  discount,
}: SaleItemSubtotalInput) {
  return unitPrice * quantity - discount
}

export async function repairNullSaleBalances(db: RawSqlExecutor) {
  return db.$executeRawUnsafe(`
    UPDATE public.sales
    SET balance_due = GREATEST(
      COALESCE(total, 0) - COALESCE(discount, 0) - COALESCE(amount_paid, 0),
      0
    )
    WHERE balance_due IS NULL
  `)
}

export async function repairNullSaleItemSubtotals(db: RawSqlExecutor) {
  return db.$executeRawUnsafe(`
    UPDATE public.sale_items
    SET subtotal = (COALESCE(unit_price, 0) * COALESCE(quantity, 0)) - COALESCE(discount, 0)
    WHERE subtotal IS NULL
  `)
}

export async function repairLegacySalesData(db: RawSqlExecutor) {
  await repairNullSaleBalances(db)
  await repairNullSaleItemSubtotals(db)
}
