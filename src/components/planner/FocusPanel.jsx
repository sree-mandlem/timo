import { useEffect, useState } from 'react'
import { formatHour, formatDisplayDate, timeToHour, isWorkday, toDateString } from '../../lib/dateUtils'
import HourSlot from './HourSlot'
import { CheckCircle2, MoveRight, Archive } from 'lucide-react'
import { TAGS } from './TaskItem'

export default function FocusPanel({ dateStr, date, tasksForDate, weeklyTasks = [], settings, settingsId }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const currentHour = now.getHours()
  const todayStr = toDateString(now)
  const wakeHour = timeToHour(settings.wake_time)
  const sleepHour = timeToHour(settings.sleep_time)
  const workStart = timeToHour(settings.work_start)
  const workEnd = timeToHour(settings.work_end)
  const workday = isWorkday(date, settings.workdays)

  const clamp = h => Math.max(wakeHour, Math.min(sleepHour, h))
  const focusHours = [clamp(currentHour - 1), clamp(currentHour), clamp(currentHour + 1)]
  const uniqueHours = [...new Set(focusHours)]

  function tasksForHour(hour) {
    return tasksForDate.filter(t => t.hour === hour)
  }

  const minutes = String(now.getMinutes()).padStart(2, '0')
  const timeStr = `${currentHour > 12 ? currentHour - 12 : currentHour || 12}:${minutes} ${currentHour >= 12 ? 'PM' : 'AM'}`

  // ── Today stats ───────────────────────────────────────────────
  const todayAll = tasksForDate.filter(t => t.text?.trim())
  const todayPast = todayAll.filter(t => t.hour < currentHour || (t.hour === currentHour))
  const todayUpcoming = todayAll.filter(t => t.hour > currentHour)
  const todayPlanned = todayAll.length
  const todayDone = todayPast.filter(t => t.completed && !t.overflowed_from_hour && !t.deferred_from_date).length
  const todayMoved = todayPast.filter(t => t.overflowed_from_hour != null || t.deferred_from_date != null).length
  const todayDismissed = todayPast.filter(t => t.dismissed).length

  // ── Weekly stats (only past days + today up to now) ───────────
  const weekPast = weeklyTasks.filter(t => {
    if (!t.text?.trim()) return false
    if (t.date < todayStr) return true           // previous days this week
    if (t.date === todayStr) return t.hour <= currentHour  // today up to now
    return false
  })
  const weekPlanned = weekPast.length
  const weekActive  = weekPast.filter(t => !t.dismissed)
  const weekDone    = weekActive.filter(t => t.completed && !t.overflowed_from_hour && !t.deferred_from_date).length
  const weekMoved   = weekActive.filter(t => t.overflowed_from_hour != null || t.deferred_from_date != null).length
  const weekDismissed = weekPast.filter(t => t.dismissed).length

  // ── Tag breakdown (full week, non-dismissed) ─────────────────
  const weekTagged = weeklyTasks.filter(t => t.text?.trim() && !t.dismissed)

  function StatRow({ done, moved, dismissed, planned }) {
    const denom = planned > 0 ? `/${planned}` : ''
    return (
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl p-2.5 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle2 size={11} />
            <span className="text-[10px] font-medium">Done</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400 leading-none">
            {done}<span className="text-[10px] font-normal opacity-60">{denom}</span>
          </div>
        </div>
        <div className="rounded-xl p-2.5 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
            <MoveRight size={11} />
            <span className="text-[10px] font-medium">Moved</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-yellow-600 dark:text-yellow-400 leading-none">
            {moved}<span className="text-[10px] font-normal opacity-60">{denom}</span>
          </div>
        </div>
        <div className="rounded-xl p-2.5 bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 mb-1">
            <Archive size={11} />
            <span className="text-[10px] font-medium">Dismissed</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-purple-600 dark:text-purple-400 leading-none">
            {dismissed}<span className="text-[10px] font-normal opacity-60">{denom}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="focus-panel" className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Now</div>
        <div className="text-2xl font-bold accent-text tabular-nums">{timeStr}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDisplayDate(date)}</div>
      </div>

      {/* Hour tab labels */}
      <div className="flex gap-1.5 px-5 pt-4 pb-2">
        {uniqueHours.map(h => (
          <div key={h} className={`flex-1 text-center text-xs font-semibold py-1 rounded-lg ${
            h === currentHour
              ? 'accent-bg text-white'
              : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800'
          }`}>
            {formatHour(h)}
          </div>
        ))}
      </div>

      {/* Focused hour slots */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2">
        {uniqueHours.map(hour => {
          const isWork = workday && hour >= workStart && hour < workEnd
          const isCurrent = hour === currentHour
          return (
            <div key={hour}>
              {isCurrent && (
                <div className="px-2 py-0.5">
                  <div className="h-px bg-[var(--accent)] opacity-40" />
                </div>
              )}
              <HourSlot
                hour={hour}
                tasks={tasksForHour(hour)}
                dateStr={dateStr}
                settingsId={settingsId}
                isWork={isWork}
                isCurrent={isCurrent}
                readOnly
              />
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{formatHour(currentHour)}</span>
          <span>{Math.round((now.getMinutes() / 60) * 100)}% through</span>
          <span>{formatHour(currentHour + 1)}</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full accent-bg rounded-full transition-all duration-1000"
            style={{ width: `${(now.getMinutes() / 60) * 100}%` }}
          />
        </div>
      </div>

      {/* Today overview */}
      <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-baseline justify-between mt-4 mb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</div>
          {todayUpcoming > 0 && (
            <span className="text-[10px] text-gray-400">{todayUpcoming} upcoming</span>
          )}
        </div>
        <StatRow done={todayDone} moved={todayMoved} dismissed={todayDismissed} planned={todayPlanned} />
      </div>

      {/* Weekly overview */}
      <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2">This week</div>
        <StatRow done={weekDone} moved={weekMoved} dismissed={weekDismissed} planned={weekPlanned} />

        {/* Per-tag breakdown */}
        {TAGS.some(({ id }) => weekTagged.filter(t => t.tag === id).length > 0) && (
          <div className="mt-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">By tag</div>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(({ id, label, pill }) => {
                const count = weekTagged.filter(t => t.tag === id).length
                if (count === 0) return null
                return (
                  <span key={id} className={`text-[10px] font-semibold px-2 py-1 rounded-full ${pill}`}>
                    {label} · {count}
                  </span>
                )
              })}
              {weekTagged.filter(t => !t.tag).length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Untagged · {weekTagged.filter(t => !t.tag).length}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
