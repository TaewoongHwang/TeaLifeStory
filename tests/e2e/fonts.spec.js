import { test, expect } from '@playwright/test'

import { nav } from './helpers/navigation.js'
import { chooseOption, openDetails } from './helpers/entry-form.js'
const fontFile = 'fonts/PretendardVariable.woff2'

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
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '오늘의 한 잔 오늘의 한 끼' })).toBeVisible()
}

async function loadedWeights(page) {
  return page.evaluate(async () => {
    const results = []
    for (const weight of [400, 500, 600]) {
      const faces = await document.fonts.load(`${weight} 16px Pretendard`, '차곡차곡 차 한 잔의 여유 0123456789')
      results.push({ weight, families: faces.map((face) => face.family), statuses: faces.map((face) => face.status) })
    }
    await document.fonts.ready
    return results
  })
}

async function expectRenderedPretendard(context, page, selectors) {
  const session = await context.newCDPSession(page)
  try {
    await session.send('DOM.enable')
    await session.send('CSS.enable')
    const { root } = await session.send('DOM.getDocument')
    for (const selector of selectors) {
      const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector })
      expect(nodeId, selector).toBeGreaterThan(0)
      const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId })
      expect(fonts.some((font) => /Pretendard/i.test(font.familyName) && font.isCustomFont && font.glyphCount > 0), selector).toBe(true)
    }
  } finally { await session.detach() }
}

test('local Pretendard WOFF2 is rendered at multiple weights and survives a fresh offline document without a CDN', async ({ page, context, request }) => {
  const issues = diagnostics(page)
  const externalRequests = []
  const appOrigin = new URL(test.info().project.use.baseURL).origin
  context.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== appOrigin) externalRequests.push(request.url())
  })
  await start(page)
  const appURL = new URL('./', page.url()).href
  const fontURL = new URL(fontFile, page.url()).href
  const preload = page.locator('link[rel=preload][as=font]')
  await expect(preload).toHaveCount(1)
  expect(new URL(await preload.getAttribute('href'), page.url()).href).toBe(fontURL)
  await expect(preload).toHaveAttribute('type', 'font/woff2')
  expect(['', 'anonymous']).toContain(await preload.getAttribute('crossorigin'))
  const response = await request.get(fontURL)
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toMatch(/^font\/woff2\b/)
  const fontBytes = await response.body()
  expect(fontBytes.subarray(0, 4).toString('ascii')).toBe('wOF2')
  for (const result of await loadedWeights(page)) {
    expect(result.families.length, `${result.weight} face`).toBeGreaterThan(0)
    expect(result.families.every((family) => /Pretendard/i.test(family))).toBe(true)
    expect(result.statuses.every((status) => status === 'loaded')).toBe(true)
  }
  await expectRenderedPretendard(context, page, ['.brand > span:last-child', '.hero-copy h1', '.hero-copy p'])
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  const cachedFont = await page.evaluate(async (fontURL) => {
    const target = new URL(fontURL)
    for (const name of await caches.keys()) {
      if (!name.startsWith('workbox-precache-')) continue
      const cache = await caches.open(name)
      for (const request of await cache.keys()) {
        const url = new URL(request.url)
        if (url.origin !== target.origin || url.pathname !== target.pathname) continue
        const response = await cache.match(request)
        const bytes = await response.arrayBuffer()
        return { revision: url.searchParams.has('__WB_REVISION__'), status: response.status, length: bytes.byteLength, signature: String.fromCharCode(...new Uint8Array(bytes.slice(0, 4))) }
      }
    }
    return null
  }, fontURL)
  expect(cachedFont).toEqual({ revision: true, status: 200, length: fontBytes.length, signature: 'wOF2' })

  // Remove HTTP font caching and use a new document in this isolated test context.
  // Service-worker storage remains, as it does when a prepared PWA is reopened.
  const network = await context.newCDPSession(page)
  await network.send('Network.clearBrowserCache')
  await network.detach()
  await page.close()
  const offlinePage = await context.newPage()
  await context.setOffline(true)
  const offlineIssues = diagnostics(offlinePage)
  const offlineFont = offlinePage.waitForResponse((response) => response.url() === fontURL)
  await offlinePage.goto(appURL)
  await expect(offlinePage.getByRole('heading', { name: '오늘의 한 잔 오늘의 한 끼' })).toBeVisible()
  expect((await offlineFont).fromServiceWorker()).toBe(true)
  for (const result of await loadedWeights(offlinePage)) expect(result.statuses).toEqual(['loaded'])
  await expect(offlinePage.getByText(/오프라인 ·/)).toBeVisible()
  // Detaching the font-inspection CDP session resets Chromium's network emulation.
  // Check the offline UI first, then inspect the font rendered from the service worker.
  await expectRenderedPretendard(context, offlinePage, ['.hero-copy h1', '.hero-copy p'])
  expect(externalRequests).toEqual([])
  expect(issues).toEqual([])
  expect(offlineIssues).toEqual([])
})

test('loaded webfont keeps long Korean and English diary text, inputs, statistics and settings usable at six mobile sizes', async ({ page, context }) => {
  test.setTimeout(60000)
  const issues = diagnostics(page)
  await start(page)
  await loadedWeights(page)
  const name = '오래 기억하고 싶은 오후의 보이차와 나의 이야기 '.repeat(7).slice(0, 200).trim()
  const notes = `${'차를 마시며 천천히 남긴 따뜻한 한글 메모. '.repeat(8)}\n${'AQuietMomentWithTea'.repeat(12)}`
  const koreanTag = '차와함께기억하는따뜻한오후'.repeat(5).slice(0, 100)
  const englishTag = 'QuietTeaStory'.repeat(8).slice(0, 100)
  await nav(page, '새 기록')
  await page.getByLabel('차 이름 *').fill(name)
  await chooseOption(page, '차 종류', '흑차')
  await page.getByRole('button', { name: '4점', exact: true }).click()
  await openDetails(page)
  await page.getByLabel('태그', { exact: true }).fill(`${koreanTag}, ${englishTag}`)
  await page.getByLabel('메모', { exact: true }).fill(notes)
  await page.getByRole('button', { name: '기록 저장', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  const detailURL = page.url()
  if (await page.getByRole('button', { name: '알림 닫기' }).count()) await page.getByRole('button', { name: '알림 닫기' }).click()
  await expectRenderedPretendard(context, page, ['.detail-header h1', '.tag-row span', '.detail-section .preserve-lines'])

  const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const height of [640, 844]) {
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height })
      await nav(page, '홈')
      await page.evaluate(() => document.fonts.ready)
      await noOverflow()
      const home = await page.locator('.new-entry-button.primary').evaluate((button) => {
        const box = button.getBoundingClientRect()
        const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        return { bottom: box.bottom, navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top, accessible: button === target || button.contains(target) }
      })
      expect(home.bottom).toBeLessThanOrEqual(home.navTop)
      expect(home.accessible).toBe(true)
      await nav(page, '새 기록')
      const input = await page.getByLabel('차 이름 *').evaluate((element) => {
        const box = element.getBoundingClientRect()
        return { bottom: box.bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top, accessible: document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === element }
      })
      expect(input.bottom).toBeLessThanOrEqual(input.saveTop)
      expect(input.accessible).toBe(true)
      await page.getByRole('checkbox', { name: /즐겨찾기에 담기/ }).scrollIntoViewIfNeeded()
      const bottom = await page.evaluate(() => {
        const save = document.querySelector('.save-bar').getBoundingClientRect()
        const checkbox = document.querySelector('.checkbox-field input').getBoundingClientRect()
        const links = [...document.querySelectorAll('.bottom-nav a')]
        return {
          saveBottom: save.bottom, navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top,
          checkboxBottom: checkbox.bottom, saveTop: save.top,
          navigationAccessible: links.every((link) => {
            const box = link.getBoundingClientRect()
            const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
            return box.left >= 0 && box.right <= innerWidth && box.height >= 44 && (link === target || link.contains(target))
          }),
        }
      })
      expect(bottom.checkboxBottom).toBeLessThanOrEqual(bottom.saveTop)
      expect(bottom.saveBottom).toBeLessThanOrEqual(bottom.navTop)
      expect(bottom.navigationAccessible).toBe(true)
      await noOverflow()
      await page.goto(detailURL)
      await expect(page.locator('.detail-section .preserve-lines')).toHaveText(notes)
      await expect(page.locator('.tag-row span')).toHaveCount(2)
      await page.locator('.detail-actions').scrollIntoViewIfNeeded()
      await noOverflow()
      await nav(page, '통계')
      await expect(page.locator('.stat-card').first()).toContainText('1 건')
      await expect(page.locator('.stat-card').nth(1)).toContainText('4.0')
      await expectRenderedPretendard(context, page, ['.stat-card strong', '.page-eyebrow'])
      await page.locator('.stats-memory').scrollIntoViewIfNeeded()
      await noOverflow()
      await nav(page, '설정')
      // Center the relocated backup control above the fixed bottom navigation.
      await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).evaluate((button) => button.scrollIntoView({ block: 'center' }))
      await noOverflow()
      await expectRenderedPretendard(context, page, ['.backup-actions button', '.section-heading h2'])
      const control = await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).evaluate((button) => {
        const box = button.getBoundingClientRect()
        const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
        return { bottom: box.bottom, navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top, accessible: button === target || button.contains(target) }
      })
      expect(control.bottom).toBeLessThanOrEqual(control.navTop)
      expect(control.accessible).toBe(true)
    }
  }
  await page.goto(detailURL)
  await page.reload()
  await expect(page.locator('.detail-section .preserve-lines')).toHaveText(notes)
  await expect(page.locator('.tag-row span')).toHaveCount(2)
  expect(issues).toEqual([])
})
