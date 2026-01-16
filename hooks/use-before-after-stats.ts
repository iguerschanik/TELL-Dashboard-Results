"use client"

import { useMemo } from "react"
import type { TellRecord } from "@/types/tell-record"

export interface BeforeAfterStats {
  n_before: number
  n_after: number
  avg_before: number | null
  avg_after: number | null
  delta_abs: number | null
  delta_pct: number | null
}

export function useComposite1BeforeAfterStats(
  filteredRecords: TellRecord[],
  eventDate: string | null,
): BeforeAfterStats | null {
  return useMemo(() => {
    // If no event date is selected, return null
    if (!eventDate) {
      return null
    }

    // Split records into before and after groups
    const beforeRecords: TellRecord[] = []
    const afterRecords: TellRecord[] = []

    filteredRecords.forEach((record) => {
      if (!record.test_date || typeof record.test_date !== "string") {
        return
      }

      const recordDate = record.test_date.slice(0, 10) // Get YYYY-MM-DD

      if (recordDate < eventDate) {
        beforeRecords.push(record)
      } else {
        afterRecords.push(record)
      }
    })

    const n_before = beforeRecords.length
    const n_after = afterRecords.length

    let avg_before: number | null = null
    if (n_before > 0) {
      const sum_before = beforeRecords.reduce((sum, r) => sum + (r.composite_1 || 0), 0)
      avg_before = sum_before / n_before
    }

    let avg_after: number | null = null
    if (n_after > 0) {
      const sum_after = afterRecords.reduce((sum, r) => sum + (r.composite_1 || 0), 0)
      avg_after = sum_after / n_after
    }

    // Calculate deltas only if both averages are available
    let delta_abs: number | null = null
    let delta_pct: number | null = null

    if (avg_before !== null && avg_after !== null) {
      delta_abs = avg_after - avg_before

      // Avoid division by zero
      if (avg_before !== 0) {
        delta_pct = (delta_abs / avg_before) * 100
      }
    }

    return {
      n_before,
      n_after,
      avg_before,
      avg_after,
      delta_abs,
      delta_pct,
    }
  }, [filteredRecords, eventDate])
}

// Maintain backward compatibility with old name
export const useBeforeAfterStats = useComposite1BeforeAfterStats
