import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Monitor, Moon, Sun, Lock, LogOut } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { saveSettings } from '../lib/db'
import { hashPin } from '../lib/crypto'

const THEMES = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

const ACCENTS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6',
]

const DAYS = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 7 },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)
  const setUnlocked = useAppStore(s => s.setUnlocked)
  const [saving, setSaving] = useState(false)
  const [pinStage, setPinStage] = useState('idle') // idle | new | confirm
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')

  async function persist(patch) {
    const updated = { ...settings, ...patch }
    setSettings(patch)
    setSaving(true)
    const saved = await saveSettings(updated)
    if (saved) setSettings(saved)
    setSaving(false)
  }

  function toggleDay(val) {
    const days = settings.workdays.includes(val)
      ? settings.workdays.filter(d => d !== val)
      : [...settings.workdays, val].sort()
    persist({ workdays: days })
  }

  function selectTheme(id) {
    persist({ theme: id })
    if (id === 'dark') document.documentElement.classList.add('dark')
    else if (id === 'light') document.documentElement.classList.remove('dark')
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
    }
  }

  function selectAccent(color) {
    persist({ accent_color: color })
    document.documentElement.style.setProperty('--accent', color)
  }

  async function handlePinDigit(stage, val) {
    if (stage === 'new') {
      const next = newPin + val
      setNewPin(next)
      if (next.length === 4) setPinStage('confirm')
    } else {
      const next = confirmPin + val
      setConfirmPin(next)
      if (next.length === 4) {
        if (next !== newPin) {
          setPinError("PINs don't match. Try again.")
          setTimeout(() => { setNewPin(''); setConfirmPin(''); setPinStage('new'); setPinError('') }, 900)
        } else {
          const hash = await hashPin(next)
          await persist({ pin_hash: hash })
          setNewPin(''); setConfirmPin(''); setPinStage('idle'); setPinError('')
        }
      }
    }
  }

  const pinCurrent = pinStage === 'new' ? newPin : confirmPin

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-white text-lg">Settings</h1>
        {saving && <span className="text-xs text-gray-400 ml-auto">Saving…</span>}
      </header>

      <div className="px-4 py-6 space-y-8">
        {/* Sleep */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sleep Schedule</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <SettingRow label="Wake time">
              <input type="time" value={settings.wake_time} onChange={e => persist({ wake_time: e.target.value })}
                className="text-sm text-right bg-transparent text-gray-700 dark:text-gray-300 outline-none" />
            </SettingRow>
            <SettingRow label="Bedtime">
              <input type="time" value={settings.sleep_time} onChange={e => persist({ sleep_time: e.target.value })}
                className="text-sm text-right bg-transparent text-gray-700 dark:text-gray-300 outline-none" />
            </SettingRow>
          </div>
        </section>

        {/* Work */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Work Schedule</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <SettingRow label="Work starts">
              <input type="time" value={settings.work_start} onChange={e => persist({ work_start: e.target.value })}
                className="text-sm text-right bg-transparent text-gray-700 dark:text-gray-300 outline-none" />
            </SettingRow>
            <SettingRow label="Work ends">
              <input type="time" value={settings.work_end} onChange={e => persist({ work_end: e.target.value })}
                className="text-sm text-right bg-transparent text-gray-700 dark:text-gray-300 outline-none" />
            </SettingRow>
            <div className="px-4 py-3">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Workdays</div>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d => (
                  <button key={d.value} onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.workdays.includes(d.value) ? 'accent-bg text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>{d.label}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Theme */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Appearance</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</div>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => selectTheme(id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      settings.theme === id ? 'accent-border accent-text' : 'border-gray-200 dark:border-gray-700 text-gray-500'
                    }`}>
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accent Color</div>
              <div className="flex gap-2 flex-wrap">
                {ACCENTS.map(color => (
                  <button key={color} onClick={() => selectAccent(color)} style={{ backgroundColor: color }}
                    className={`w-8 h-8 rounded-full transition-all ${
                      settings.accent_color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                    }`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Security</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            <button onClick={() => setPinStage(s => s === 'idle' ? 'new' : 'idle')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Lock size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {settings.pin_hash ? 'Change PIN' : 'Set PIN'}
              </span>
              <span className="text-xs text-gray-400">{settings.pin_hash ? 'Active' : 'None'}</span>
            </button>
            {settings.pin_hash && (
              <button onClick={() => persist({ pin_hash: null })}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Lock size={16} className="text-red-400" />
                <span className="text-sm text-red-500">Remove PIN</span>
              </button>
            )}
          </div>

          {pinStage !== 'idle' && (
            <div className="mt-3 bg-white dark:bg-gray-900 rounded-2xl p-4">
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">
                {pinStage === 'new' ? 'Enter new 4-digit PIN' : 'Confirm PIN'}
              </p>
              <div className="flex justify-center gap-3 mb-4">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < pinCurrent.length ? 'accent-bg' : 'bg-gray-300 dark:bg-gray-700'}`} />
                ))}
              </div>
              {pinError && <p className="text-center text-red-500 text-xs mb-2">{pinError}</p>}
              <div className="grid grid-cols-3 gap-2">
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
                  <button key={i} onClick={() => {
                    if (d === '⌫') {
                      if (pinStage === 'new') setNewPin(p => p.slice(0,-1))
                      else setConfirmPin(p => p.slice(0,-1))
                    } else if (d) {
                      handlePinDigit(pinStage, d)
                    }
                  }}
                  className={`h-12 rounded-xl text-base font-semibold ${!d ? 'invisible' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 active:scale-95 transition-all'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Lock */}
        <section>
          <button
            onClick={() => { setUnlocked(false); navigate('/') }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={16} />
            Lock App
          </button>
        </section>
      </div>
    </div>
  )
}

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </div>
  )
}
