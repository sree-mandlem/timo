/**
 * Database service — wraps Supabase calls with localStorage fallback.
 * All public functions accept/return plain JS objects.
 */
import { supabase } from './supabase'
import { toDateString } from './dateUtils'

const LS_SETTINGS = 'ft_settings'
const LS_TASKS = 'ft_tasks'
const LS_HISTORY = 'ft_history'

// ─── helpers ────────────────────────────────────────────────────────────────

function lsGet(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

function randomUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Fallback for HTTP (crypto.randomUUID is HTTPS-only)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function loadSettings() {
  if (supabase) {
    const { data } = await supabase.from('user_settings').select('*').limit(1).maybeSingle()
    return data
  }
  return lsGet(LS_SETTINGS)
}

export async function saveSettings(settings) {
  if (supabase) {
    if (settings.id) {
      const { data, error } = await supabase
        .from('user_settings').update(settings).eq('id', settings.id).select().single()
      if (error) console.error('saveSettings update error:', error)
      return data
    } else {
      const { id: _ignored, ...payload } = settings
      const { data, error } = await supabase
        .from('user_settings').insert(payload).select().single()
      if (error) console.error('saveSettings insert error:', error)
      return data
    }
  }
  const id = settings.id || randomUUID()
  const updated = { ...settings, id }
  lsSet(LS_SETTINGS, updated)
  return updated
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function loadTasksForDate(settingsId, dateStr) {
  if (!settingsId) return []
  if (supabase) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('settings_id', settingsId)
      .eq('date', dateStr)
      .order('hour').order('slot_index')
    return data || []
  }
  const all = lsGet(LS_TASKS, [])
  return all.filter(t => t.date === dateStr)
}

export async function upsertTask(settingsId, task) {
  if (!settingsId) return task
  const record = { ...task, settings_id: settingsId }
  if (supabase) {
    if (record.id) {
      // Explicit UPDATE — avoids Supabase upsert conflict issues
      const { data, error } = await supabase
        .from('tasks').update(record).eq('id', record.id).select().single()
      if (error) console.error('upsertTask update error:', error)
      return data || record
    } else {
      record.id = randomUUID()
      const { data, error } = await supabase
        .from('tasks').insert(record).select().single()
      if (error) console.error('upsertTask insert error:', error)
      return data || record
    }
  }
  const all = lsGet(LS_TASKS, [])
  if (record.id) {
    const idx = all.findIndex(t => t.id === record.id)
    if (idx >= 0) all[idx] = record; else all.push(record)
  } else {
    record.id = randomUUID()
    all.push(record)
  }
  lsSet(LS_TASKS, all)
  return record
}

export async function deleteTask(settingsId, taskId) {
  if (!settingsId) return
  if (supabase) {
    const { error } = await supabase
      .from('tasks').delete().eq('id', taskId).eq('settings_id', settingsId)
    if (error) console.error('deleteTask error:', error)
    return
  }
  const all = lsGet(LS_TASKS, [])
  lsSet(LS_TASKS, all.filter(t => t.id !== taskId))
}

/** Defer task to a target date at original hour/slot (falls back to same hour, first free slot) */
export async function deferTask(settingsId, task, toDateStr) {
  const targetHour = task.original_hour ?? task.hour
  const prefSlot = task.original_slot_index ?? task.slot_index

  const tasksOnTarget = await loadTasksForDate(settingsId, toDateStr)
  const takenSlots = new Set(tasksOnTarget.filter(t => t.hour === targetHour).map(t => t.slot_index))
  let targetSlot = takenSlots.has(prefSlot) ? 0 : prefSlot
  while (takenSlots.has(targetSlot) && targetSlot < 5) targetSlot++

  const saved = await upsertTask(settingsId, {
    date: toDateStr,
    hour: targetHour,
    slot_index: targetSlot,
    text: task.text,
    icon: task.icon,
    icon_manual: task.icon_manual,
    is_recurring: task.is_recurring,
    original_hour: task.original_hour ?? task.hour,
    original_slot_index: task.original_slot_index ?? task.slot_index,
    deferred_from_date: task.date,
  })
  await deleteTask(settingsId, task.id)
  return saved
}

/** Load all tasks across a list of date strings (for weekly stats) */
export async function loadWeeklyTasks(settingsId, weekDates) {
  if (!settingsId) return []
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('settings_id', settingsId)
      .in('date', weekDates)
    if (error) console.error('loadWeeklyTasks error:', error)
    return data || []
  }
  const all = lsGet(LS_TASKS, [])
  return all.filter(t => weekDates.includes(t.date))
}

/** Copy all recurring tasks from srcDate to destDate (skip if already exists) */
export async function copyRecurringTasks(settingsId, srcDateStr, destDateStr) {
  const srcTasks = await loadTasksForDate(settingsId, srcDateStr)
  const recurring = srcTasks.filter(t => t.is_recurring && t.text.trim())
  const destTasks = await loadTasksForDate(settingsId, destDateStr)

  for (const t of recurring) {
    const existing = destTasks.find(d => d.hour === t.hour && d.slot_index === t.slot_index)
    if (existing) {
      // Already copied — update tag if source has one and dest is missing it
      if (t.tag && !existing.tag) {
        await upsertTask(settingsId, { ...existing, tag: t.tag })
      }
    } else {
      await upsertTask(settingsId, {
        date: destDateStr,
        hour: t.hour,
        slot_index: t.slot_index,
        text: t.text,
        icon: t.icon,
        icon_manual: t.icon_manual,
        is_recurring: true,
        tag: t.tag ?? null,
      })
    }
  }
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function loadHistory(settingsId) {
  if (!settingsId) return []
  if (supabase) {
    const { data } = await supabase
      .from('task_history')
      .select('*')
      .eq('settings_id', settingsId)
      .order('use_count', { ascending: false })
    return data || []
  }
  return lsGet(LS_HISTORY, [])
}

export async function recordHistory(settingsId, text, hour, icon) {
  if (!settingsId) return
  const normalized = text.trim().toLowerCase()
  if (!normalized) return

  if (supabase) {
    const { data: existing } = await supabase
      .from('task_history')
      .select('id, use_count')
      .eq('settings_id', settingsId)
      .eq('text', normalized)
      .eq('hour', hour)
      .maybeSingle()

    if (existing) {
      await supabase.from('task_history').update({
        use_count: existing.use_count + 1,
        last_icon: icon,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabase.from('task_history').insert({
        settings_id: settingsId,
        text: normalized,
        hour,
        use_count: 1,
        last_icon: icon,
      })
    }
    return
  }

  const all = lsGet(LS_HISTORY, [])
  const idx = all.findIndex(h => h.text === normalized && h.hour === hour)
  if (idx >= 0) {
    all[idx].use_count += 1
    all[idx].last_icon = icon
  } else {
    all.push({ id: crypto.randomUUID(), text: normalized, hour, use_count: 1, last_icon: icon })
  }
  lsSet(LS_HISTORY, all)
}

export async function getSuggestions(settingsId, partial, hour) {
  if (!settingsId || !partial || partial.length < 1) return []
  const lower = partial.toLowerCase()

  if (supabase) {
    const { data } = await supabase
      .from('task_history')
      .select('text, last_icon, use_count')
      .eq('settings_id', settingsId)
      .eq('hour', hour)
      .ilike('text', `${lower}%`)
      .order('use_count', { ascending: false })
      .limit(5)
    return data || []
  }

  const all = lsGet(LS_HISTORY, [])
  return all
    .filter(h => h.hour === hour && h.text.startsWith(lower))
    .sort((a, b) => b.use_count - a.use_count)
    .slice(0, 5)
}
