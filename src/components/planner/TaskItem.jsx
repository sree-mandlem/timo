import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoveRight, MoveLeft, Circle, CircleCheck, Trash2, Flag, TriangleAlert, GripVertical, StickyNote, MoreHorizontal, RefreshCw, CalendarPlus, Archive, NotebookPen } from 'lucide-react'
import { inferIcon, getIconComponent } from '../../lib/icons'
import { upsertTask, deleteTask, recordHistory, getSuggestions, deferTask } from '../../lib/db'
import { useAppStore } from '../../store/useAppStore'
import { toDateString, formatHour, addDays } from '../../lib/dateUtils'
import IconPicker from '../ui/IconPicker'
import NoteEditor from '../ui/NoteEditor'

export const TAGS = [
  { id: 'work',     label: 'Work',     pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { id: 'personal', label: 'Personal', pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { id: 'career',   label: 'Career',   pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { id: 'fun',      label: 'Fun',      pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
]

const TAG_KEYWORD_MAP = [
  { tag: 'work',     keys: ['jira', 'dev', 'c&c', 'sprint', 'refinement', '1-1', '1:1', 'standup', 'deploy', 'office', 'work'] },
  { tag: 'career',   keys: ['research', 'leetcode', 'udemy', 'course', 'learn', 'study'] },
  { tag: 'personal', keys: ['eat', 'drink', 'lunch', 'dinner', 'breakfast', 'exercise', 'workout', 'gym', 'yoga', 'doctor', 'dentist', 'family', 'home', 'grocery', 'shopping'] },
  { tag: 'fun',      keys: ['swat', 'rookie', 'youtube', 'netflix', 'movie', 'game', 'play', 'party', 'fun'] },
]

function inferTag(text) {
  const lower = text.toLowerCase()
  for (const { tag, keys } of TAG_KEYWORD_MAP) {
    if (keys.some(k => lower.includes(k))) return tag
  }
  return null
}

function findNextAvailableSlot(takenSlots, preferredSlot) {
  for (let offset = 0; offset < 5; offset++) {
    const slot = (preferredSlot + offset) % 5
    if (!takenSlots.has(slot)) return slot
  }
  return null
}

function planTaskMove(allTasks, sourceHour, preferredSlot, direction) {
  const step = direction === 'next' ? 1 : -1
  const desiredHour = sourceHour + step

  for (let candidateHour = desiredHour; candidateHour >= 0 && candidateHour <= 23; candidateHour += step) {
    const tasksInHour = allTasks.filter(t => t.hour === candidateHour)
    if (tasksInHour.length >= 5) continue

    const takenSlots = new Set(tasksInHour.map(t => t.slot_index))
    const targetSlot = findNextAvailableSlot(takenSlots, preferredSlot)
    if (targetSlot == null) continue

    return {
      direction,
      hour: candidateHour,
      slotIndex: targetSlot,
      desiredHour,
      preferredSlot,
      occupiedSlots: [...takenSlots],
      needsConfirmation: candidateHour !== desiredHour || targetSlot !== preferredSlot,
    }
  }

  return null
}

export default function TaskItem({ task, dateStr, hour, slotIndex, settingsId, isDragging, readOnly, dragHandleProps }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(task?.text || '')
  const [saving, setSaving] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pendingMove, setPendingMove] = useState(null)
  const [confirmingDismiss, setConfirmingDismiss] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [noteText, setNoteText] = useState(task?.note || '')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const noteRef = useRef(null)
  const inputRef = useRef(null)
  const moreMenuRef = useRef(null)
  const moreBtnRef = useRef(null)

  const openMoreMenu = useCallback(() => {
    if (moreBtnRef.current) {
      const r = moreBtnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.top + window.scrollY, left: r.right + window.scrollX })
    }
    setShowMoreMenu(v => !v)
  }, [])

  // Close ⋯ menu on outside click
  useEffect(() => {
    if (!showMoreMenu) return
    function onOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target) &&
          moreBtnRef.current && !moreBtnRef.current.contains(e.target)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showMoreMenu])

  const updateTask = useAppStore(s => s.updateTask)
  const removeTask = useAppStore(s => s.removeTask)
  const addTask = useAppStore(s => s.addTask)
  const setLastDeletedTask = useAppStore(s => s.setLastDeletedTask)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  async function fetchSuggestions(val) {
    if (!val.trim()) { setSuggestions([]); return }
    const results = await getSuggestions(settingsId, val, hour)
    setSuggestions(results)
    setShowSuggestions(results.length > 0)
  }

  function handleTextChange(e) {
    setText(e.target.value)
    fetchSuggestions(e.target.value)
  }

  function applySuggestion(s) {
    setText(s.text)
    setSuggestions([])
    setShowSuggestions(false)
    handleSave(s.text, s.last_icon, false)
  }

  async function handleSave(overrideText, overrideIcon, overrideManual) {
    const finalText = (overrideText !== undefined ? overrideText : text).trim()
    if (!finalText) {
      // delete if empty and task already exists
      if (task?.id) {
        setSaving(true)
        await deleteTask(settingsId, task.id)
        removeTask(dateStr, task.id)
        setSaving(false)
      }
      setEditing(false)
      return
    }

    setSaving(true)
    setShowSuggestions(false)

    const inferred = inferIcon(finalText)
    const iconName = overrideManual !== undefined
      ? overrideIcon
      : task?.icon_manual ? task.icon : (inferred?.icon ?? task?.icon ?? null)
    const iconManual = overrideManual !== undefined ? overrideManual : (task?.icon_manual ?? false)

    const payload = {
      ...(task?.id ? { id: task.id } : {}),
      date: dateStr,
      hour,
      slot_index: slotIndex,
      text: finalText,
      icon: iconName,
      icon_manual: iconManual,
      is_recurring: task?.is_recurring ?? false,
      tag: task?.tag ?? inferTag(finalText),
    }

    const saved = await upsertTask(settingsId, payload)
    if (task?.id) {
      updateTask(dateStr, task.id, saved)
    } else {
      addTask(dateStr, saved)
    }
    await recordHistory(settingsId, finalText, hour, iconName)
    setSaving(false)
    setEditing(false)
  }

  async function toggleRecurring() {
    if (!task?.id) return
    const updated = await upsertTask(settingsId, { ...task, is_recurring: !task.is_recurring })
    updateTask(dateStr, task.id, updated)
  }

  async function toggleCompleted() {
    if (!task?.id) return
    const updated = await upsertTask(settingsId, { ...task, completed: !task.completed })
    updateTask(dateStr, task.id, updated)
  }

  function requestDelete() {
    if (task?.is_recurring) {
      setConfirmingDelete(true)
    } else {
      executeDelete()
    }
  }

  async function executeDelete() {
    if (!task?.id) return
    setSaving(true)
    setConfirmingDelete(false)
    setLastDeletedTask({ ...task, dateStr })
    await deleteTask(settingsId, task.id)
    removeTask(dateStr, task.id)
    setSaving(false)
  }

  async function handleOverflow() {
    if (!task?.id) return
    const allTasks = useAppStore.getState().tasksByDate[dateStr] || []
    const movePlan = planTaskMove(allTasks, hour, task.slot_index, 'next')
    if (!movePlan) return

    if (movePlan.needsConfirmation) {
      setPendingMove(movePlan)
      return
    }

    await executeMove(movePlan)
  }

  async function executeMove(movePlan) {
    if (!task?.id) return
    setPendingMove(null)
    setSaving(true)
    const saved = await upsertTask(settingsId, {
      ...task,
      hour: movePlan.hour,
      slot_index: movePlan.slotIndex,
      overflowed_from_hour: movePlan.direction === 'next' ? (task.overflowed_from_hour ?? hour) : null,
    })
    updateTask(dateStr, task.id, saved)
    setSaving(false)
  }

  async function requestMovePrev() {
    if (!task?.id) return
    const allTasks = useAppStore.getState().tasksByDate[dateStr] || []
    const movePlan = planTaskMove(allTasks, hour, task.slot_index, 'prev')
    if (!movePlan) return

    if (movePlan.needsConfirmation) {
      setPendingMove(movePlan)
      return
    }

    await executeMove(movePlan)
  }

  async function handleDefer() {
    if (!task?.id) return
    setSaving(true)
    const tomorrowStr = toDateString(addDays(new Date(dateStr), 1))
    await deferTask(settingsId, task, tomorrowStr)
    removeTask(dateStr, task.id)
    setSaving(false)
  }

  function requestDismiss() {
    if (task?.is_recurring) setConfirmingDismiss(true)
    else executeDismiss()
  }

  async function executeDismiss() {
    if (!task?.id) return
    setConfirmingDismiss(false)
    setSaving(true)
    const saved = await upsertTask(settingsId, { ...task, dismissed: true })
    updateTask(dateStr, task.id, saved)
    setSaving(false)
  }

  async function handleIconSelect(iconName) {
    const payload = {
      ...(task?.id ? { id: task.id } : {}),
      date: dateStr,
      hour,
      slot_index: slotIndex,
      text: text || task?.text || '',
      icon: iconName,
      icon_manual: true,
      is_recurring: task?.is_recurring ?? false,
    }
    const saved = await upsertTask(settingsId, payload)
    if (task?.id) updateTask(dateStr, task.id, saved)
    else addTask(dateStr, saved)
  }

  async function saveNote() {
    if (!task?.id) return
    const saved = await upsertTask(settingsId, { ...task, note: noteText })
    updateTask(dateStr, task.id, saved)
  }

  async function setTag(tagId) {
    if (!task?.id) return
    setShowMoreMenu(false)
    const newTag = task.tag === tagId ? null : tagId  // toggle off if same
    const saved = await upsertTask(settingsId, { ...task, tag: newTag })
    updateTask(dateStr, task.id, saved)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { setText(task?.text || ''); setEditing(false); setShowSuggestions(false) }
    if (e.key === 'ArrowDown' && showSuggestions) e.preventDefault()
  }

  const IconComp = task?.icon ? getIconComponent(task.icon) : null
  const inferredIcon = !task?.icon && text ? inferIcon(text) : null

  // ── Flag logic ──────────────────────────────────────────────────────────────
  const todayStr = toDateString(new Date())
  const currentHour = new Date().getHours()
  const isPastHour = dateStr < todayStr || (dateStr === todayStr && hour < currentHour)

  const isOverflowed = task?.overflowed_from_hour !== undefined && task.overflowed_from_hour !== null
  const isSkippedOverflow = isOverflowed && task.hour > task.overflowed_from_hour + 1
  const isDirectOverflow = isOverflowed && !isSkippedOverflow
  const isLate = !task?.completed && isPastHour && task?.text && !isOverflowed
  const origHourInfo = task?.original_hour != null ? ` · originally ${formatHour(task.original_hour)}` : ''
  const overflowHint = isOverflowed ? `Moved from ${formatHour(task.overflowed_from_hour)}${origHourInfo}` : ''
  const lateHint = `Not completed in time${origHourInfo}`
  const moveDestinationLabel = pendingMove ? `${formatHour(pendingMove.hour)} · slot ${pendingMove.slotIndex + 1}` : ''
  // ────────────────────────────────────────────────────────────────────────────

  if (!editing && !task?.text) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-400 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group outline-none focus:outline-none"
      >
        <span className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-gray-400 transition-colors shrink-0" />
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">Add task…</span>
      </button>
    )
  }

  if (!editing) {
    const completed = task?.completed ?? false
    const dismissed = task?.dismissed ?? false
    const hasNote = task?.note && task.note.trim()
    const currentTag = TAGS.find(t => t.id === task?.tag)
    return (
      <div
        data-testid={task ? `task-item-${hour}-${slotIndex}` : `add-task-${hour}-${slotIndex}`}
        className={`rounded-lg transition-colors ${completed ? 'opacity-50' : dismissed ? 'opacity-35' : ''} ${isDragging ? 'opacity-40' : ''}`}
      >
        {/* Task row */}
        <div className="group flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">

          {/* Drag handle — hidden in readOnly */}
          {!readOnly && (
            <span
              {...(task ? dragHandleProps : {})}
              data-testid={task ? `task-drag-handle-${hour}-${slotIndex}` : undefined}
              className="shrink-0 select-none touch-none text-gray-300 dark:text-gray-700 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={14} />
            </span>
          )}

          {/* Checkbox */}
          {!readOnly && (
            <button onClick={toggleCompleted} title={completed ? 'Mark incomplete' : 'Mark complete'}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors outline-none focus:outline-none">
              {completed ? <CircleCheck size={15} className="accent-text" /> : <Circle size={15} />}
            </button>
          )}

          {/* Flags — before icon */}
          {isLate && <span title={lateHint} className="shrink-0"><Flag size={11} className="text-red-500 fill-red-500" /></span>}
          {isDirectOverflow && <span title={overflowHint} className="shrink-0 cursor-help"><Flag size={11} className="text-yellow-500 fill-yellow-500" /></span>}
          {isSkippedOverflow && <span title={overflowHint} className="shrink-0 cursor-help"><TriangleAlert size={11} className="text-orange-500" /></span>}

          {/* Icon */}
          <button onClick={() => !readOnly && setShowIconPicker(true)} title="Change icon"
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none focus:outline-none">
            {IconComp
              ? <IconComp size={14} className={completed ? 'text-gray-400' : 'accent-text'} />
              : <span className="w-3.5 h-3.5 block rounded-full bg-gray-300 dark:bg-gray-600" />}
          </button>

          {/* Text */}
          <span onClick={() => !readOnly && !completed && !dismissed && setEditing(true)}
            className={`flex-1 text-sm truncate transition-colors ${
              completed ? 'line-through text-gray-400 dark:text-gray-600 cursor-default'
              : dismissed ? 'text-gray-400 dark:text-gray-500 italic cursor-default'
              : task?.is_recurring ? 'accent-text font-medium cursor-pointer'
              : readOnly ? 'text-gray-700 dark:text-gray-300'
              : 'text-gray-800 dark:text-gray-200 cursor-pointer'
            }`}>
            {task.text}
          </span>

          {/* Tag pill */}
          {currentTag && (
            <span
              data-testid={`task-tag-${hour}-${slotIndex}`}
              className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${currentTag.pill}`}
            >
              {currentTag.label}
            </span>
          )}

          {/* Note indicator */}
          {hasNote && (
            <button onClick={() => setShowNote(v => !v)} title="View note"
              className="shrink-0 p-1 rounded-md accent-text">
              <StickyNote size={11} />
            </button>
          )}

          {/* Actions: ← → ⋯ — hidden in readOnly */}
          {!readOnly && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={requestMovePrev} disabled={hour === 0} title="Move to previous hour"
                className="p-1 rounded-md text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-20">
                <MoveLeft size={12} />
              </button>
              <button onClick={handleOverflow} title="Move to next hour"
                className="p-1 rounded-md text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <MoveRight size={12} />
              </button>

              {/* ⋯ more menu */}
              <div className="relative">
                <button ref={moreBtnRef} onClick={openMoreMenu} title="More actions"
                  className="p-1 rounded-md text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <MoreHorizontal size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ⋯ portal popup — renders outside all scroll containers */}
        {showMoreMenu && createPortal(
          <div
            ref={moreMenuRef}
            style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, transform: 'translate(-100%, -100%)' }}
            className="z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1.5"
          >
            {/* Tags row */}
            <div className="flex gap-1 pb-1.5 mb-1.5 border-b border-gray-100 dark:border-gray-800">
              {TAGS.map(t => (
                <button key={t.id} onClick={() => setTag(t.id)} title={t.label}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${t.pill} ${task?.tag === t.id ? 'ring-2 ring-offset-1 ring-current' : 'opacity-60 hover:opacity-100'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Icon row: Move | Enrich | Lifecycle */}
            <div className="flex items-center gap-0.5">
              <button onClick={() => { setShowMoreMenu(false); handleDefer() }} title="Defer to tomorrow"
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                <CalendarPlus size={14} />
              </button>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

              <button onClick={() => { setShowMoreMenu(false); setShowNote(v => !v) }} title={hasNote ? 'Edit note' : 'Add note'}
                className="p-1.5 rounded-lg accent-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <NotebookPen size={14} />
              </button>
              <button onClick={() => { setShowMoreMenu(false); toggleRecurring() }} title={task?.is_recurring ? 'Remove recurring' : 'Make recurring'}
                className={`p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${task?.is_recurring ? 'accent-text' : 'text-gray-400 dark:text-gray-500'}`}>
                <RefreshCw size={14} />
              </button>

              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

              <button onClick={() => { setShowMoreMenu(false); requestDismiss() }} title={dismissed ? 'Un-dismiss' : 'Dismiss'}
                className={`p-1.5 rounded-lg transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20 ${dismissed ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500 hover:text-purple-500'}`}>
                <Archive size={14} />
              </button>
              <button onClick={() => { setShowMoreMenu(false); requestDelete() }} title="Delete"
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* Move confirmation when the intended slot is unavailable */}
        {pendingMove && (
          <div data-testid="move-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
              <div className="text-2xl text-center mb-2">{pendingMove.direction === 'next' ? '➡️' : '⬅️'}</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">
                Slot is already full
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                <span className="font-medium text-gray-700 dark:text-gray-300">{task.text}</span> cannot stay in{' '}
                <span className="font-medium accent-text">{formatHour(pendingMove.desiredHour)}</span> slot{' '}
                <span className="font-medium accent-text">{pendingMove.preferredSlot + 1}</span>. It will land in{' '}
                <span className="font-medium accent-text">{moveDestinationLabel}</span>.
              </p>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-3 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Landing preview</span>
                  <span className="text-sm font-medium accent-text">{formatHour(pendingMove.hour)}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, idx) => {
                    const isLanding = idx === pendingMove.slotIndex
                    const isTaken = pendingMove.occupiedSlots.includes(idx)
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                          isLanding
                            ? 'accent-bg text-white border-transparent shadow-sm'
                            : isTaken
                              ? 'bg-gray-200 dark:bg-gray-800 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                        }`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wider">Slot</div>
                        <div className="text-sm font-semibold">{idx + 1}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPendingMove(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeMove(pendingMove)}
                  className="flex-1 py-2.5 rounded-xl accent-bg text-white text-sm font-medium transition-colors active:scale-95"
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recurring delete confirmation popup */}
        {confirmingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xs p-5">
              <div className="text-2xl text-center mb-2">🔁</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">
                Delete recurring task?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                <span className="font-medium text-gray-700 dark:text-gray-300">"{task.text}"</span> is set to recur daily. This will only delete today's occurrence.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showIconPicker && (
          <IconPicker selected={task?.icon} onSelect={handleIconSelect} onClose={() => setShowIconPicker(false)} />
        )}

        {/* Dismiss confirmation */}
        {confirmingDismiss && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xs p-5">
              <div className="text-2xl text-center mb-2">📦</div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">
                Dismiss recurring task?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
                <span className="font-medium text-gray-700 dark:text-gray-300">"{task.text}"</span> will be dismissed for today and kept for audit.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmingDismiss(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={executeDismiss} className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        {/* Note panel */}
        {showNote && (
          <div className="mx-2 mb-1.5 mt-0.5">
            <NoteEditor
              content={noteText}
              onChange={val => setNoteText(val)}
              onBlur={saveNote}
            />
            <div className="flex justify-between items-center mt-1 px-0.5">
              <span className="text-xs text-gray-400">Click outside to save</span>
              <button
                onClick={() => { setNoteText(''); saveNote(); setShowNote(false) }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear note
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Editing state
  return (
    <div className="relative px-3 py-3">
      {/* Input row */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-[var(--accent)] border-opacity-50 shadow-sm">
        {/* Inferred icon preview */}
        <span className="shrink-0">
          {inferredIcon
            ? <inferredIcon.component size={16} className="accent-text" />
            : <span className="w-4 h-4 block rounded-full border-2 border-gray-300 dark:border-gray-600" />
          }
        </span>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={() => { setTimeout(() => { setShowSuggestions(false); handleSave() }, 150) }}
          disabled={saving}
          placeholder="What's the task?"
          className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
        />

        {saving
          ? <span className="text-xs text-gray-400 shrink-0">Saving…</span>
          : <span className="text-xs text-gray-400 shrink-0 hidden sm:block">↵ save · esc cancel</span>
        }
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-3 right-3 z-20 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {suggestions.map((s, i) => {
            const SIcon = s.last_icon ? getIconComponent(s.last_icon) : null
            return (
              <button
                key={i}
                onMouseDown={() => applySuggestion(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800 last:border-0"
              >
                {SIcon ? <SIcon size={14} className="accent-text shrink-0" /> : <span className="w-3.5 block shrink-0" />}
                <span className="truncate flex-1">{s.text}</span>
                <span className="text-xs text-gray-400 shrink-0 tabular-nums">×{s.use_count}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
