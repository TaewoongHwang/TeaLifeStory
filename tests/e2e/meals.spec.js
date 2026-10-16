import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { nav } from './helpers/navigation.js'
import { createEntry, createMeal } from '../../src/utils/entry.js'
import { createPurchase } from '../../src/utils/meal.js'

async function choose(page, label, name) { await page.getByRole('group', { name: label, exact: true }).getByRole('button', { name, exact: true }).click() }
async function details(page) { if (await page.locator('.entry-details-toggle').getAttribute('aria-expanded') === 'false') await page.locator('.entry-details-toggle').click() }
async function backup(page) {
  await nav(page, '설정')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).click()
  return JSON.parse(readFileSync(await (await pending).path(), 'utf8'))
}
async function restore(page, value) {
  await nav(page, '설정')
  await page.locator('#backup-file').setInputFiles({ name: 'meals.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) })
  await page.getByRole('radio', { name: /^전체 교체/ }).check()
  await page.getByRole('button', { name: '전체 교체하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
function diagnostics(page) {
  const issues = []
  page.on('pageerror', error => issues.push(error.message))
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) issues.push(message.text()) })
  page.on('response', response => { if (response.status() >= 400) issues.push(`${response.status()} ${response.url()}`) })
  return issues
}

test('separate tea and meal drafts resume through type switches and reload; name-only meals save without a feeling', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/entries/new')
  await page.getByLabel('차 이름 *').fill('남겨 둔 차 초안')
  await page.getByRole('link', { name: '밥 한 끼', exact: true }).click()
  await page.getByLabel('한 끼 이름 *').fill('이름만 적은 밥')
  await page.getByRole('link', { name: '차 한 잔', exact: true }).click()
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await expect(page.getByLabel('차 이름 *')).toHaveValue('남겨 둔 차 초안')
  await page.getByRole('link', { name: '밥 한 끼', exact: true }).click()
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '이어쓰기', exact: true }).click()
  await expect(page.getByLabel('한 끼 이름 *')).toHaveValue('이름만 적은 밥')
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '이름만 적은 밥', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '식후 느낌 남기기', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '이름만 적은 밥', exact: true })).toBeVisible()
  const saved = await backup(page)
  expect(saved.version).toBe(2)
  expect(saved.data.entries[0]).toMatchObject({ kind: 'meal', observations: [], meal: { name: '이름만 적은 밥', ingredients: [] } })
  expect(saved.data.settings.find(item => item.key === 'draft').value.tea.name).toBe('남겨 둔 차 초안')
  expect(saved.data.settings.some(item => item.key === 'mealDraft')).toBe(false)
  await nav(page, '기록')
  await choose(page, '기록 종류 필터', '차'); await expect(page.locator('.tea-card')).toHaveCount(0)
  await choose(page, '기록 종류 필터', '밥'); await expect(page.locator('.meal-card')).toHaveCount(1)
  await page.locator('.meal-card').click()
  await page.getByRole('link', { name: '밥 기록 수정', exact: true }).click()
  await page.getByLabel('한 끼 이름 *').fill('수정한 밥 기록')
  await page.getByRole('button', { name: '밥 기록 수정 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '수정한 밥 기록', exact: true })).toBeVisible()
  await page.reload(); await expect(page.getByRole('heading', { name: '수정한 밥 기록', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '밥 기록 삭제', exact: true }).click()
  await page.getByRole('button', { name: '삭제하기', exact: true }).click()
  await expect(page.locator('.meal-card')).toHaveCount(0)
  expect(issues).toEqual([])
})

test('home meals connect reusable purchases and photos; changes and removal of purchases preserve snapshots', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/meals/new')
  await page.getByLabel('한 끼 이름 *').fill('두부와 시금치 집밥')
  await choose(page, '식사 구분', '집밥'); await details(page)
  await page.getByLabel('재료 직접 입력').fill('두부'); await page.getByLabel('재료 직접 입력').press('Enter')
  await expect(page).toHaveURL(/#\/meals\/new$/)
  await choose(page, '두부 조리법', '익힘')
  await page.getByRole('button', { name: '구매 정보 연결', exact: true }).click()
  await page.getByRole('button', { name: '새 구매 정보 등록', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('재료 이름 *')).toHaveValue('두부')
  await dialog.getByLabel('제품·브랜드').fill('국산 부침용 300g')
  await dialog.getByLabel('구매처', { exact: true }).fill('동네 마트')
  await dialog.getByLabel('구매 메모').fill('단단하고 담백했다')
  await dialog.getByLabel('다시 사고 싶은 재료', { exact: true }).check()
  await dialog.getByRole('button', { name: '구매 정보 저장', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await page.locator('input[type=file]').setInputFiles('public/icons/icon-192.png')
  await expect(page.locator('.photo-grid img')).toHaveCount(1)
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await expect(page.locator('.detail-paper')).toContainText('동네 마트')
  const mealURL = page.url()
  await nav(page, '설정'); await page.getByRole('link', { name: '재료 구매 노트', exact: true }).click()
  await page.getByRole('button', { name: '구매 정보 수정', exact: true }).click()
  await page.getByLabel('구매처', { exact: true }).fill('다른 마트')
  await page.getByRole('button', { name: '구매 정보 저장', exact: true }).click()
  await expect(page.locator('.purchase-card')).toContainText('다른 마트')
  await page.getByRole('button', { name: '구매 정보 삭제', exact: true }).click()
  await page.getByRole('button', { name: '구매 정보 삭제하기', exact: true }).click()
  await expect(page.locator('.purchase-card')).toHaveCount(0)
  await page.goto(mealURL); await page.reload()
  await expect(page.locator('.detail-paper')).toContainText('동네 마트')
  await expect(page.locator('.detail-photos img')).toHaveCount(1)
  const saved = await backup(page)
  expect(saved.data.purchases).toEqual([])
  expect(saved.data.entries[0].meal.ingredients[0].purchase.shop).toBe('동네 마트')
  await restore(page, saved); await page.goto(mealURL)
  await expect(page.locator('.detail-paper')).toContainText('단단하고 담백했다')
  expect(issues).toEqual([])
})

test('restaurant meals capture conditions, multiple actual feeling times, edit and delete; search and review distinguish missing', async ({ page }) => {
  const issues = diagnostics(page)
  await page.goto('./#/meals/new')
  await page.getByLabel('한 끼 이름 *').fill('고등어구이 정식')
  await choose(page, '식사 구분', '외식'); await details(page)
  await page.getByLabel('음식점·지점', { exact: true }).fill('편안식당 강남점')
  await choose(page, '먹은 양', '보통'); await choose(page, '매운 정도', '안 매움')
  await page.getByLabel('식사 날짜').fill('2026-10-10'); await page.getByLabel('식사 시간').fill('12:00')
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await page.getByRole('button', { name: '식후 느낌 남기기', exact: true }).click()
  await page.getByLabel('느낌을 확인한 날짜').fill('2026-10-10'); await page.getByLabel('느낌을 확인한 시간').fill('11:00')
  await choose(page, '지금의 속 느낌', '편안함')
  await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('식사 시각 이후')
  await page.getByLabel('느낌을 확인한 시간').fill('14:00'); await page.getByLabel('느낌 메모').fill('두 시간 뒤에도 가벼웠다')
  await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await expect(page.locator('.observation-list li')).toHaveCount(1)
  await page.getByRole('button', { name: '새 식후 느낌 추가', exact: true }).click()
  await page.getByLabel('느낌을 확인한 날짜').fill('2026-10-10'); await page.getByLabel('느낌을 확인한 시간').fill('18:00')
  await choose(page, '지금의 속 느낌', '더부룩함')
  await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await expect(page.locator('.observation-list li')).toHaveCount(2)
  await page.reload(); await expect(page.locator('.observation-list li')).toHaveCount(2)
  const mealURL = page.url()
  await nav(page, '설정'); await page.getByRole('link', { name: '편했던 밥 기록 돌아보기', exact: true }).click()
  await expect(page.locator('.meal-counts')).toContainText('불편함 기록 있음1끼')
  await page.goto(mealURL)
  await page.getByRole('button', { name: '2026-10-10 14:00 느낌 수정', exact: true }).click()
  await page.getByLabel('느낌 메모').fill('수정한 느낌 메모'); await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await expect(page.locator('.observation-list')).toContainText('수정한 느낌 메모')
  await page.getByRole('button', { name: '2026-10-10 18:00 느낌 삭제', exact: true }).click(); await page.getByRole('button', { name: '삭제하기', exact: true }).click()
  await expect(page.locator('.observation-list li')).toHaveCount(1)
  await nav(page, '기록'); await page.getByLabel('기록 검색', { exact: true }).fill('편안식당 수정한')
  await expect(page.locator('.meal-card')).toHaveCount(1)
  await page.getByRole('button', { name: '검색어 지우기', exact: true }).click()
  await page.getByRole('link', { name: /밥 기록하기/ }).click(); await page.getByLabel('한 끼 이름 *').fill('아직 느낌 없는 한 끼')
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await nav(page, '설정'); await page.getByRole('link', { name: '편했던 밥 기록 돌아보기', exact: true }).click()
  await expect(page.locator('.meal-counts')).toContainText('편안함만 기록1끼')
  await expect(page.locator('.meal-counts')).toContainText('식후 느낌 미기록1끼')
  await choose(page, '식후 느낌 필터', '편안함'); await expect(page.locator('.meal-card')).toHaveCount(1)
  await expect(page.locator('.meal-card')).toContainText('고등어구이 정식')
  await choose(page, '식후 느낌 필터', '미기록'); await expect(page.locator('.meal-card')).toHaveCount(1)
  await expect(page.locator('.meal-card')).toContainText('아직 느낌 없는 한 끼')
  expect(issues).toEqual([])
})

test('failed meal and feeling writes keep inputs, draft and saved data until retry succeeds', async ({ page }) => {
  await page.goto('./#/meals/new')
  await page.getByLabel('한 끼 이름 *').fill('실패해도 남는 밥')
  await expect(page.getByText('초안 저장됨', { exact: true })).toBeVisible()
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    window.restoreMealWrites = () => { IDBObjectStore.prototype.put = original }
    IDBObjectStore.prototype.put = function (...args) { if (this.name === 'entries') throw new DOMException('Full', 'QuotaExceededError'); return original.apply(this, args) }
  })
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('작성 내용과 기존 기록은 유지')
  await expect(page.getByLabel('한 끼 이름 *')).toHaveValue('실패해도 남는 밥')
  await page.evaluate(() => window.restoreMealWrites())
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '실패해도 남는 밥', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '식후 느낌 남기기', exact: true }).click()
  await choose(page, '지금의 속 느낌', '편안함'); await page.getByLabel('느낌 메모').fill('이 내용은 유지되어야 한다')
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put
    window.restoreMealWrites = () => { IDBObjectStore.prototype.put = original }
    IDBObjectStore.prototype.put = function (...args) { if (this.name === 'entries') throw new DOMException('Full', 'QuotaExceededError'); return original.apply(this, args) }
  })
  await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('입력 내용은 유지')
  await expect(page.getByLabel('느낌 메모')).toHaveValue('이 내용은 유지되어야 한다')
  await page.evaluate(() => window.restoreMealWrites())
  await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await expect(page.locator('.observation-list')).toContainText('이 내용은 유지되어야 한다')
  await page.reload(); await expect(page.locator('.observation-list li')).toHaveCount(1)
})

test('meal inputs, fixed save bar, observation dialog and new pages fit 360, 390, 430 pixels; all new routes work offline', async ({ page, context }) => {
  const issues = diagnostics(page)
  await page.goto('./#/meals/new')
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 740 })
    await page.getByLabel('한 끼 이름 *').scrollIntoViewIfNeeded()
    const layout = await page.getByLabel('한 끼 이름 *').evaluate(input => ({ overflow: document.documentElement.scrollWidth > innerWidth, bottom: input.getBoundingClientRect().bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top }))
    expect(layout.overflow).toBe(false); expect(layout.bottom).toBeLessThanOrEqual(layout.saveTop)
    await page.screenshot({ path: `test-results/meal-form-${width}.png` })
  }
  await page.getByLabel('한 끼 이름 *').fill('오프라인 밥')
  await page.getByRole('button', { name: '밥 기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name: '오프라인 밥', exact: true })).toBeVisible()
  const mealURL = page.url()
  await page.evaluate(async () => { await navigator.serviceWorker.ready }); await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.reload(); await expect(page.getByRole('heading', { name: '오프라인 밥', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '식후 느낌 남기기', exact: true }).click()
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 740 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  }
  await choose(page, '지금의 속 느낌', '편안함'); await page.getByRole('button', { name: '식후 느낌 저장', exact: true }).click()
  await nav(page, '설정'); await page.getByRole('link', { name: '재료 구매 노트', exact: true }).click()
  await expect(page.getByRole('heading', { name: '다시 찾는 재료', exact: true })).toBeVisible()
  await nav(page, '설정'); await page.getByRole('link', { name: '편했던 밥 기록 돌아보기', exact: true }).click()
  await expect(page.locator('.meal-counts')).toContainText('편안함만 기록1끼')
  await page.goto(mealURL); await page.reload(); await expect(page.locator('.observation-list li')).toHaveCount(1)
  await context.setOffline(false)
  expect(issues).toEqual([])
})

test('meal, tea, both drafts and purchases survive v2 replace; meal CSV includes purchase and observations', async ({ page }) => {
  await page.goto('./#/settings')
  const fixture = await backup(page), tea = createEntry(), meal = createMeal(), purchase = { ...createPurchase(), name: '연근', shop: '행복시장' }
  tea.tea.name = '차 기록'; meal.meal.name = '연근밥'; meal.context.date = '2026-10-10'; meal.context.time = '12:00'
  meal.meal.ingredients = [{ id: 'food', name: '연근', group: '뿌리채소', preparation: '익힘', purchase }]
  meal.meal.ingredients.push({ id: 'long-food', name: 'LongIngredientName'.repeat(5), group: '기타 재료', preparation: '', purchase: null })
  meal.observations = [{ id: 'feeling', date: '2026-10-10', time: '14:00', feelings: ['편안함'], notes: '가벼웠다' }]
  fixture.data.entries = [tea, meal].sort((a, b) => a.id.localeCompare(b.id)); fixture.data.purchases = [purchase]
  const teaDraft = createEntry(), mealDraft = createMeal(); teaDraft.tea.name = '차 초안'; mealDraft.meal.name = '밥 초안'
  fixture.data.settings = [{ key: 'draft', value: teaDraft }, { key: 'mealDraft', value: mealDraft }]
  await restore(page, fixture)
  expect((await backup(page)).data).toEqual(fixture.data)
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: '밥 기록 CSV 내보내기', exact: true }).click()
  const csv = readFileSync(await (await pending).path(), 'utf8')
  expect(csv).toContain('행복시장'); expect(csv).toContain('가벼웠다'); expect(csv).not.toContain('차 기록')
  const malformed = structuredClone(fixture); delete malformed.data.purchases
  await page.locator('#backup-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(malformed)) })
  await expect(page.getByRole('alert')).toContainText('백업을 읽을 수 없습니다')
  expect((await backup(page)).data).toEqual(fixture.data)
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 740 })
    for (const [path, label] of [['/', 'home'], [`/meals/${meal.id}`, 'detail'], ['/purchases', 'purchases'], [`/meals/${meal.id}/edit`, 'edit'], ['/meal-patterns', 'patterns']]) {
      await page.goto(`./#${path}`)
      await expect(page.locator('main h1')).toBeVisible()
      if (path === '/meal-patterns') await page.getByText('함께 먹은 재료로 찾기', { exact: false }).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
      await page.screenshot({ path: `test-results/meal-${label}-${width}.png`, fullPage: true })
    }
  }
})
