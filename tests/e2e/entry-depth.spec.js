import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { nav } from './helpers/navigation.js'
import { chooseOption, openDetails } from './helpers/entry-form.js'

function diagnostics(page) {
  const issues = []
  page.on('pageerror', (error) => issues.push(error.message))
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) issues.push(message.text()) })
  return issues
}
async function backup(page) {
  await nav(page, '설정')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).click()
  return JSON.parse(readFileSync(await (await pending).path(), 'utf8'))
}
async function closeDetails(page) {
  await page.getByRole('button', { name: '세부 항목 접기', exact: true }).click()
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.entry-details-toggle')).toBeEnabled()
}
async function restore(page, data) {
  await page.locator('#backup-file').setInputFiles({ name: 'depth.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  await page.getByRole('radio', { name: /^전체 교체/ }).check()
  await page.getByRole('button', { name: '전체 교체하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

test('simple first entry is complete with a name; mobile controls remain reachable and details can be added later', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/entries/new')
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByLabel('물 온도', { exact: true })).toBeHidden()
  await expect(page.getByLabel('한 줄 감상', { exact: true })).toBeVisible()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await page.getByLabel('차 이름 *').scrollIntoViewIfNeeded()
    const name = await page.getByLabel('차 이름 *').evaluate((input) => ({ bottom: input.getBoundingClientRect().bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top }))
    expect(name.bottom).toBeLessThanOrEqual(name.saveTop)
    await page.locator('.entry-details-toggle').evaluate((button) => button.scrollIntoView({ block: 'center' }))
    const layout = await page.locator('.entry-details-toggle').evaluate((button) => {
      const box = button.getBoundingClientRect()
      return { overflow: document.documentElement.scrollWidth > innerWidth, height: box.height, bottom: box.bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top, visible: document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === button || button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) }
    })
    expect(layout.overflow).toBe(false)
    expect(layout.height).toBeGreaterThanOrEqual(44)
    expect(layout.bottom).toBeLessThanOrEqual(layout.saveTop)
    expect(layout.visible).toBe(true)
    await page.screenshot({ path: `test-results/entry-depth-simple-${width}.png` })
  }
  await page.getByLabel('차 이름 *').fill('간단히 남긴 차')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '간단히 남긴 차', exact: true })).toBeVisible()
  const saved = (await backup(page)).data.entries[0]
  expect(saved.tea.amount).toBeNull()
  expect(saved.experience.rating).toBe(0)
  expect(saved.brewing).toMatchObject({ tool: '', volume: null, waterTemperature: null, steepTime: null })
  await nav(page, '기록')
  await page.locator('.tea-card').click()
  await page.getByRole('link', { name: '기록 수정', exact: true }).click()
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('button', { name: '날짜·시간 수정', exact: true }).click()
  await expect(page.getByLabel('날짜 · When')).toBeFocused()
  await page.getByLabel('물 온도', { exact: true }).fill('90')
  await closeDetails(page)
  await page.getByRole('button', { name: '수정 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '간단히 남긴 차', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.detail-brew')).toContainText('90 °C')
  expect((await backup(page)).data.entries).toHaveLength(1)
  expect(issues).toEqual([])
})

test('collapsing preserves numeric zero, long feelings, photos, tags and draft data, then saves all hidden fields', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/entries/new')
  await page.getByLabel('차 이름 *').fill('상세 내용을 간직한 차')
  const feeling = '차향과 함께 천천히 이어지는 이야기. '.repeat(40)
  await page.getByLabel('한 줄 감상', { exact: true }).fill(feeling)
  await openDetails(page)
  await chooseOption(page, '사용한 차구', '개완')
  for (const [label, value] of [['차 사용량', '4.5'], ['물 용량', '175'], ['물 온도', '0'], ['우림 시간', '0']]) await page.getByLabel(label, { exact: true }).fill(value)
  await page.getByLabel('장소 · Where').fill('창가')
  await page.getByLabel('향', { exact: true }).fill('꽃향')
  await page.getByLabel('태그', { exact: true }).fill('아침, 산뜻함')
  await page.getByLabel('메모', { exact: true }).fill('두 번째 잔도 기대된다')
  await page.locator('input[type=file]').setInputFiles('public/icons/icon-192.png')
  await expect(page.locator('.photo-grid img')).toHaveCount(1)
  await expect(page.getByText('초안 저장됨', { exact: true })).toBeVisible()
  const before = await backup(page)
  const draft = before.data.settings.find((item) => item.key === 'draft').value
  await nav(page, '새 기록')
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await closeDetails(page)
  await expect(page.getByText('세부 항목 10개도 함께 저장돼요.', { exact: true })).toBeVisible()
  for (const label of ['물 온도', '우림 시간']) await expect(page.getByLabel(label, { exact: true })).toHaveValue('0')
  await expect(page.getByLabel('한 줄 감상', { exact: true })).toHaveValue(feeling)
  await page.reload()
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'false')
  await openDetails(page)
  await expect(page.locator('.photo-grid img')).toHaveCount(1)
  await expect(page.getByLabel('태그', { exact: true })).toHaveValue('아침, 산뜻함')
  await closeDetails(page)
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '상세 내용을 간직한 차', exact: true })).toBeVisible()
  const final = await backup(page)
  const entry = final.data.entries[0]
  for (const key of ['tea', 'brewing', 'context', 'experience', 'photos', 'tags', 'favorite']) expect(entry[key]).toEqual(draft[key])
  expect(final.data.settings.some((item) => item.key === 'draft')).toBe(false)
  await nav(page, '기록')
  await page.locator('.tea-card').click()
  await page.getByRole('link', { name: '기록 수정', exact: true }).click()
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('link', { name: '기록으로', exact: true }).click()
  await nav(page, '새 기록')
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'false')
  expect(issues).toEqual([])
})

test('last display preference survives refresh, offline writing and JSON restore; old backups default to simple entry', async ({ page, context, browser }) => {
  const issues = diagnostics(page)
  await page.goto('./#/entries/new')
  await openDetails(page)
  await nav(page, '기록')
  await nav(page, '새 기록')
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.entry-details-toggle')).toBeEnabled()
  await page.reload()
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'true')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.getByLabel('차 이름 *').fill('오프라인 작성 방식')
  await page.getByLabel('우림 시간', { exact: true }).fill('30')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '오프라인 작성 방식', exact: true })).toBeVisible()
  const expanded = await backup(page)
  expect(expanded.data.settings).toContainEqual({ key: 'entryDetailsExpanded', value: true })
  const settingsURL = page.url()
  const restoredContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
  try {
    const restored = await restoredContext.newPage()
    await restored.goto(settingsURL)
    await restore(restored, expanded)
    await nav(restored, '새 기록')
    await expect(restored.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'true')
    await closeDetails(restored)
    await nav(restored, '설정')
    const old = structuredClone(expanded)
    old.data.settings = old.data.settings.filter((item) => item.key !== 'entryDetailsExpanded')
    await restore(restored, old)
    await nav(restored, '새 기록')
    await expect(restored.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'false')
    expect((await backup(restored)).data.entries).toEqual(expanded.data.entries)
  } finally { await restoredContext.close() }
  expect(issues).toEqual([])
})

test('hidden invalid input is revealed before saving; preference and record write failures keep content and prior data', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/entries/new')
  await page.getByLabel('차 이름 *').fill('실패에도 남는 작성 내용')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'settings' && args[0].key === 'entryDetailsExpanded') { IDBObjectStore.prototype.put = original; throw new DOMException('Test failure', 'QuotaExceededError') }
      return original.apply(this, args)
    }
  })
  await openDetails(page)
  await expect(page.getByRole('alert')).toContainText('이번 기록의 입력 내용은 유지됩니다')
  await expect(page.getByLabel('차 이름 *')).toHaveValue('실패에도 남는 작성 내용')
  await page.getByLabel('물 온도', { exact: true }).fill('101')
  await closeDetails(page)
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.locator('.entry-details-toggle')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByLabel('물 온도', { exact: true })).toBeFocused()
  await expect(page).toHaveURL(/#\/entries\/new$/)
  await page.getByLabel('물 온도', { exact: true }).fill('95')
  await closeDetails(page)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'entries') { IDBObjectStore.prototype.put = original; throw new DOMException('Test failure', 'QuotaExceededError') }
      return original.apply(this, args)
    }
  })
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('작성 내용은 유지됩니다')
  await expect(page.getByLabel('물 온도', { exact: true })).toHaveValue('95')
  const failed = await backup(page)
  expect(failed.data.entries).toEqual([])
  expect(failed.data.settings.find((item) => item.key === 'draft').value.brewing.waterTemperature).toBe(95)
  await nav(page, '새 기록')
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '실패에도 남는 작성 내용', exact: true })).toBeVisible()
  expect((await backup(page)).data.entries).toHaveLength(1)
  expect(issues).toEqual([])
})
