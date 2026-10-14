import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createEntry } from '../../src/utils/entry.js'
import { nav } from './helpers/navigation.js'
import { chooseOption } from './helpers/entry-form.js'

const numericLabels = ['차 사용량', '물 용량', '물 온도', '우림 시간']
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
async function start(page) {
  await page.goto('./#/entries/new')
  await expect(page.getByLabel('차 이름 *')).toBeVisible()
}

test('choice and numeric shortcuts preserve drafts, precise direct inputs and edited records without requiring optional values', async ({ page }) => {
  const issues = diagnostics(page)
  await start(page)
  await page.getByLabel('차 이름 *').fill('버튼으로 남긴 차')
  for (const label of numericLabels) await expect(page.getByLabel(label, { exact: true })).toHaveValue('')
  await chooseOption(page, '차 종류', '흑차')
  await expect(page.getByRole('group', { name: '차 종류', exact: true }).getByRole('button', { name: '흑차', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const label of numericLabels) await expect(page.getByLabel(label, { exact: true })).toHaveValue('')
  await chooseOption(page, '차 종류', '흑차')
  await expect(page.getByRole('group', { name: '차 종류', exact: true }).locator('[aria-pressed=true]')).toHaveCount(0)
  await chooseOption(page, '차 종류', '녹차')
  await chooseOption(page, '사용한 차구', '개완')
  await chooseOption(page, '재질', '자기')
  await page.getByRole('button', { name: '5g', exact: true }).click()
  await page.getByRole('button', { name: '차 사용량 0.5g 줄이기', exact: true }).click()
  await page.getByRole('button', { name: '150cc', exact: true }).click()
  await page.getByRole('button', { name: '물 용량 25cc 늘리기', exact: true }).click()
  const temperature = page.getByRole('button', { name: '90°C', exact: true })
  await temperature.focus()
  await temperature.press('Enter')
  await expect(page).toHaveURL(/#\/entries\/new$/)
  await page.getByLabel('물 온도', { exact: true }).fill('85.55')
  await page.getByRole('button', { name: '물 온도 5°C 늘리기', exact: true }).click()
  await page.getByRole('button', { name: '1분', exact: true }).click()
  await page.getByRole('button', { name: '우림 시간 5초 늘리기', exact: true }).click()
  await expect(page.getByText('초안 저장됨', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  for (const [label, value] of [['차 사용량', '4.5'], ['물 용량', '175'], ['물 온도', '90.55'], ['우림 시간', '65']]) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value)
  }
  await expect(page.getByRole('group', { name: '사용한 차구', exact: true }).getByRole('button', { name: '개완', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '버튼으로 남긴 차', exact: true })).toBeVisible()
  await page.reload()
  for (const text of ['4.5 g', '175 cc', '90.55 °C', '65 초']) await expect(page.locator('.detail-brew')).toContainText(text)
  await page.getByRole('link', { name: '기록 수정', exact: true }).click()
  for (const label of numericLabels) await page.getByRole('button', { name: `${label} 지우기`, exact: true }).click()
  await chooseOption(page, '사용한 차구', '개완')
  await chooseOption(page, '재질', '자기')
  await page.getByRole('button', { name: '수정 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '버튼으로 남긴 차', exact: true })).toBeVisible()
  const cleared = (await backup(page)).data.entries[0]
  expect(cleared.tea.amount).toBeNull()
  expect(cleared.brewing).toMatchObject({ volume: null, waterTemperature: null, steepTime: null, tool: '', material: '' })
  await nav(page, '새 기록')
  await page.getByLabel('차 이름 *').fill('이름만 남긴 차')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '이름만 남긴 차', exact: true })).toBeVisible()
  expect((await backup(page)).data.entries).toHaveLength(2)
  expect(issues).toEqual([])
})

test('zero stays distinct from clearing; bounds and unfinished drafts survive, and shortcuts work offline', async ({ page, context }) => {
  const issues = diagnostics(page)
  await start(page)
  await page.getByLabel('차 이름 *').fill('수치 경계와 오프라인 검수')
  for (const label of numericLabels) await page.getByLabel(label, { exact: true }).fill('0')
  await expect(page.getByRole('button', { name: '차 사용량 0.5g 줄이기', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: '물 온도 5°C 줄이기', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '수치 경계와 오프라인 검수', exact: true })).toBeVisible()
  const original = (await backup(page)).data.entries[0]
  expect(original.tea.amount).toBe(0)
  expect(original.brewing).toMatchObject({ volume: 0, waterTemperature: 0, steepTime: 0 })
  await nav(page, '새 기록')
  await page.getByLabel('차 이름 *').fill('아직 입력 중인 조건')
  await page.getByLabel('물 온도', { exact: true }).fill('101')
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page).toHaveURL(/#\/entries\/new$/)
  expect(await page.getByLabel('물 온도', { exact: true }).evaluate((input) => input.validity.rangeOverflow)).toBe(true)
  await expect(page.getByText('초안 저장됨', { exact: true })).toBeVisible()
  const unfinished = await backup(page)
  expect(unfinished.data.entries).toEqual([original])
  expect(unfinished.data.settings.find((setting) => setting.key === 'draft').value.brewing.waterTemperature).toBe(101)
  await nav(page, '새 기록')
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await expect(page.getByLabel('물 온도', { exact: true })).toHaveValue('101')
  await page.getByRole('button', { name: '100°C', exact: true }).click()
  await expect(page.getByRole('button', { name: '물 온도 5°C 늘리기', exact: true })).toBeDisabled()
  await expect(page.getByText('초안 저장됨', { exact: true })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await expect(page.getByLabel('물 온도', { exact: true })).toHaveValue('100')
  await context.setOffline(true)
  await chooseOption(page, '차 종류', '백차')
  await page.getByRole('button', { name: '3g', exact: true }).click()
  await page.getByRole('button', { name: '100cc', exact: true }).click()
  await page.getByRole('button', { name: '2분', exact: true }).click()
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '아직 입력 중인 조건', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.detail-brew')).toContainText('120 초')
  const final = await backup(page)
  expect(final.data.entries.find((entry) => entry.id === original.id)).toEqual(original)
  expect(final.data.entries.find((entry) => entry.tea.name === '아직 입력 중인 조건').brewing).toMatchObject({ volume: 100, waterTemperature: 100, steepTime: 120 })
  expect(issues).toEqual([])
})

test('historical and long custom choices stay usable on mobile with keyboard, touch targets and fixed save controls', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/settings')
  const fixture = await backup(page)
  const long = '오래기억하고싶은나만의차와도구'.repeat(6).slice(0, 100)
  for (const [store, suffix] of [['categories', '종류'], ['tools', '도구'], ['materials', '재질']]) {
    fixture.data[store].push({ id: `quick-long-${store}`, name: `${long.slice(0, 98)}${suffix}` })
  }
  const legacy = createEntry()
  legacy.tea.name = '예전 선택 목록을 간직한 차'
  legacy.tea.category = '이전 차 종류'
  legacy.brewing.tool = '이전 도구'
  legacy.brewing.material = '이전 재질'
  fixture.data.entries = [legacy]
  await page.locator('#backup-file').setInputFiles({ name: 'quick-legacy.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  await page.getByRole('button', { name: '병합하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await nav(page, '기록')
  await page.locator('.tea-card').click()
  await page.getByRole('link', { name: '기록 수정', exact: true }).click()
  for (const [label, name] of [['차 종류', '이전 차 종류'], ['사용한 차구', '이전 도구'], ['재질', '이전 재질']]) {
    await expect(page.getByRole('group', { name: label, exact: true }).getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
  }
  await page.getByRole('button', { name: '수정 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: legacy.tea.name, exact: true })).toBeVisible()
  const saved = (await backup(page)).data.entries[0]
  expect(saved.tea.category).toBe(legacy.tea.category)
  expect(saved.brewing.tool).toBe(legacy.brewing.tool)
  expect(saved.brewing.material).toBe(legacy.brewing.material)
  await nav(page, '새 기록')
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await page.getByLabel('차 이름 *').scrollIntoViewIfNeeded()
    const firstInput = await page.getByLabel('차 이름 *').evaluate((input) => ({ bottom: input.getBoundingClientRect().bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top }))
    expect(firstInput.bottom).toBeLessThanOrEqual(firstInput.saveTop)
    for (const [label, suffix] of [['차 종류', '종류'], ['사용한 차구', '도구'], ['재질', '재질']]) {
      const group = page.getByRole('group', { name: label, exact: true })
      const button = group.getByRole('button', { name: `${long.slice(0, 98)}${suffix}`, exact: true })
      if (!await button.isVisible()) await group.locator('summary').click()
      await button.focus()
      await button.press('Space')
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await button.press('Space')
      await expect(button).toHaveAttribute('aria-pressed', 'false')
      const targets = await group.locator('.choice-buttons button:visible').evaluateAll((buttons) => buttons.every((b) => {
        const box = b.getBoundingClientRect(); return box.width >= 44 && box.height >= 44
      }))
      expect(targets).toBe(true)
    }
    const temperature = page.getByLabel('물 온도', { exact: true })
    await temperature.evaluate((input) => input.scrollIntoView({ block: 'center' }))
    const layout = await temperature.evaluate((input) => {
      const row = input.closest('.quick-number-row')
      const box = row.getBoundingClientRect()
      return { overflow: document.documentElement.scrollWidth > innerWidth, left: box.left, right: box.right, bottom: box.bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top }
    })
    expect(layout.overflow).toBe(false)
    expect(layout.left).toBeGreaterThanOrEqual(0)
    expect(layout.right).toBeLessThanOrEqual(width)
    expect(layout.bottom).toBeLessThanOrEqual(layout.saveTop)
    await page.screenshot({ path: `test-results/quick-entry-values-${width}.png` })
    await page.locator('.form-section').first().screenshot({ path: `test-results/quick-entry-basic-${width}.png` })
    await page.locator('.form-section').nth(1).screenshot({ path: `test-results/quick-entry-brewing-${width}.png` })
  }
  expect(issues).toEqual([])
})
