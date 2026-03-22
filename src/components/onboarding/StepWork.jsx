import { Briefcase } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
]

export default function StepWork() {
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)

  function toggleDay(val) {
    const days = settings.workdays.includes(val)
      ? settings.workdays.filter(d => d !== val)
      : [...settings.workdays, val].sort()
    setSettings({ workdays: days })
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">💼</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Work Schedule</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          We'll color-code your work hours for quick visibility.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work starts</div>
            <input
              type="time"
              value={settings.work_start}
              onChange={e => setSettings({ work_start: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 accent-ring"
            />
          </label>
          <label className="block">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work ends</div>
            <input
              type="time"
              value={settings.work_end}
              onChange={e => setSettings({ work_end: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 accent-ring"
            />
          </label>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Workdays</div>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map(d => (
              <button
                key={d.value}
                onClick={() => toggleDay(d.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  settings.workdays.includes(d.value)
                    ? 'accent-bg text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
