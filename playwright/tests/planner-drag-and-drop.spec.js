import { test, expect } from '@playwright/test'

function getLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createSettings(dateStr) {
  return {
    id: 'playwright-settings',
    pin_hash: null,
    wake_time: '09:00',
    sleep_time: '12:00',
    work_start: '09:00',
    work_end: '17:00',
    workdays: [1, 2, 3, 4, 5],
    theme: 'light',
    accent_color: '#6366f1',
    onboarding_done: true,
  }
}

async function seedPlanner(page, tasks) {
  const dateStr = getLocalDateString()
  const settings = createSettings(dateStr)
  const storeState = {
    state: {
      settings,
      tasksByDate: {
        [dateStr]: tasks,
      },
      history: [],
      lastVisitDate: dateStr,
    },
    version: 0,
  }

  await page.addInitScript(({ seededSettings, seededTasks, persistedStore }) => {
    localStorage.setItem('ft_settings', JSON.stringify(seededSettings))
    localStorage.setItem('ft_tasks', JSON.stringify(seededTasks))
    localStorage.setItem('ft_history', JSON.stringify([]))
    localStorage.setItem('five-things-store', JSON.stringify(persistedStore))
  }, {
    seededSettings: settings,
    seededTasks: tasks,
    persistedStore: storeState,
  })

  return { dateStr }
}

async function startPointerDrag(page, handleTestId) {
  const handle = page.getByTestId('planner-day-view').getByTestId(handleTestId)
  await expect(handle).toBeVisible()
  const box = await handle.boundingBox()

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 6 })
}

async function hoverHour(page, hour, yRatio = 0.5) {
  const hourCard = page.getByTestId('planner-day-view').getByTestId(`hour-slot-${hour}`)
  await expect(hourCard).toBeVisible()
  const box = await hourCard.boundingBox()

  await page.mouse.move(box.x + box.width / 2, box.y + box.height * yRatio, { steps: 10 })
  return hourCard
}

test('shows warm highlight for hovered drop targets during drag', async ({ page }) => {
  await seedPlanner(page, [
    {
      id: 'task-a',
      settings_id: 'playwright-settings',
      date: getLocalDateString(),
      hour: 9,
      slot_index: 0,
      text: 'Standup prep',
      icon: 'Briefcase',
      icon_manual: true,
      is_recurring: false,
      tag: 'work',
    },
  ])

  await page.goto('/')

  await startPointerDrag(page, 'task-drag-handle-9-0')
  const emptyTarget = await hoverHour(page, 10, 0.55)

  await expect(emptyTarget).toHaveAttribute('data-drop-active', 'true')
  await expect(emptyTarget).toHaveAttribute('data-landing-slot', '2')
  await page.mouse.up()
})

test('moves a task into an explicitly chosen empty slot', async ({ page }) => {
  const dateStr = getLocalDateString()

  await seedPlanner(page, [
    {
      id: 'task-a',
      settings_id: 'playwright-settings',
      date: dateStr,
      hour: 9,
      slot_index: 0,
      text: 'Standup prep',
      icon: 'Briefcase',
      icon_manual: true,
      is_recurring: false,
      tag: 'work',
    },
  ])

  await page.goto('/')

  await startPointerDrag(page, 'task-drag-handle-9-0')
  await hoverHour(page, 10, 0.55)
  await page.mouse.up()

  const planner = page.getByTestId('planner-day-view')
  await expect(planner.getByTestId('task-item-10-2')).toContainText('Standup prep')
  await expect(planner.getByTestId('task-tag-10-2')).toHaveText('Work')
  await expect(planner.getByTestId('task-item-9-0')).toHaveCount(0)
})

test('confirms fallback moves and preserves tags when the requested slot is full', async ({ page }) => {
  const dateStr = getLocalDateString()

  await seedPlanner(page, [
    {
      id: 'task-a',
      settings_id: 'playwright-settings',
      date: dateStr,
      hour: 9,
      slot_index: 0,
      text: 'Standup prep',
      icon: 'Briefcase',
      icon_manual: true,
      is_recurring: false,
      tag: 'work',
    },
    {
      id: 'task-b',
      settings_id: 'playwright-settings',
      date: dateStr,
      hour: 10,
      slot_index: 2,
      text: 'Already here',
      icon: 'Clock3',
      icon_manual: true,
      is_recurring: false,
      tag: 'personal',
    },
  ])

  await page.goto('/')

  await startPointerDrag(page, 'task-drag-handle-9-0')
  const fullTarget = await hoverHour(page, 10, 0.55)
  await expect(fullTarget).toHaveAttribute('data-landing-slot', '3')
  await page.mouse.up()

  await expect(page.getByTestId('drop-move-confirmation-modal')).toBeVisible()
  await expect(page.getByTestId('landing-slot-3')).toHaveAttribute('data-landing-active', 'true')

  await page.getByTestId('drop-move-confirmation-modal').getByRole('button', { name: 'Move' }).click()

  const planner = page.getByTestId('planner-day-view')
  await expect(planner.getByTestId('task-item-10-3')).toContainText('Standup prep')
  await expect(planner.getByTestId('task-tag-10-3')).toHaveText('Work')
})
