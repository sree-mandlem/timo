import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { loadSettings } from './lib/db'
import ThemeProvider from './components/ui/ThemeProvider'
import PinLock from './components/ui/PinLock'
import Onboarding from './components/onboarding/Onboarding'
import PlannerView from './components/planner/PlannerView'
import SettingsPage from './pages/SettingsPage'

function AppRoutes() {
  const [booting, setBooting] = useState(true)
  const settings = useAppStore(s => s.settings)
  const setSettings = useAppStore(s => s.setSettings)
  const isUnlocked = useAppStore(s => s.isUnlocked)
  const setUnlocked = useAppStore(s => s.setUnlocked)

  useEffect(() => {
    async function boot() {
      // Ensure persisted Zustand state is hydrated before deciding lock state
      await useAppStore.persist?.rehydrate?.()

      const hydratedSettings = useAppStore.getState().settings
      const saved = await loadSettings()
      const loadedSettings = saved || hydratedSettings

      if (loadedSettings) setSettings(loadedSettings)
      const hasPin = Boolean(loadedSettings?.pin_hash)
      setUnlocked(!hasPin)
      setBooting(false)
    }
    boot()
  }, [])

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-3xl animate-pulse">🗓</div>
      </div>
    )
  }

  // Not onboarded yet
  if (!settings.onboarding_done) {
    return <Onboarding onComplete={() => { setUnlocked(true) }} />
  }

  // PIN locked
  if (settings.pin_hash && !isUnlocked) {
    return <PinLock />
  }

  return (
    <Routes>
      <Route path="/" element={<PlannerView />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  )
}
