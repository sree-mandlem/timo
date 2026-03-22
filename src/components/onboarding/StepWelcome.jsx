import { ChevronRight } from 'lucide-react'

export default function StepWelcome({ onNext }) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">🗓</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Welcome to<br />
        <span className="accent-text">Five Things</span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-xs mx-auto mb-8">
        Your personal hourly planner. Plan each hour of your day with up to 5 focused tasks.
      </p>
      <ul className="text-left space-y-3 mb-10 max-w-xs mx-auto">
        {[
          ['⏱', 'Hour-by-hour task planning'],
          ['🔁', 'Recurring tasks that carry forward'],
          ['💡', 'Smart suggestions from your history'],
          ['🎨', 'Fully themed to your style'],
          ['☁️', 'Synced across all your devices'],
        ].map(([emoji, label]) => (
          <li key={label} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm">
            <span className="text-lg">{emoji}</span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onNext}
        className="w-full accent-bg text-white py-3.5 rounded-2xl font-semibold text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        Get Started <ChevronRight size={18} />
      </button>
    </div>
  )
}
