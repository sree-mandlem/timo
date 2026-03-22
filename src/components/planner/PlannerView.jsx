import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Settings, RefreshCw, Undo2, PanelRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { loadTasksForDate, copyRecurringTasks, upsertTask, loadWeeklyTasks } from '../../lib/db'
import { toDateString, addDays, formatDisplayDate, timeToHour, isWorkday, getWeekDates } from '../../lib/dateUtils'
import HourSlot from './HourSlot'
import FocusPanel from './FocusPanel'
import NewDayModal from './NewDayModal'
import { useNavigate } from 'react-router-dom'

export default function PlannerView() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [showNewDayModal, setShowNewDayModal] = useState(false)
  const [showMobilePanel, setShowMobilePanel] = useState(false)
  const [weeklyTasks, setWeeklyTasks] = useState([])
  const currentHour = new Date().getHours()
  const currentHourRef = useRef(null)

  const settings = useAppStore(s => s.settings)
  const tasksByDate = useAppStore(s => s.tasksByDate)
  const setTasksForDate = useAppStore(s => s.setTasksForDate)
  const lastVisitDate = useAppStore(s => s.lastVisitDate)
  const setLastVisitDate = useAppStore(s => s.setLastVisitDate)
  const lastDeletedTask = useAppStore(s => s.lastDeletedTask)
  const clearLastDeletedTask = useAppStore(s => s.clearLastDeletedTask)
  const addTask = useAppStore(s => s.addTask)
  const navigate = useNavigate()

  const todayStr = toDateString(new Date())
  const dateStr = toDateString(currentDate)
  const isToday = dateStr === todayStr

  const wakeHour = timeToHour(settings.wake_time)
  const sleepHour = timeToHour(settings.sleep_time)
  const workStart = timeToHour(settings.work_start)
  const workEnd = timeToHour(settings.work_end)
  const workday = isWorkday(currentDate, settings.workdays)

  const hours = Array.from(
    { length: sleepHour - wakeHour + 1 },
    (_, i) => wakeHour + i
  )

  // Detect new day on mount
  useEffect(() => {
    if (!settings.id) return
    if (lastVisitDate !== todayStr) {
      setLastVisitDate(todayStr)
      // Only show modal if it's genuinely a new day (not first ever open)
      if (lastVisitDate) setShowNewDayModal(true)
    }
  }, [settings.id])

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const tasks = await loadTasksForDate(settings.id, dateStr)
      setTasksForDate(dateStr, tasks)
      if (dateStr !== todayStr) {
        const todayTasks = await loadTasksForDate(settings.id, todayStr)
        setTasksForDate(todayStr, todayTasks)
      }
      // Load weekly tasks for overview stats
      const wTasks = await loadWeeklyTasks(settings.id, getWeekDates(new Date()))
      setWeeklyTasks(wTasks)
      setLoading(false)
    }
    if (settings.id) fetch()
    else setLoading(false)
  }, [dateStr, settings.id])

  useEffect(() => {
    if (isToday && currentHourRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [loading, isToday])

  async function handleNewDayDone() {
    setShowNewDayModal(false)
    // Reload the target date's tasks to reflect newly copied recurring ones
    const tasks = await loadTasksForDate(settings.id, dateStr)
    setTasksForDate(dateStr, tasks)
  }

  // Clear undo buffer when user navigates to a different date
  useEffect(() => {
    clearLastDeletedTask()
  }, [dateStr])

  async function handleUndo() {
    if (!lastDeletedTask) return
    const { dateStr: taskDateStr, id: _removed, ...payload } = lastDeletedTask
    const restored = await upsertTask(settings.id, { ...payload, date: taskDateStr })
    addTask(taskDateStr, restored)
    clearLastDeletedTask()
  }

  const tasksForDate = tasksByDate[dateStr] || []

  function tasksForHour(hour) {
    return tasksForDate.filter(t => t.hour === hour)
  }

  const plannerContent = (
    <>
      {/* Hour grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Loading…</div>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3 pb-20">
          {hours.map(hour => {
            const isWork = workday && hour >= workStart && hour < workEnd
            const isCurrent = isToday && hour === currentHour
            return (
              <div key={hour} ref={isCurrent ? currentHourRef : null}>
                <HourSlot
                  hour={hour}
                  tasks={tasksForHour(hour)}
                  dateStr={dateStr}
                  settingsId={settings.id}
                  isWork={isWork}
                  isCurrent={isCurrent}
                />
              </div>
            )
          })}
        </div>
      )}
    </>
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* New Day Modal */}
      {showNewDayModal && (
        <NewDayModal
          fromDateStr={toDateString(addDays(currentDate, -1))}
          toDateStr={dateStr}
          settingsId={settings.id}
          onDone={handleNewDayDone}
          onSkip={() => setShowNewDayModal(false)}
        />
      )}
      {/* ── Left: Full day planner ── */}
      <div data-testid="planner-day-view" className="flex-1 flex flex-col lg:border-r border-gray-200 dark:border-gray-800 lg:overflow-y-auto lg:h-screen">
        {/* Header — full width, content centred */}
        <header className="sticky top-0 z-30 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div className="w-full max-w-xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentDate(d => addDays(d, -1))}
                className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-center flex-1">
                <div className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  {formatDisplayDate(currentDate)}
                </div>
                {isToday
                  ? <span className="text-xs accent-text font-medium">Today</span>
                  : <button onClick={() => setCurrentDate(new Date())} className="text-xs text-gray-400 hover:accent-text transition-colors">Back to today</button>
                }
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentDate(d => addDays(d, 1))}
                  className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <ChevronRight size={20} />
                </button>
                {lastDeletedTask && (
                  <button
                    onClick={handleUndo}
                    title={`Undo delete "${lastDeletedTask.text}"`}
                    className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-amber-500 dark:text-amber-400"
                  >
                    <Undo2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => setShowMobilePanel(v => !v)}
                  title="Focus panel"
                  className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 lg:hidden"
                >
                  <PanelRight size={20} />
                </button>
                <button
                  title="Copy recurring tasks"
                  className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <RefreshCw size={20} />
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {workday && (
              <div className="mt-1.5">
                <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                  Work {settings.work_start}–{settings.work_end}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Centred content */}
        <div className="w-full max-w-xl mx-auto flex-1">
          {plannerContent}
        </div>
      </div>

      {/* ── Right: Focus panel (desktop sticky) ── */}
      <div data-testid="focus-panel-desktop" className="hidden lg:flex lg:flex-col lg:w-80 xl:w-96 lg:sticky lg:top-0 lg:h-screen bg-white dark:bg-gray-900">
        <FocusPanel
          dateStr={todayStr}
          date={new Date()}
          tasksForDate={tasksByDate[todayStr] || []}
          weeklyTasks={weeklyTasks}
          settings={settings}
          settingsId={settings.id}
        />
      </div>

      {/* ── Right: Focus panel (mobile drawer) ── */}
      {showMobilePanel && (
        <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobilePanel(false)} />
          {/* panel */}
          <div data-testid="focus-panel-mobile" className="relative w-80 max-w-[90vw] h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto flex flex-col">
            <button
              onClick={() => setShowMobilePanel(false)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <PanelRight size={16} />
            </button>
            <FocusPanel
              dateStr={todayStr}
              date={new Date()}
              tasksForDate={tasksByDate[todayStr] || []}
              weeklyTasks={weeklyTasks}
              settings={settings}
              settingsId={settings.id}
            />
          </div>
        </div>
      )}
    </div>
  )
}
