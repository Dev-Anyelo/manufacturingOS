import { format, differenceInMinutes, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const TIMEZONE = 'America/Managua'

export function getNowZoned() {
  return toZonedTime(new Date(), TIMEZONE)
}

export function getTodayDateString() {
  return format(getNowZoned(), 'yyyy-MM-dd')
}

// Convert "HH:mm" to a Date object on the current day in Managua timezone
export function parseScheduleTime(timeString: string, baseDate: Date = getNowZoned()): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date
}

export function calculateLateMinutes(actual: Date, expectedTimeStr: string, tolerance: number): number {
  const expected = parseScheduleTime(expectedTimeStr, actual)
  const diff = differenceInMinutes(actual, expected)
  return diff > tolerance ? diff : 0
}

export function calculateEarlyExitMinutes(actual: Date, expectedTimeStr: string): number {
  const expected = parseScheduleTime(expectedTimeStr, actual)
  const diff = differenceInMinutes(expected, actual)
  return diff > 0 ? diff : 0
}

export function calculateLunchOvertime(start: Date, end: Date, expectedStartStr: string | null, expectedEndStr: string | null): number {
  if (!expectedStartStr || !expectedEndStr) return 0
  const expectedStart = parseScheduleTime(expectedStartStr, start)
  const expectedEnd = parseScheduleTime(expectedEndStr, start)
  
  const expectedDuration = differenceInMinutes(expectedEnd, expectedStart)
  const actualDuration = differenceInMinutes(end, start)
  
  const diff = actualDuration - expectedDuration
  return diff > 15 ? diff : 0 // 15 mins tolerance for lunch
}
