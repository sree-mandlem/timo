import { useEffect, useRef, useState } from 'react'
import { formatHour } from '../../lib/dateUtils'
import { upsertTask } from '../../lib/db'
import { useAppStore } from '../../store/useAppStore'
import TaskItem from './TaskItem'

const SLOT_COUNT = 5
const DRAG_START_EVENT = 'timo-task-drag-start'
const DRAG_MOVE_EVENT = 'timo-task-drag-move'
const DRAG_COMMIT_EVENT = 'timo-task-drag-commit'
const DRAG_END_EVENT = 'timo-task-drag-end'
let activeDragData = null

function findNearestAvailableSlot(takenSlots, preferredSlot) {
  if (!takenSlots.has(preferredSlot)) return preferredSlot

  for (let offset = 1; offset < SLOT_COUNT; offset++) {
    const higherSlot = preferredSlot + offset
    if (higherSlot < SLOT_COUNT && !takenSlots.has(higherSlot)) return higherSlot

    const lowerSlot = preferredSlot - offset
    if (lowerSlot >= 0 && !takenSlots.has(lowerSlot)) return lowerSlot
  }

  return null
}

function getPreferredSlotFromPoint(rect, y) {
  if (!rect || rect.height <= 0) return 0

  const relativeY = Math.min(Math.max(y - rect.top, 0), Math.max(rect.height - 1, 0))
  return Math.min(SLOT_COUNT - 1, Math.floor((relativeY / rect.height) * SLOT_COUNT))
}

function getNextAvailableMove(allTasks, draggedTask, requestedHour, requestedSlotIndex) {
  const tasksExcludingDragged = allTasks.filter(t => t.id !== draggedTask.id)
  const requestedOccupied = tasksExcludingDragged.some(
    t => t.hour === requestedHour && t.slot_index === requestedSlotIndex
  )

  for (let candidateHour = requestedHour; candidateHour <= 23; candidateHour++) {
    const occupiedSlots = tasksExcludingDragged
      .filter(t => t.hour === candidateHour)
      .map(t => t.slot_index)

    const candidateSlot = candidateHour === requestedHour
      ? findNearestAvailableSlot(new Set(occupiedSlots), requestedSlotIndex)
      : findNearestAvailableSlot(new Set(occupiedSlots), 0)

    if (candidateSlot != null) {
      return {
        draggedTask,
        requestedHour,
        requestedSlotIndex,
        hour: candidateHour,
        slotIndex: candidateSlot,
        occupiedSlots,
        needsConfirmation: requestedOccupied || candidateHour !== requestedHour || candidateSlot !== requestedSlotIndex,
      }
    }
  }

  return null
}

export default function HourSlot({ hour, tasks, dateStr, settingsId, isWork, isCurrent, readOnly }) {
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverSlot, setDragOverSlot] = useState(null)
  const [pendingDropMove, setPendingDropMove] = useState(null)
  const [dragPayload, setDragPayload] = useState(null)
  const hourCardRef = useRef(null)
  const updateTask = useAppStore(s => s.updateTask)

  const filledTasks = tasks.filter(t => t.text?.trim()).sort((a, b) => a.slot_index - b.slot_index)
  const occupiedSlots = new Set(filledTasks.map(t => t.slot_index))
  const emptySlotIndices = Array.from({ length: SLOT_COUNT }, (_, slotIndex) => slotIndex)
    .filter(slotIndex => !occupiedSlots.has(slotIndex))
  const nextSlot = emptySlotIndices[0] ?? null

  function getDropTargetAtPoint(x, y) {
    const rect = hourCardRef.current?.getBoundingClientRect()
    if (!rect) return null
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null

    const preferredSlot = getPreferredSlotFromPoint(rect, y)
    const landingSlot = findNearestAvailableSlot(occupiedSlots, preferredSlot)
    if (landingSlot == null) return null

    return {
      requestedSlot: preferredSlot,
      landingSlot,
    }
  }

  useEffect(() => {
    function handleExternalDragStart(event) {
      setDragPayload(event.detail ?? null)
    }

    function handleExternalDragMove(event) {
      const detail = event.detail
      if (!detail || detail.dateStr !== dateStr) return
      const target = getDropTargetAtPoint(detail.x, detail.y)
      setDragOverSlot(target?.landingSlot ?? null)
    }

    async function handleExternalDragCommit(event) {
      const detail = event.detail
      if (!detail || detail.dateStr !== dateStr) return

      const target = getDropTargetAtPoint(detail.x, detail.y)
      setDragOverSlot(target?.landingSlot ?? null)
      if (!target) return

      const allTasks = useAppStore.getState().tasksByDate[dateStr] || []
      const draggedTask = allTasks.find(t => t.id === detail.taskId)
      if (!draggedTask) return

      if (draggedTask.hour === hour && draggedTask.slot_index === target.landingSlot) return

      const movePlan = getNextAvailableMove(allTasks, draggedTask, hour, target.requestedSlot)
      if (!movePlan) return

      if (movePlan.needsConfirmation) {
        setPendingDropMove(movePlan)
        return
      }

      await executeDropMove(movePlan)
    }

    function handleExternalDragEnd() {
      activeDragData = null
      setDragPayload(null)
      setDragOverSlot(null)
      setDraggedId(null)
    }

    window.addEventListener(DRAG_START_EVENT, handleExternalDragStart)
    window.addEventListener(DRAG_MOVE_EVENT, handleExternalDragMove)
    window.addEventListener(DRAG_COMMIT_EVENT, handleExternalDragCommit)
    window.addEventListener(DRAG_END_EVENT, handleExternalDragEnd)

    return () => {
      window.removeEventListener(DRAG_START_EVENT, handleExternalDragStart)
      window.removeEventListener(DRAG_MOVE_EVENT, handleExternalDragMove)
      window.removeEventListener(DRAG_COMMIT_EVENT, handleExternalDragCommit)
      window.removeEventListener(DRAG_END_EVENT, handleExternalDragEnd)
    }
  }, [])

  function finishDragSession() {
    activeDragData = null
    setDragPayload(null)
    setDraggedId(null)
    setDragOverSlot(null)
    window.dispatchEvent(new CustomEvent(DRAG_END_EVENT))
  }

  async function executeDropMove(movePlan) {
    const { draggedTask } = movePlan
    const overflowedFromHour = movePlan.hour > draggedTask.hour
      ? (draggedTask.overflowed_from_hour ?? draggedTask.hour)
      : movePlan.hour < draggedTask.hour
        ? null
        : draggedTask.overflowed_from_hour

    const saved = await upsertTask(settingsId, {
      ...draggedTask,
      hour: movePlan.hour,
      slot_index: movePlan.slotIndex,
      overflowed_from_hour: overflowedFromHour,
    })

    updateTask(dateStr, draggedTask.id, saved)
    setPendingDropMove(null)
    finishDragSession()
  }

  function handlePointerDragStart(event, task) {
    if (readOnly) return
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const dragData = {
      taskId: task.id,
      dateStr,
      hour: task.hour,
      slotIndex: task.slot_index,
    }

    const originalUserSelect = document.body.style.userSelect
    activeDragData = dragData
    setDragPayload(dragData)
    setDraggedId(task.id)
    window.dispatchEvent(new CustomEvent(DRAG_START_EVENT, { detail: dragData }))

    function handlePointerMove(moveEvent) {
      window.dispatchEvent(new CustomEvent(DRAG_MOVE_EVENT, {
        detail: {
          ...dragData,
          x: moveEvent.clientX,
          y: moveEvent.clientY,
        },
      }))
    }

    function finishPointerDrag(endEvent) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
      document.body.style.userSelect = originalUserSelect

      if (endEvent) {
        window.dispatchEvent(new CustomEvent(DRAG_COMMIT_EVENT, {
          detail: {
            ...dragData,
            x: endEvent.clientX,
            y: endEvent.clientY,
          },
        }))
      }

      window.dispatchEvent(new CustomEvent(DRAG_END_EVENT))
    }

    function handlePointerUp(upEvent) {
      finishPointerDrag(upEvent)
    }

    function handlePointerCancel() {
      finishPointerDrag(null)
    }

    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
  }

  return (
    <div
      ref={hourCardRef}
      data-testid={`hour-slot-${hour}`}
      data-drop-active={dragOverSlot != null ? 'true' : 'false'}
      data-landing-slot={dragOverSlot != null ? String(dragOverSlot) : ''}
      className={`relative rounded-2xl shadow-sm transition-colors ${
        dragPayload && dragOverSlot != null
          ? 'bg-amber-200/85 ring-2 ring-amber-300 dark:bg-amber-700/25 dark:ring-amber-400/80'
          : dragPayload
            ? 'bg-amber-50/70 ring-1 ring-amber-200/70 dark:bg-amber-950/50 dark:ring-amber-500/20'
            : isCurrent
              ? 'bg-[color-mix(in_srgb,var(--accent)_8%,white)] dark:bg-[color-mix(in_srgb,var(--accent)_12%,#111827)] ring-1 ring-[var(--accent)] ring-opacity-30'
              : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className={`flex items-center gap-2 px-4 pt-3 pb-1 border-b ${
        isCurrent
          ? 'border-[color-mix(in_srgb,var(--accent)_20%,transparent)]'
          : isWork
            ? 'border-blue-100 dark:border-blue-900/40'
            : 'border-gray-100 dark:border-gray-800'
      }`}>
        <span className={`text-xs font-semibold uppercase tracking-wider tabular-nums ${
          isCurrent ? 'accent-text' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {formatHour(hour)}
        </span>
        {isWork && !isCurrent && (
          <span className="text-xs text-blue-400 dark:text-blue-500 font-medium">· Work</span>
        )}
        {isCurrent && (
          <span className="text-xs accent-text font-medium">· Now</span>
        )}
      </div>

      <div className="relative min-h-[3.5rem]">
        <div className={`divide-y divide-gray-100 transition-opacity dark:divide-gray-800 ${dragPayload ? 'opacity-30' : 'opacity-100'}`}>
          {filledTasks.map(task => {
            const slotIndex = task.slot_index
            const isDraggedTask = draggedId === task.id

            return (
              <div
                key={`${hour}-${slotIndex}`}
                data-testid={`planner-task-slot-${hour}-${slotIndex}`}
                data-drop-active={dragOverSlot === slotIndex ? 'true' : 'false'}
                className="px-2 transition-colors"
              >
                <div className="relative rounded-lg transition-all">
                  <TaskItem
                    task={task}
                    dateStr={dateStr}
                    hour={hour}
                    slotIndex={task.slot_index}
                    settingsId={settingsId}
                    isDragging={isDraggedTask}
                    readOnly={readOnly}
                    dragHandleProps={{
                      onPointerDown: event => handlePointerDragStart(event, task),
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {!readOnly && !dragPayload && nextSlot != null && (
          <div className="border-t border-gray-100 px-2 py-2 dark:border-gray-800">
            <TaskItem
              task={null}
              dateStr={dateStr}
              hour={hour}
              slotIndex={nextSlot}
              settingsId={settingsId}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>

      {pendingDropMove && (
        <div data-testid="drop-move-confirmation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="text-2xl text-center mb-2">🟨</div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-1">
              Requested slot is full
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
              <span className="font-medium text-gray-700 dark:text-gray-300">{pendingDropMove.draggedTask.text}</span> cannot land in{' '}
              <span className="font-medium accent-text">{formatHour(pendingDropMove.requestedHour)}</span> slot{' '}
              <span className="font-medium accent-text">{pendingDropMove.requestedSlotIndex + 1}</span>. It will move to{' '}
              <span className="font-medium accent-text">{formatHour(pendingDropMove.hour)} · slot {pendingDropMove.slotIndex + 1}</span>.
            </p>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-3 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Landing preview</span>
                <span className="text-sm font-medium accent-text">{formatHour(pendingDropMove.hour)}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: SLOT_COUNT }, (_, idx) => {
                  const isLanding = idx === pendingDropMove.slotIndex
                  const isTaken = pendingDropMove.occupiedSlots.includes(idx)

                  return (
                    <div
                      key={idx}
                      data-testid={`landing-slot-${idx}`}
                      data-landing-active={isLanding ? 'true' : 'false'}
                      className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                        isLanding
                          ? 'bg-amber-200 text-amber-950 border-amber-300 shadow-sm dark:bg-amber-500/80 dark:text-gray-950 dark:border-amber-400'
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
                onClick={() => setPendingDropMove(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDropMove(pendingDropMove)}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 text-sm font-medium transition-colors active:scale-95"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
