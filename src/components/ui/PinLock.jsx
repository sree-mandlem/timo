import { useState } from 'react'
import { Delete } from 'lucide-react'
import { verifyPin } from '../../lib/crypto'
import { useAppStore } from '../../store/useAppStore'

export default function PinLock() {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const pinHash = useAppStore(s => s.settings.pin_hash)
  const setUnlocked = useAppStore(s => s.setUnlocked)

  async function handleDigit(d) {
    if (input.length >= 4) return
    const next = input + d
    setInput(next)
    if (next.length === 4) {
      const ok = await verifyPin(next, pinHash)
      if (ok) {
        setError(false)
        setUnlocked(true)
      } else {
        setShaking(true)
        setError(true)
        setTimeout(() => { setInput(''); setShaking(false); setError(false) }, 800)
      }
    }
  }

  function handleBack() {
    setInput(i => i.slice(0, -1))
    setError(false)
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🗓</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Five Things</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter your PIN to continue</p>
        </div>

        {/* Dots */}
        <div className={`flex justify-center gap-4 mb-8 ${shaking ? 'animate-bounce' : ''}`}>
          {[0,1,2,3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < input.length
                  ? error ? 'bg-red-500' : 'accent-bg'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-500 text-sm mb-4">Incorrect PIN. Try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {digits.map((d, i) => (
            <button
              key={i}
              onClick={() => d === '⌫' ? handleBack() : d ? handleDigit(d) : null}
              disabled={!d}
              className={`
                h-16 rounded-2xl text-xl font-semibold transition-all duration-100
                ${!d ? 'invisible' : ''}
                ${d === '⌫'
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm active:scale-95 active:bg-gray-100 dark:active:bg-gray-700'
                }
              `}
            >
              {d === '⌫' ? <Delete className="mx-auto" size={20} /> : d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
