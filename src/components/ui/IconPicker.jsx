import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { ALL_ICONS } from '../../lib/icons'

export default function IconPicker({ selected, onSelect, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = query
    ? ALL_ICONS.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    : ALL_ICONS

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={16} className="text-gray-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search icons…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-6 gap-1 p-3 max-h-72 overflow-y-auto">
          {filtered.map(({ name, component: Icon }) => (
            <button
              key={name}
              title={name}
              onClick={() => { onSelect(name); onClose() }}
              className={`
                flex flex-col items-center justify-center p-2 rounded-xl text-xs gap-1 transition-all
                ${selected === name
                  ? 'accent-bg text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">No icons found</p>
        )}

        {/* Clear */}
        {selected && (
          <div className="p-3 pt-0">
            <button
              onClick={() => { onSelect(null); onClose() }}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 py-2"
            >
              Remove icon
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
