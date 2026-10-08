import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createEntry } from '../../src/utils/entry.js'

const nav = (page, name) => page.getByRole('navigation').getByRole('link', { name, exact: true }).click()

function observeErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  return errors
}

async function backup(page) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).click()
  const download = await pending
  expect(await download.failure()).toBeNull()
  return JSON.parse(readFileSync(await download.path(), 'utf8'))
}

function story(id, name, date, { category = '', rating = 0, favorite = false, time = '09:00' } = {}) {
  const entry = createEntry()
  Object.assign(entry, { id, favorite, createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-01-10T00:00:00.000Z' })
  Object.assign(entry.tea, { name, category })
  Object.assign(entry.context, { date, time })
  entry.experience.rating = rating
  return entry
}

function monthlyStories() {
  return [
    story('stats-favorite-low', '평점보다 마음에 남은 홍차', '2026-01-04', { category: '홍차', rating: 2, favorite: true }),
    story('stats-favorite-unrated', '별점을 남기지 않은 즐겨찾기', '2026-01-05', { category: '녹차', favorite: true }),
    story('stats-five', '다섯 별의 아침 녹차', '2026-01-05', { category: '녹차', rating: 5, time: '08:00' }),
    story('stats-four', '조금 더 최근에 마신 홍차', '2026-01-06', { category: '홍차', rating: 4 }),
    story('stats-uncategorized', '종류와 평점을 비운 이야기', '2026-01-06'),
    story('stats-december-a', '지난해 마지막 달 백차', '2025-12-31', { category: '백차', rating: 3 }),
    story('stats-december-b', '지난해 마지막 달 청차', '2025-12-31', { category: '청차', rating: 4, time: '18:00' }),
    story('stats-november', '가을 보이차', '2025-11-02', { category: '보이차' }),
    story('stats-september', '구월의 차', '2025-09-03'),
    story('stats-july', '최근 여섯 달에 포함하지 않는 차', '2025-07-04', { rating: 5 }),
    story('stats-future', '선택한 달 이후의 차', '2026-02-01', { rating: 5 }),
    story('stats-undated', '날짜 없이 남긴 차', '', { rating: 5, favorite: true }),
    story('stats-earliest', '연도 하한의 차', '0001-01-01', { rating: 4 }),
  ]
}

async function restore(page, entries) {
  await page.goto('./#/settings')
  await expect(page.getByRole('heading', { name: '나의 일기장 설정', exact: true })).toBeVisible()
  const fixture = await backup(page)
  fixture.data.entries = entries
  fixture.data.categories.push({ id: 'stats-custom-category', name: '통계 검수 선택 목록' })
  const draft = story('stats-draft', '통계를 보아도 보존할 초안', '2026-01-01')
  draft.experience.notes = '작성 중인 메모와 태그도 그대로 남아야 합니다.'
  draft.tags = ['초안 보존']
  fixture.data.settings = [{ key: 'draft', value: draft }]
  entries[0].photos = [{ id: 'stats-photo', name: '검수 찻잔.png', data: `data:image/png;base64,${readFileSync('public/icons/icon-192.png').toString('base64')}` }]
  await page.locator('#backup-file').setInputFiles({ name: 'stats-fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  await page.getByRole('dialog').getByRole('radio', { name: /^전체 교체/ }).check()
  await page.getByRole('button', { name: '전체 교체하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const before = await backup(page)
  await nav(page, '통계')
  await expect(page.getByRole('heading', { name: '나의 차 취향', exact: true })).toBeVisible()
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  return before.data
}

test('monthly insight uses recorded days, rated samples and category shares; memories open without changing backups', async ({ page, context }) => {
  const errors = observeErrors(page)
  const before = await restore(page, monthlyStories())
  await expect(page.locator('.stat-card').nth(0)).toContainText('5 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('3.7')
  await expect(page.locator('.stat-card').nth(1)).toContainText('평점 입력 3건')
  await expect(page.locator('.stats-journal-note')).toContainText('3일')
  await expect(page.locator('.stats-journal-note')).toContainText('2건')
  const rows = page.locator('.bar-row')
  await expect(rows).toHaveCount(3)
  for (const [index, name, count, percent, rating] of [
    [0, '녹차', 2, 40, '평균 5.0 / 5 · 평점 입력 1건'],
    [1, '홍차', 2, 40, '평균 3.0 / 5 · 평점 입력 2건'],
    [2, '미분류', 1, 20, '평점 미입력'],
  ]) {
    await expect(rows.nth(index)).toContainText(name)
    await expect(rows.nth(index)).toContainText(`${count}건`)
    await expect(rows.nth(index)).toContainText(`${percent}%`)
    await expect(rows.nth(index)).toContainText(rating)
  }
  await expect(page.locator('.stats-undated-note')).toContainText('1건')
  const memories = page.locator('.stats-highlights .stats-memory')
  await expect(memories).toHaveCount(3)
  for (const [index, id] of ['stats-favorite-low', 'stats-favorite-unrated', 'stats-five'].entries()) {
    await expect(memories.nth(index)).toHaveAttribute('href', new RegExp(`#/entries/${id}$`))
  }
  await memories.first().click()
  await expect(page.getByRole('heading', { name: '평점보다 마음에 남은 홍차', exact: true })).toBeVisible()
  await expect(page.locator('.detail-photos img')).toHaveCount(1)
  await nav(page, '통계')
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  await page.reload()
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  await expect(page.locator('.stat-card').nth(0)).toContainText('5 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('3.7')
  await nav(page, '설정')
  expect((await backup(page)).data).toEqual(before)
  await nav(page, '통계')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  await expect(page.locator('.stat-card').nth(0)).toContainText('5 건')
  await page.getByRole('button', { name: '2025년 12월 · 기록 2건', exact: true }).click()
  await expect(page.locator('.stat-card').nth(0)).toContainText('2 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('3.5')
  await page.locator('.stats-highlights .stats-memory').first().click()
  await expect(page.getByRole('heading', { name: '지난해 마지막 달 청차', exact: true })).toBeVisible()
  await nav(page, '설정')
  expect((await backup(page)).data).toEqual(before)
  expect(errors).toEqual([])
})

test('six-month history includes zero months across years; clicking, empty month, blank month and year one are consistent', async ({ page }) => {
  const errors = observeErrors(page)
  await restore(page, monthlyStories())
  const trend = page.locator('.month-trend .trend-month')
  await expect(trend).toHaveCount(6)
  const labels = await trend.evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
  expect(labels).toEqual([
    '2025년 8월 · 기록 0건', '2025년 9월 · 기록 1건', '2025년 10월 · 기록 0건',
    '2025년 11월 · 기록 1건', '2025년 12월 · 기록 2건', '2026년 1월 · 기록 5건',
  ])
  await page.getByRole('button', { name: '2025년 12월 · 기록 2건', exact: true }).click()
  await expect(page.getByLabel('돌아보고 싶은 달', { exact: true })).toHaveValue('2025-12')
  await expect(page.locator('.stat-card').nth(0)).toContainText('2 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('3.5')
  await expect(page.locator('.stats-journal-note')).toContainText('1일')
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-03')
  await expect(page.locator('.stat-card').nth(0)).toContainText('0 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('—')
  await expect(page.getByRole('heading', { name: '선택한 달의 기록이 없어요', exact: true })).toBeVisible()
  await expect(trend).toHaveCount(6)
  await expect(page.locator('.stats-highlights .stats-memory')).toHaveCount(0)
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('')
  await expect(page.getByRole('heading', { name: '돌아볼 달을 선택해 주세요', exact: true })).toBeVisible()
  await expect(page.locator('.stat-card').nth(0)).toContainText('0 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('—')
  await expect(trend).toHaveCount(0)
  await expect(page.locator('.stats-highlights')).toHaveCount(0)
  await expect(page.locator('.bar-row')).toHaveCount(0)
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('0001-01')
  await expect(page.locator('.stat-card').nth(0)).toContainText('1 건')
  await expect(page.locator('.stat-card').nth(1)).toContainText('4.0')
  await expect(trend).toHaveCount(1)
  await expect(trend).toHaveAttribute('aria-label', '0001년 1월 · 기록 1건')
  expect(errors).toEqual([])
})

test('long category names and diary memories fit 360/390/430px with usable trend and bottom navigation', async ({ page }) => {
  const errors = observeErrors(page)
  const entries = [0, 1, 2].map((index) => story(`stats-long-${index}`, `${'차 자리에서 천천히 남긴 길고 따뜻한 이야기 '.repeat(8)}${index}`, `2026-01-0${index + 1}`, {
    category: `${'아주길게붙여쓴나의차종류'.repeat(7)}${index}`,
    rating: index + 3, favorite: true,
  }))
  entries.forEach((entry) => {
    entry.tea.name = entry.tea.name.slice(0, 200)
    entry.tea.category = entry.tea.category.slice(0, 100)
    entry.experience.feeling = '차를 마시며 남긴 마음의 문장과 오래 기억하고 싶은 시간. '.repeat(12)
  })
  await restore(page, entries)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await page.getByLabel('돌아보고 싶은 달', { exact: true }).scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const selected = page.getByRole('button', { name: '2026년 1월 · 기록 3건', exact: true })
    await selected.scrollIntoViewIfNeeded()
    const touch = await selected.evaluate((button) => {
      const box = button.getBoundingClientRect()
      const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return { width: box.width, height: box.height, clickable: button === target || button.contains(target) }
    })
    expect(touch.height).toBeGreaterThanOrEqual(44)
    expect(touch.width).toBeGreaterThanOrEqual(44)
    expect(touch.clickable).toBe(true)
    const last = page.locator('.stats-highlights .stats-memory').last()
    await last.scrollIntoViewIfNeeded()
    const layout = await last.evaluate((link) => {
      const box = link.getBoundingClientRect()
      const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        bottom: box.bottom, navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top,
        clickable: link === target || link.contains(target),
      }
    })
    expect(layout.overflow).toBe(false)
    expect(layout.bottom).toBeLessThanOrEqual(layout.navTop)
    expect(layout.clickable).toBe(true)
    await page.screenshot({ path: `test-results/stats-stories-${width}.png`, fullPage: true })
    await nav(page, '기록')
    await expect(page.locator('.tea-card')).toHaveCount(3)
    await nav(page, '통계')
    await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  }
  expect(errors).toEqual([])
})
