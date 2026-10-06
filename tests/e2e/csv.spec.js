import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createEntry } from '../../src/utils/entry.js'

async function download(page, name) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name, exact: true }).click()
  const file = await pending
  expect(await file.failure()).toBeNull()
  return { file, buffer: readFileSync(await file.path()) }
}

async function backup(page) {
  const { buffer } = await download(page, '전체 데이터 내보내기')
  return JSON.parse(buffer.toString('utf8'))
}

function parseCsv(buffer) {
  expect([...buffer.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
  const text = buffer.toString('utf8').slice(1)
  const rows = []
  let row = [], cell = '', quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1 }
      else quoted = !quoted
    } else if (character === ',' && !quoted) { row.push(cell); cell = '' }
    else if (character === '\r' && text[index + 1] === '\n' && !quoted) {
      row.push(cell); rows.push(row); row = []; cell = ''; index += 1
    } else {
      if (character === '\n' && !quoted) throw new Error('CSV rows must use CRLF')
      cell += character
    }
  }
  expect(quoted).toBe(false)
  if (row.length || cell) { row.push(cell); rows.push(row) }
  expect(rows[0]).toContain('차 이름')
  expect(rows[0]).toHaveLength(26)
  for (const values of rows) expect(values).toHaveLength(rows[0].length)
  return { headers: rows[0], records: rows.slice(1).map((values) => Object.fromEntries(rows[0].map((header, index) => [header, values[index]]))) }
}

function observeErrors(page) {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
  return errors
}

test('CSV downloads all saved stories in Korean without changing JSON backup, photos, options or draft', async ({ page, context }) => {
  const errors = observeErrors(page)
  await page.goto('./#/settings')
  await expect(page.getByRole('heading', { name: '나의 일기장 설정' })).toBeVisible()
  const fixture = await backup(page)
  const older = createEntry()
  Object.assign(older.tea, { name: '운남 "보이", 차', category: '보이차', amount: 0 })
  Object.assign(older.brewing, { volume: 0, waterTemperature: 0, steepTime: 0 })
  Object.assign(older.context, { date: '2025-01-02', time: '09:30' })
  older.experience.notes = '첫 잔, "부드럽게"\n두 번째 잔은 더 따뜻하게'
  older.tags = ['쉼, 바람', '"따뜻함"']
  older.photos = [{ id: 'csv-photo', name: '찻잔.png', data: `data:image/png;base64,${readFileSync('public/icons/icon-192.png').toString('base64')}` }]
  const newer = createEntry()
  Object.assign(newer.tea, { name: '새벽 보이차', category: '보이차' })
  Object.assign(newer.context, { date: '2025-02-03', time: '10:00', reason: '=1+1' })
  newer.experience.rating = 5
  newer.favorite = true
  const draft = createEntry()
  draft.tea.name = 'CSV에 담지 않을 작성 중 초안'
  fixture.data.entries = [older, newer]
  fixture.data.categories.push({ id: 'csv-category', name: 'CSV에 담지 않을 선택 목록' })
  fixture.data.settings = [{ key: 'draft', value: draft }]
  await page.locator('#backup-file').setInputFiles({ name: 'csv-fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  await page.getByRole('dialog').getByRole('radio', { name: /^전체 교체/ }).check()
  await page.getByRole('button', { name: '전체 교체하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const before = await backup(page)

  // A list filter must not limit the complete export from Settings.
  await page.getByRole('navigation').getByRole('link', { name: '기록', exact: true }).click()
  await page.getByLabel('차 이름, 메모, 태그 검색').fill('새벽')
  await expect(page.locator('.tea-card')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: '설정', exact: true }).click()
  const { file, buffer } = await download(page, '차 기록 CSV 내보내기')
  expect(file.suggestedFilename()).toMatch(/^tea-life-story-.*\.csv$/)
  const { records } = parseCsv(buffer)
  expect(records).toHaveLength(2)
  expect(records.map((record) => record['기록 ID'])).toEqual([newer.id, older.id])
  expect(records[0]['차 이름']).toBe('새벽 보이차')
  expect(records[0]['별점']).toBe('5')
  expect(records[0]['즐겨찾기']).toBe('예')
  expect(records[0]['마신 이유']).toBe('\t=1+1')
  expect(records[1]['차 이름']).toBe(older.tea.name)
  expect(records[1]['메모'].replaceAll('\r\n', '\n')).toBe(older.experience.notes)
  expect(records[1]['태그']).toBe('쉼, 바람; "따뜻함"')
  expect(records[1]['별점']).toBe('')
  for (const header of ['차 사용량(g)', '물 용량(cc)', '물 온도(°C)', '우림 시간(초)']) expect(records[1][header]).toBe('0')
  expect(records[1]['즐겨찾기']).toBe('아니오')
  expect(records[1]['사진 수']).toBe('1')
  expect(buffer.toString('utf8')).not.toContain('data:image/')
  expect(buffer.toString('utf8')).not.toContain(draft.tea.name)
  expect(buffer.toString('utf8')).not.toContain('CSV에 담지 않을 선택 목록')
  expect((await backup(page)).data).toEqual(before.data)

  await page.locator('#backup-file').setInputFiles({ name: file.suggestedFilename(), mimeType: 'text/csv', buffer })
  await expect(page.getByRole('alert')).toContainText('백업을 읽을 수 없습니다')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await backup(page)).data).toEqual(before.data)
  await page.reload()
  expect((await backup(page)).data).toEqual(before.data)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText(/오프라인 ·/)).toBeVisible()
  const offline = await download(page, '차 기록 CSV 내보내기')
  expect(offline.buffer).toEqual(buffer)
  expect((await backup(page)).data).toEqual(before.data)
  expect(errors).toEqual([])
})

test('empty CSV includes headers; export button is accessible without overflow at 360/390/430px', async ({ page }) => {
  const errors = observeErrors(page)
  await page.goto('./#/settings')
  await expect(page.getByRole('heading', { name: '나의 일기장 설정' })).toBeVisible()
  const before = await backup(page)
  expect(before.data.entries).toEqual([])
  const { buffer } = await download(page, '차 기록 CSV 내보내기')
  expect(parseCsv(buffer).records).toEqual([])
  expect((await backup(page)).data).toEqual(before.data)
  const button = page.getByRole('button', { name: '차 기록 CSV 내보내기', exact: true })
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await button.scrollIntoViewIfNeeded()
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
    const layout = await button.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const center = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      return { overflow: document.documentElement.scrollWidth > innerWidth, left: bounds.left, right: bounds.right, height: bounds.height, clickable: element === center || element.contains(center) }
    })
    expect(layout.overflow).toBe(false)
    expect(layout.left).toBeGreaterThanOrEqual(0)
    expect(layout.right).toBeLessThanOrEqual(width)
    expect(layout.height).toBeGreaterThanOrEqual(44)
    expect(layout.clickable).toBe(true)
    const hint = page.getByText(/^CSV는 표로 보는 용도/)
    await hint.scrollIntoViewIfNeeded()
    const readable = await hint.evaluate((element) => element.getBoundingClientRect().bottom <= document.querySelector('.bottom-nav').getBoundingClientRect().top)
    expect(readable).toBe(true)
  }
  expect(errors).toEqual([])
})
