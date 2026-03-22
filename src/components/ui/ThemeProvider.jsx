import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

export default function ThemeProvider({ children }) {
  const theme = useAppStore(s => s.settings.theme)
  const accentColor = useAppStore(s => s.settings.accent_color)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', accentColor || '#6366f1')

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = () => mq.matches ? root.classList.add('dark') : root.classList.remove('dark')
      apply()
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme, accentColor])

  return children
}
