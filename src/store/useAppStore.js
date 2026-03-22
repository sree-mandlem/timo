import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_SETTINGS = {
  id: null,
  pin_hash: null,
  wake_time: '07:00',
  sleep_time: '22:00',
  work_start: '09:00',
  work_end: '17:00',
  workdays: [1, 2, 3, 4, 5],
  theme: 'system',
  accent_color: '#6366f1',
  onboarding_done: false,
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth
      isUnlocked: false,
      setUnlocked: (val) => set({ isUnlocked: val }),

      // Settings
      settings: { ...DEFAULT_SETTINGS },
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),

      // Tasks keyed by "YYYY-MM-DD"
      tasksByDate: {},
      setTasksForDate: (dateStr, tasks) =>
        set(state => ({ tasksByDate: { ...state.tasksByDate, [dateStr]: tasks } })),
      updateTask: (dateStr, taskId, patch) =>
        set(state => ({
          tasksByDate: {
            ...state.tasksByDate,
            [dateStr]: (state.tasksByDate[dateStr] || []).map(t =>
              t.id === taskId ? { ...t, ...patch } : t
            ),
          },
        })),
      removeTask: (dateStr, taskId) =>
        set(state => ({
          tasksByDate: {
            ...state.tasksByDate,
            [dateStr]: (state.tasksByDate[dateStr] || []).filter(t => t.id !== taskId),
          },
        })),
      addTask: (dateStr, task) =>
        set(state => ({
          tasksByDate: {
            ...state.tasksByDate,
            [dateStr]: [...(state.tasksByDate[dateStr] || []), task],
          },
        })),

      // History for suggestions
      history: [], // [{ text, hour, use_count, last_icon }]
      setHistory: (h) => set({ history: h }),

      // New-day tracking
      lastVisitDate: null,
      setLastVisitDate: (d) => set({ lastVisitDate: d }),

      // Undo last delete (in-memory only, not persisted)
      lastDeletedTask: null,
      setLastDeletedTask: (task) => set({ lastDeletedTask: task }),
      clearLastDeletedTask: () => set({ lastDeletedTask: null }),
    }),
    {
      name: 'five-things-store',
      partialize: (state) => ({
        settings: state.settings,
        tasksByDate: state.tasksByDate,
        history: state.history,
        lastVisitDate: state.lastVisitDate,
      }),
    }
  )
)
