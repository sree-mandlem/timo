import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, X } from 'lucide-react'
import { loadTasksForDate, copyRecurringTasks } from '../../lib/db'
import { fromDateString, formatHour, formatDisplayDate } from '../../lib/dateUtils'
import { getIconComponent } from '../../lib/icons'

export default function NewDayModal({ fromDateStr, toDateStr, settingsId, onDone, onSkip }) {
  const [recurringTasks, setRecurringTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const tasks = await loadTasksForDate(settingsId, fromDateStr)
      setRecurringTasks(tasks.filter(t => t.is_recurring && t.text?.trim()))
      setLoading(false)
    }
    load()
  }, [settingsId, fromDateStr])

  async function handleCopy() {
    setCopying(true)
    await copyRecurringTasks(settingsId, fromDateStr, toDateStr)
    setCopying(false)
    setDone(true)
    setTimeout(() => onDone(), 900)
  }

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  const fromLabel = formatDisplayDate(fromDateStr ? new Date(fromDateStr + 'T12:00:00') : new Date())
  const toLabel = formatDisplayDate(toDateStr ? new Date(toDateStr + 'T12:00:00') : new Date())

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="accent-bg px-6 pt-6 pb-8 relative">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="text-4xl mb-2">🔁</div>
          <h2 className="text-xl font-bold text-white">Copy recurring tasks</h2>
          <p className="text-white/80 text-sm mt-1">
            {loading
              ? `Checking ${fromLabel}…`
              : recurringTasks.length > 0
                ? `${recurringTasks.length} recurring task${recurringTasks.length > 1 ? 's' : ''} from ${fromLabel}`
                : `No recurring tasks on ${fromLabel}.`
            }
          </p>
          <div className="flex items-center gap-2 mt-2 text-white/70 text-xs">
            <span className="bg-white/20 rounded-lg px-2 py-0.5 font-medium">{fromLabel}</span>
            <span>→</span>
            <span className="bg-white/20 rounded-lg px-2 py-0.5 font-medium">{toLabel}</span>
          </div>
        </div>

        {/* Task preview */}
        <div className="-mt-4 mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          ) : recurringTasks.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Nothing to copy.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-52 overflow-y-auto">
              {recurringTasks.map(task => {
                const IconComp = task.icon ? getIconComponent(task.icon) : null
                return (
                  <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="shrink-0 w-16 text-xs font-medium text-gray-400 tabular-nums">
                      {formatHour(task.hour)}
                    </span>
                    {IconComp
                      ? <IconComp size={14} className="accent-text shrink-0" />
                      : <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
                    }
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.text}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-5 space-y-2">
          {!done ? (
            <>
              <button
                onClick={handleCopy}
                disabled={copying || loading || recurringTasks.length === 0}
                className="w-full flex items-center justify-center gap-2 accent-bg text-white py-3 rounded-2xl font-semibold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {copying
                  ? <Loader2 size={16} className="animate-spin" />
                  : <RefreshCw size={16} />
                }
                {copying ? 'Copying…' : `Copy ${recurringTasks.length} task${recurringTasks.length !== 1 ? 's' : ''} to ${toLabel}`}
              </button>
              <button
                onClick={onSkip}
                className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 text-green-500 font-medium text-sm">
              <span className="text-xl">✅</span> Tasks copied successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
