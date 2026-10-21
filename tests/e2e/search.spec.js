import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createEntry, localDate } from '../../src/utils/entry.js'
import { nav } from './helpers/navigation.js'

function record(name, date, category = '녹차') {
  const value = createEntry()
  value.tea.name = name; value.tea.category = category
  value.context.date = date; value.context.time = '09:30'
  return value
}
function records() {
  const first = record('우전', '2026-10-12')
  first.experience.feeling = '천천히 마시니 마음이 편안했다'
  first.experience.aroma = '볶은 곡물의 고소한 향'
  first.experience.taste = '입안에 부드러운 단맛'
  first.experience.aftertaste = '깨끗하고 긴 여운'
  first.experience.body = '가볍고 산뜻함'
  first.brewing.tool = '주니 자사호 120cc'; first.brewing.material = '자사'
  first.context.location = '창가'; first.context.people = '가족'; first.context.reason = '산책 후 휴식'
  first.tags = ['아침', '새벽']; first.favorite = true; first.experience.rating = 5
  const second = record('우전', '2026-11-12')
  second.experience.feeling = '다음 달에 다시 마셨다'
  second.experience.notes = `${'우림을 바꾸며 천천히 마셨다. '.repeat(80)}고소한 향과 <script>기록</script> (a+b) 마지막 잔`
  const third = record('잎새', '2026-10-13', '홍차')
  third.experience.taste = '꿀처럼 달콤한 맛'
  return [first, second, third, record('하루 한 잔', localDate(), '허브차'), record('이름만 남긴 차', '', '')]
}
function diagnostics(page) {
  const issues = []
  page.on('pageerror', (error) => issues.push(error.message))
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) issues.push(message.text()) })
  page.on('response', (response) => { if (response.status() >= 400) issues.push(`${response.status()} ${response.url()}`) })
  return issues
}
async function backup(page) {
  await nav(page, '설정')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).click()
  return JSON.parse(readFileSync(await (await pending).path(), 'utf8'))
}
async function prepare(page, entries = records()) {
  await page.goto('./#/settings')
  const fixture = await backup(page)
  fixture.data.entries = entries
  const draft = record('작성 중인 검색 제외 초안', '2026-10-12')
  draft.experience.feeling = '초안에만 있는 느낌'
  fixture.data.settings = [{ key: 'draft', value: draft }, { key: 'entryDetailsExpanded', value: true }]
  await page.locator('#backup-file').setInputFiles({ name: 'search.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  await page.getByRole('radio', { name: /^전체 교체/ }).check()
  await page.getByRole('button', { name: '전체 교체하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const before = await backup(page)
  await nav(page, '기록')
  await expect(page.locator('.tea-card')).toHaveCount(entries.length)
  return before.data
}

test('search finds dates and descriptions together, shows matching context and safely opens the recorded details', async ({ page }) => {
  const issues = diagnostics(page)
  await prepare(page)
  const search = page.getByRole('searchbox', { name: '기록 검색', exact: true })
  const cards = page.locator('.tea-card')
  await expect(search).toHaveAttribute('aria-describedby', 'entry-search-help')
  await search.fill('10월 녹차 고소한')
  await expect(cards).toHaveCount(1)
  await expect(cards).toContainText('우전')
  await expect(cards.locator('.entry-date')).toContainText('2026년 10월 12일 · 09:30')
  await expect(cards.locator('.search-excerpt-label')).toHaveText('향')
  await expect(cards.locator('mark')).toHaveText('고소한')
  await expect(page.locator('.search-results').getByRole('status')).toHaveText('전체 5개 중 1개 찾았어요')
  for (const query of ['2026.10.12 우전', '2026/10/12', '부드러운', '깨끗하고', '산뜻함', '주니 자사호', '가족 창가', '산책 휴식', '#새벽']) {
    await search.fill(query)
    await expect(cards).toHaveCount(1)
    await expect(cards).toContainText('우전')
  }
  await search.fill('11월 고소한')
  await expect(cards).toHaveCount(1)
  await expect(cards.locator('.search-excerpt')).toContainText('…')
  await expect(cards.locator('.search-excerpt-label')).toHaveText('메모')
  await expect(cards.locator('.search-excerpt')).toContainText('<script>기록</script>')
  await expect(cards.locator('script')).toHaveCount(0)
  await search.fill('(a+b)')
  await expect(cards.locator('mark')).toHaveText('(a+b)')
  await search.fill('존재하지 않는 느낌')
  await expect(cards).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '찾는 이야기가 없어요' })).toBeVisible()
  await page.getByRole('button', { name: '검색·필터 모두 해제', exact: true }).click()
  await expect(search).toHaveValue('')
  await expect(search).toBeFocused()
  await expect(cards).toHaveCount(5)
  await search.fill('달콤한 홍차')
  await expect(cards).toHaveCount(1)
  await cards.click()
  await expect(page.getByRole('heading', { name: '잎새', exact: true })).toBeVisible()
  await expect(page.locator('.detail-flavor')).toContainText('꿀처럼 달콤한 맛')
  expect(issues).toEqual([])
})

test('quick periods and filters combine with search; clear actions preserve their scope and Korean composition waits', async ({ page }) => {
  const issues = diagnostics(page)
  // Use the browser's calendar date even when the CI process runs in UTC.
  const today = await page.evaluate(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [year, month] = today.split('-').map(Number)
  const firstDay = `${today.slice(0, 7)}-01`
  const monthEnd = localDate(new Date(year, month, 0))
  const previous = localDate(new Date(year, month - 1, 0))
  const entries = [record('오늘 녹차', today), record('이번달 홍차', firstDay, '홍차'), record('마지막날 녹차', monthEnd), record('이전달 녹차', previous)]
  entries[0].favorite = true; entries[0].experience.rating = 5
  await prepare(page, entries)
  const search = page.getByRole('searchbox', { name: '기록 검색', exact: true })
  const periods = page.getByRole('group', { name: '빠른 기간 선택' })
  const cards = page.locator('.tea-card')
  await search.fill('녹차')
  await periods.getByRole('button', { name: '오늘', exact: true }).click()
  await expect(cards).toHaveCount(entries.filter((entry) => entry.tea.category === '녹차' && entry.context.date === today).length)
  await expect(periods.getByRole('button', { name: /오늘/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '검색어 지우기', exact: true }).click()
  await expect(search).toBeFocused()
  await expect(cards).toHaveCount(entries.filter((entry) => entry.context.date === today).length)
  await periods.getByRole('button', { name: '이번 달', exact: true }).click()
  await expect(cards).toHaveCount(3)
  await page.locator('.filter-panel summary').click()
  await expect(page.getByLabel('시작일', { exact: true })).toHaveValue(firstDay)
  await expect(page.getByLabel('종료일', { exact: true })).toHaveValue(monthEnd)
  await page.getByLabel('평점', { exact: true }).selectOption('5')
  await page.getByRole('checkbox', { name: '즐겨찾기만 보기' }).check()
  await search.fill('녹차')
  await expect(cards).toHaveCount(1)
  await page.getByRole('button', { name: '필터 초기화', exact: true }).click()
  await expect(search).toHaveValue('녹차')
  await expect(cards).toHaveCount(3)
  await page.getByRole('button', { name: '검색·필터 모두 해제', exact: true }).click()
  await expect(cards).toHaveCount(4)
  await search.evaluate((input) => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    input.value = '홍차'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(cards).toHaveCount(4)
  await search.evaluate((input) => input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })))
  await expect(cards).toHaveCount(1)
  await expect(cards).toContainText('이번달 홍차')
  await page.getByLabel('시작일', { exact: true }).fill(monthEnd)
  await page.getByLabel('종료일', { exact: true }).fill(previous)
  await expect(page.getByRole('alert')).toHaveText('종료일을 시작일 이후로 선택해 주세요.')
  await page.getByRole('button', { name: '검색·필터 모두 해제', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(issues).toEqual([])
})

test('mobile search and offline details remain usable without changing entries, photos, drafts or backup settings', async ({ page, context }) => {
  const issues = diagnostics(page)
  const entries = records()
  const data = readFileSync('public/icons/icon-192.png').toString('base64')
  entries[0].photos = [{ id: 'search-photo', name: 'search.png', data: `data:image/png;base64,${data}` }]
  const before = await prepare(page, entries)
  const search = page.getByRole('searchbox', { name: '기록 검색', exact: true })
  await search.fill('10월 녹차 고소한')
  const card = page.locator('.tea-card')
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await page.locator('.search-label').evaluate((label) => label.scrollIntoView({ block: 'start' }))
    await page.evaluate(() => scrollBy(0, -70))
    await page.screenshot({ path: `test-results/search-controls-${width}.png` })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const target of [page.getByRole('button', { name: '검색어 지우기', exact: true }), ...await page.locator('.search-period button').all()]) {
      const box = await target.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    await card.evaluate((link) => link.scrollIntoView({ block: 'center' }))
    await page.screenshot({ path: `test-results/search-result-${width}.png` })
    expect(await card.evaluate((link) => {
      const box = link.getBoundingClientRect()
      const x = box.x + box.width / 2
      const y = Math.min(box.bottom - 10, document.querySelector('.bottom-nav').getBoundingClientRect().top - 10)
      return link.contains(document.elementFromPoint(x, y))
    })).toBe(true)
  }
  await search.fill('초안에만 있는 느낌')
  await expect(card).toHaveCount(0)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await search.fill('2026-10-12 녹차 고소한')
  await expect(card).toHaveCount(1)
  await expect(card.locator('mark')).toHaveText('고소한')
  await card.click()
  await expect(page.getByRole('heading', { name: '우전', exact: true })).toBeVisible()
  await expect(page.locator('.detail-photos img')).toHaveCount(1)
  const after = await backup(page)
  expect(after.data).toEqual(before)
  expect(issues).toEqual([])
})
