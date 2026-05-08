import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useAttendance() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/attendance/today')
      if (!res.ok) throw new Error('Error fetching attendance')
      return res.json()
    }
  })

  const checkIn = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/attendance/check-in', { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error marking check-in')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] })
    }
  })

  const lunchStart = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/attendance/lunch-start', { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error marking lunch start')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] })
    }
  })

  const lunchEnd = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/attendance/lunch-end', { method: 'POST' })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error marking lunch end')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] })
    }
  })

  const checkOut = useMutation({
    mutationFn: async (reason?: string) => {
      const res = await fetch('/api/attendance/check-out', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw errorData // Throw full object to catch code 'REASON_REQUIRED'
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'today'] })
    }
  })

  return {
    data,
    isLoading,
    error,
    checkIn,
    lunchStart,
    lunchEnd,
    checkOut
  }
}
