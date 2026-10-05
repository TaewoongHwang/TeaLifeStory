import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

function diagnostics(page) {
  const issues = []
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) issues.push(`${message.type()}: ${message.text()}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) issues.push(`HTTP ${response.status()}: ${response.url()}`)
  })
  return issues
}
async function start(page) {
  await page.goto(process.env.AUDIT_DEV_URL || './')
  await expect(page.getByRole('heading', { name: '오늘은 어떤 차를 마셨나요?' })).toBeVisible()
}
async function nav(page, name) {
  await page.getByRole('navigation').getByRole('link', { name, exact: true }).click()
}
async function create(page, name, rating = 0) {
  await nav(page, '새 기록')
  await page.getByLabel('차 이름 *').fill(name)
  if (rating) await page.getByRole('button', { name: `${rating}점`, exact: true }).click()
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}
async function remove(page) {
  await page.getByRole('button', { name: '삭제', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: '삭제하기', exact: true }).click()
  await expect(page).toHaveURL(/#\/entries$/)
}
async function backup(page) {
  await nav(page, '설정')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기' }).click()
  return JSON.parse(readFileSync(await (await download).path(), 'utf8'))
}
async function restore(page, data) {
  await page.locator('#backup-file').setInputFiles({ name: 'audit.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('radio', { name: /^전체 교체/ }).check()
  await page.getByRole('button', { name: '전체 교체하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

test('functional audit: rated CRUD, reload, deletion, search, exact stats and JSON round trip without runtime errors', async ({ page }) => {
  const issues = diagnostics(page)
  await start(page)
  await create(page, '검수 녹차', 4)
  await nav(page, '기록')
  await expect(page.locator('.tea-card')).toHaveCount(1)
  await page.locator('.tea-card').click()
  await expect(page.getByLabel('5점 중 4점')).toBeVisible()
  await page.getByRole('link', { name: '기록 수정', exact: true }).click()
  await page.getByLabel('차 이름 *').fill('수정한 검수 녹차')
  await page.getByRole('button', { name: '5점', exact: true }).click()
  await page.getByLabel('물 온도', { exact: true }).fill('90')
  await page.getByLabel('메모', { exact: true }).fill('수정 후 새로고침 검수')
  await page.getByRole('button', { name: '수정 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '수정한 검수 녹차', exact: true })).toBeVisible()
  const editedURL = page.url()
  await page.reload()
  await expect(page.getByRole('heading', { name: '수정한 검수 녹차', exact: true })).toBeVisible()
  await expect(page.getByLabel('5점 중 5점')).toBeVisible()
  await expect(page.locator('.detail-brew')).toContainText('90 °C')
  await expect(page.locator('.detail-paper')).toContainText('수정 후 새로고침 검수')
  await create(page, '검수 홍차', 3)
  await create(page, '평점 없는 차')
  await nav(page, '통계')
  await expect(page.locator('.stat-card').nth(0)).toContainText('3 잔')
  await expect(page.locator('.stat-card').nth(1)).toContainText('4.0')
  await page.goto(editedURL)
  await remove(page)
  await page.reload()
  await expect(page.locator('.tea-card')).toHaveCount(2)
  await page.getByLabel('차 이름, 메모, 태그 검색').fill('녹차')
  await expect(page.locator('.tea-card')).toHaveCount(0)
  await page.getByLabel('차 이름, 메모, 태그 검색').fill('홍차')
  await expect(page.locator('.tea-card')).toHaveCount(1)
  await nav(page, '통계')
  await expect(page.locator('.stat-card').nth(0)).toContainText('2 잔')
  await expect(page.locator('.stat-card').nth(1)).toContainText('3.0')
  const data = await backup(page)
  expect(data.data.entries.map((entry) => entry.tea.name).sort()).toEqual(['검수 홍차', '평점 없는 차'])
  await nav(page, '기록')
  await page.locator('.tea-card').filter({ hasText: '검수 홍차' }).click()
  await remove(page)
  await nav(page, '설정')
  await restore(page, data)
  await page.reload()
  await nav(page, '기록')
  await expect(page.locator('.tea-card')).toHaveCount(2)
  await page.locator('.tea-card').filter({ hasText: '검수 홍차' }).click()
  await expect(page.getByLabel('5점 중 3점')).toBeVisible()
  await nav(page, '통계')
  await expect(page.locator('.stat-card').nth(0)).toContainText('2 잔')
  await expect(page.locator('.stat-card').nth(1)).toContainText('3.0')
  expect(issues).toEqual([])
})

test('mobile audit: last inputs, save button and navigation remain reachable without overlap', async ({ page }) => {
  const issues = diagnostics(page)
  await start(page)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await nav(page, '새 기록')
    const favorite = page.getByRole('checkbox', { name: /즐겨찾기에 담기/ })
    await favorite.scrollIntoViewIfNeeded()
    const layout = await page.evaluate(() => {
      const nav = document.querySelector('.bottom-nav').getBoundingClientRect()
      const save = document.querySelector('.save-bar').getBoundingClientRect()
      const button = document.querySelector('.save-bar button').getBoundingClientRect()
      const checkbox = document.querySelector('.checkbox-field input').getBoundingClientRect()
      const centerVisible = (rect, selector) => Boolean(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest(selector))
      return { overflow: document.documentElement.scrollWidth > window.innerWidth, saveBottom: save.bottom, navTop: nav.top, checkboxBottom: checkbox.bottom, saveTop: save.top, buttonVisible: centerVisible(button, '.save-bar'), checkboxVisible: centerVisible(checkbox, '.checkbox-field') }
    })
    expect(layout.overflow).toBe(false)
    expect(layout.saveBottom).toBeLessThanOrEqual(layout.navTop)
    expect(layout.checkboxBottom).toBeLessThanOrEqual(layout.saveTop)
    expect(layout.buttonVisible).toBe(true)
    expect(layout.checkboxVisible).toBe(true)
    await page.getByLabel('메모', { exact: true }).fill(`마지막 입력 ${width}`)
    await nav(page, '홈')
    await nav(page, '새 기록')
    await page.getByRole('button', { name: '새로 작성', exact: true }).click()
    await nav(page, '홈')
  }
  expect(issues).toEqual([])
})

test('unfinished numeric draft does not make the exported backup impossible to restore', async ({ page }) => {
  const issues = diagnostics(page)
  await start(page)
  await create(page, '보존할 차', 4)
  await nav(page, '새 기록')
  await page.getByLabel('차 이름 *').fill('아직 작성 중')
  await page.getByLabel('차 사용량', { exact: true }).fill('-1')
  await page.getByLabel('물 온도', { exact: true }).fill('120')
  await expect(page.getByText('초안 저장됨', { exact: true })).toBeVisible()
  const data = await backup(page)
  expect(data.data.settings.find((item) => item.key === 'draft').value.brewing.waterTemperature).toBe(120)
  await restore(page, data)
  await nav(page, '새 기록')
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await expect(page.getByLabel('차 사용량', { exact: true })).toHaveValue('-1')
  await expect(page.getByLabel('물 온도', { exact: true })).toHaveValue('120')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByLabel('차 사용량', { exact: true })).toBeVisible()
  await page.getByLabel('차 사용량', { exact: true }).fill('3')
  await page.getByLabel('물 온도', { exact: true }).fill('90')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '아직 작성 중', exact: true })).toBeVisible()
  await nav(page, '기록')
  await expect(page.locator('.tea-card')).toHaveCount(2)
  expect(issues).toEqual([])
})
