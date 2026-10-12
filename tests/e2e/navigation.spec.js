import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createEntry } from '../../src/utils/entry.js'
import { nav } from './helpers/navigation.js'

test('merged journal shows all records and filters; settings owns stats on mobile and offline', async ({ page, context }) => {
  const issues = []
  page.on('pageerror', (error) => issues.push(error.message))
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) issues.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) issues.push(`${response.status()} ${response.url()}`)
  })
  await page.goto('./#/settings')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).click()
  const fixture = JSON.parse(readFileSync(await (await pending).path(), 'utf8'))
  fixture.data.entries = [5, 1, 0, 4].map((rating, index) => {
    const entry = createEntry()
    entry.id = `navigation-${index}`
    entry.tea.name = `통합 검수 차 ${index + 1}`
    entry.tea.category = index === 3 ? '홍차' : '녹차'
    entry.context.date = `2026-01-0${index + 1}`
    entry.experience.rating = rating
    entry.favorite = index === 0
    return entry
  })
  await page.locator('#backup-file').setInputFiles({ name: 'navigation.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) })
  await page.getByRole('button', { name: '병합하기', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await nav(page, '기록')
  const menu = page.getByRole('navigation', { name: '주 메뉴' })
  await expect(menu.getByRole('link')).toHaveCount(3)
  await expect(menu.getByRole('link')).toHaveText(['기록', '기록하기', '설정'])
  await expect(menu.getByRole('link', { name: '홈', exact: true })).toHaveCount(0)
  await expect(menu.getByRole('link', { name: '통계', exact: true })).toHaveCount(0)
  await expect(menu.getByRole('link', { name: '기록', exact: true })).toHaveClass(/\bactive\b/)
  await expect(page.locator('.tea-card')).toHaveCount(4)
  await expect(page.locator('.tea-card').first()).toContainText('통합 검수 차 4')
  await page.getByLabel('차 이름, 메모, 태그 검색').fill('통합 검수 차 1')
  await expect(page.locator('.tea-card')).toHaveCount(1)
  await expect(page.locator('.tea-card')).toContainText('통합 검수 차 1')
  await page.getByLabel('차 이름, 메모, 태그 검색').fill('')
  await page.getByRole('checkbox', { name: '즐겨찾기만 보기' }).check()
  await expect(page.locator('.tea-card')).toHaveCount(1)
  await page.getByRole('checkbox', { name: '즐겨찾기만 보기' }).uncheck()
  await page.locator('.filter-panel summary').click()
  await page.getByLabel('정렬', { exact: true }).selectOption('oldest')
  await expect(page.locator('.tea-card').first()).toContainText('통합 검수 차 1')
  await page.getByLabel('차 종류', { exact: true }).selectOption('홍차')
  await expect(page.locator('.tea-card')).toHaveCount(1)
  await page.getByRole('button', { name: '필터 초기화', exact: true }).click()
  await expect(page.locator('.tea-card')).toHaveCount(4)
  await page.goto('./#/entries')
  await expect(page).toHaveURL(/#\/$/)
  await page.reload()
  await expect(page.locator('.tea-card')).toHaveCount(4)

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 640 })
    await page.evaluate(() => scrollTo(0, 0))
    await page.screenshot({ path: `test-results/journal-menu-${width}.png`, fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const touch = await menu.getByRole('link').evaluateAll((links) => links.every((link) => {
      const box = link.getBoundingClientRect()
      const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return box.width >= 44 && box.height >= 44 && (link === target || link.contains(target))
    }))
    expect(touch).toBe(true)
    await page.locator('.tea-card').last().scrollIntoViewIfNeeded()
    expect(await page.locator('.tea-card').last().evaluate((card) => card.getBoundingClientRect().bottom <= document.querySelector('.bottom-nav').getBoundingClientRect().top)).toBe(true)
    await nav(page, '통계')
    await expect(menu.getByRole('link', { name: '설정', exact: true })).toHaveClass('active')
    await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
    await expect(page.locator('.bar-row').filter({ hasText: '녹차' })).toContainText('평균 3.0 / 5 · 평점 입력 2건')
    await page.getByRole('link', { name: '설정으로 돌아가기', exact: true }).click()
    await expect(page.getByRole('heading', { name: '나의 일기장 설정', exact: true })).toBeVisible()
    await nav(page, '기록')
  }
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.goto('./#/entries')
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.locator('.tea-card')).toHaveCount(4)
  await nav(page, '통계')
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  await expect(page.locator('.stat-card').first()).toContainText('4 건')
  await expect(menu.getByRole('link', { name: '설정', exact: true })).toHaveClass('active')
  expect(issues).toEqual([])
})
