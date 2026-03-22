/**
 * Format hour (0-23) to display string like "9 AM", "2 PM"
 */
export function formatHour(hour) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

/**
 * Format a Date to YYYY-MM-DD string (local time)
 */
export function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse a YYYY-MM-DD string to a local Date
 */
export function fromDateString(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Add days to a Date
 */
export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/**
 * Parse "HH:MM" time string to hour integer
 */
export function timeToHour(timeStr) {
  if (!timeStr) return 0
  return parseInt(timeStr.split(':')[0], 10)
}

/**
 * Format today date for display: "Monday, March 17"
 */
export function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

/**
 * Get day-of-week as 1=Mon…7=Sun (ISO-like)
 */
export function getDayOfWeek(date) {
  const d = date.getDay() // 0=Sun
  return d === 0 ? 7 : d
}

/**
 * Check if a date is a workday given workdays array (1=Mon…7=Sun)
 */
export function isWorkday(date, workdays = [1, 2, 3, 4, 5]) {
  return workdays.includes(getDayOfWeek(date))
}

/**
 * Get Monday-Sunday date strings for the week containing `date`
 */
export function getWeekDates(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return toDateString(dd)
  })
}
