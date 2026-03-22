import { Monitor, Moon, Sun } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const THEMES = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

const ACCENTS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
]

export default function StepTheme() {
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)

  function selectTheme(id) {
    setSettings({ theme: id })
    // Apply immediately so user sees the change
    if (id === 'dark') document.documentElement.classList.add('dark')
    else if (id === 'light') document.documentElement.classList.remove('dark')
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
    }
  }

  function selectAccent(color) {
    setSettings({ accent_color: color })
    document.documentElement.style.setProperty('--accent', color)
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎨</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personalize</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Choose a theme and accent color that feels right to you.
        </p>
      </div>

      {/* Theme selector */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</div>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTheme(id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                settings.theme === id
                  ? 'accent-border bg-white dark:bg-gray-800 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <Icon size={22} className={settings.theme === id ? 'accent-text' : 'text-gray-500'} />
              <span className={`text-sm font-medium ${settings.theme === id ? 'accent-text' : 'text-gray-600 dark:text-gray-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Accent Color</div>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map(color => (
            <button
              key={color}
              onClick={() => selectAccent(color)}
              style={{ backgroundColor: color }}
              className={`w-10 h-10 rounded-full transition-all ${
                settings.accent_color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Preview pill */}
      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl accent-bg flex items-center justify-center text-white text-lg">🗓</div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Preview</div>
          <div className="text-xs accent-text font-medium">Five Things Planner</div>
        </div>
      </div>
    </div>
  )
}
