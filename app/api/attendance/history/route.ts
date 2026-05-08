import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // format: YYYY-MM
    
    let startDate: Date
    let endDate: Date

    if (month) {
      const [year, m] = month.split('-').map(Number)
      startDate = new Date(year, m - 1, 1)
      endDate = new Date(year, m, 0) // last day of month
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    const employee = await prisma.employee.findUnique({
      where: { profileId: user.id }
    })

    if (!employee) {
      return NextResponse.json({ error: 'No employee profile linked to this user' }, { status: 403 })
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ data: records })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
