import { useState } from 'react'
import { Delete, CheckCircle2, Loader2 } from 'lucide-react'
import { hashPin } from '../../lib/crypto'
import { useAppStore } from '../../store/useAppStore'

export default function StepPin({ onFinish, saving }) {
  const [input, setInput] = useState('')
  const [confirm, setConfirm] = useState('')
  const [stage, setStage] = useState('set') // 'set' | 'confirm'
  const [error, setError] = useState('')
  const [skip, setSkip] = useState(false)
  const setSettings = useAppStore(s => s.setSettings)

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  async function handleDigit(d) {
    if (stage === 'set') {
      if (input.length >= 4) return
      const next = input + d
      setInput(next)
      if (next.length === 4) setStage('confirm')
    } else {
      if (confirm.length >= 4) return
      const next = confirm + d
      setConfirm(next)
      if (next.length === 4) {
        if (next !== input) {
          setError("PINs don't match. Try again.")
          setTimeout(() => { setInput(''); setConfirm(''); setStage('set'); setError('') }, 900)
        } else {
          const hash = await hashPin(next)
          setSettings({ pin_hash: hash })
          onFinish()
        }
      }
    }
  }

  function handleBack() {
    if (stage === 'set') setInput(i => i.slice(0, -1))
    else setConfirm(c => c.slice(0, -1))
  }

  async function handleSkip() {
    setSettings({ pin_hash: null })
    onFinish()
  }

  const current = stage === 'set' ? input : confirm
  const title = stage === 'set' ? 'Set a 4-digit PIN' : 'Confirm your PIN'
  const subtitle = stage === 'set' ? 'Protects your planner on this device' : 'Enter the same PIN again'

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🔐</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{subtitle}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-4 mb-6">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all duration-150 ${
            i < current.length ? 'accent-bg' : 'bg-gray-300 dark:bg-gray-700'
          }`} />
        ))}
      </div>

      {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => d === '⌫' ? handleBack() : d ? handleDigit(d) : null}
            disabled={saving || !d}
            className={`h-16 rounded-2xl text-xl font-semibold transition-all duration-100
              ${!d ? 'invisible' : ''}
              ${d === '⌫'
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm active:scale-95'
              }
            `}
          >
            {d === '⌫' ? <span className="text-base">⌫</span> : d}
          </button>
        ))}
      </div>

      <button
        onClick={handleSkip}
        disabled={saving}
        className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Skip PIN (not recommended)'}
      </button>
    </div>
  )
}
