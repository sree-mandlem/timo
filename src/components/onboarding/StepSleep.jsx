import { Moon, Sun } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function StepSleep() {
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">😴</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Sleep Schedule</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          We'll only show planning hours when you're awake.
        </p>
      </div>

      <div className="space-y-5">
        <label className="block">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Sun size={16} className="accent-text" />
            Wake up time
          </div>
          <input
            type="time"
            value={settings.wake_time}
            onChange={e => setSettings({ wake_time: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 accent-ring"
          />
        </label>

        <label className="block">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Moon size={16} className="accent-text" />
            Bedtime
          </div>
          <input
            type="time"
            value={settings.sleep_time}
            onChange={e => setSettings({ sleep_time: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 accent-ring"
          />
        </label>
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-500 dark:text-gray-400">
        Your planner will show hours from <strong className="accent-text">{settings.wake_time}</strong> to <strong className="accent-text">{settings.sleep_time}</strong>.
      </div>
    </div>
  )
}
