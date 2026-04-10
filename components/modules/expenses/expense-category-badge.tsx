import { Badge } from "@/components/ui/badge"
import { EXPENSE_CATEGORIES } from "@/types"

interface ExpenseCategoryBadgeProps {
  category: keyof typeof EXPENSE_CATEGORIES | string
}

export function ExpenseCategoryBadge({ category }: ExpenseCategoryBadgeProps) {
  const label =
    EXPENSE_CATEGORIES[category as keyof typeof EXPENSE_CATEGORIES] ?? category

  return <Badge className="status-subtle">{label}</Badge>
}
