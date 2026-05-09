import { format, differenceInMinutes } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export const TIMEZONE = 'America/Managua'

export function getNowZoned() {
  return toZonedTime(new Date(), TIMEZONE)
}

export function getTodayDateString() {
  return format(getNowZoned(), 'yyyy-MM-dd')
}

export function formatZonedTime(date: Date | string | null, formatStr: string = "hh:mm a"): string {
  if (!date) return "—"
  const d = typeof date === 'string' ? new Date(date) : date
  const zoned = toZonedTime(d, TIMEZONE)
  return format(zoned, formatStr)
}

/**
 * Convierte "HH:mm" (hora Nicaragua) + una fecha de referencia (UTC) 
 * en un Date UTC equivalente
 */
export function parseScheduleTime(timeStr: string, referenceUtcDate: Date = new Date()): Date {
  // Obtener la fecha en Nicaragua
  const zonedRef = toZonedTime(referenceUtcDate, TIMEZONE)
  const dateStr = format(zonedRef, "yyyy-MM-dd") // "2026-05-08"
  // Construir "2026-05-08T07:00:00" como si fuera hora Nicaragua y convertir a UTC
  return fromZonedTime(new Date(`${dateStr}T${timeStr}:00`), TIMEZONE)
}

export function calculateLateMinutes(
  checkInAt: Date,        // UTC timestamp del check-in real
  expectedCheckIn: string, // "HH:mm" en hora Nicaragua
  toleranceMinutes: number
): number {
  const expectedUtc = parseScheduleTime(expectedCheckIn, checkInAt)
  const diffMs = checkInAt.getTime() - expectedUtc.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  return Math.max(0, diffMinutes - toleranceMinutes)
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

