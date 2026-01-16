import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to dd/MM/yyyy format
 * @param date - Date object or string in YYYY-MM-DD format
 * @returns Formatted date string as dd/MM/yyyy
 */
export function formatDateToDDMMYYYY(date: Date | string): string {
  if (typeof date === "string") {
    // If the string is in YYYY-MM-DD format, parse it directly without Date conversion
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, year, month, day] = match
      return `${day}/${month}/${year}`
    }
    // Fallback for other string formats (shouldn't happen in this app)
    const dateObj = new Date(date)
    const day = String(dateObj.getUTCDate()).padStart(2, "0")
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const year = dateObj.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  // For Date objects, use UTC methods to avoid timezone shifts
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const year = date.getUTCFullYear()

  return `${day}/${month}/${year}`
}
