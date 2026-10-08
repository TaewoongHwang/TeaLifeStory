import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { createEntry } from '../../src/utils/entry.js'

const heroDescription = '자사호와 찻잔, 차가 담긴 공도배가 놓인 차 자리'
const nav = (page, name) => page.getByRole('navigation').getByRole('link', { name, exact: true }).click()

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
  await expect(page.getByRole('heading', { name: '오늘은 어떤 차를 마셨나요?' })).toBeVisible()
}

async function loadedImage(image) {
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true)
}

async function backup(page) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: '전체 데이터 내보내기', exact: true }).click()
  const file = await pending
  expect(await file.failure()).toBeNull()
  expect(file.suggestedFilename()).toMatch(/^tea-life-story-.*\.json$/)
  return JSON.parse(readFileSync(await file.path(), 'utf8'))
}

test('차곡차곡 branding, generated hero and native icons use the deployment base without missing assets', async ({ page, request }) => {
  const issues = diagnostics(page)
  await start(page)
  const base = new URL(page.url()).pathname
  await expect(page).toHaveTitle('차곡차곡 · 나의 차 일기')
  await expect(page.locator('.brand')).toHaveText(/차곡차곡\s*나의 차 일기/)
  await expect(page.locator('body')).not.toContainText(/Tea Life Story/i)
  const brandImage = page.locator('.brand-mark-image')
  await expect(brandImage).toHaveAttribute('alt', '')
  await expect(brandImage).toHaveAttribute('aria-hidden', 'true')
  await expect(brandImage).toHaveAttribute('src', `${base}icons/chagok-icon-192.png`)
  await loadedImage(brandImage)
  const hero = page.locator('img.tea-illustration')
  await expect(hero).toHaveAttribute('alt', heroDescription)
  await expect(hero).toHaveAttribute('src', `${base}images/chagok-tea-hero.webp`)
  await loadedImage(hero)

  const manifestHref = await page.locator('link[rel=manifest]').getAttribute('href')
  const manifestResponse = await request.get(new URL(manifestHref, page.url()).href)
  expect(manifestResponse.status()).toBe(200)
  const manifest = await manifestResponse.json()
  expect(manifest.name).toBe('차곡차곡')
  expect(manifest.short_name).toBe('차곡차곡')
  expect(manifest.lang).toBe('ko')
  for (const key of ['id', 'start_url', 'scope']) expect(manifest[key]).toBe(base)
  const iconFiles = [
    ['chagok-icon-192.png', 192, undefined],
    ['chagok-icon-512.png', 512, undefined],
    ['chagok-icon-maskable-512.png', 512, 'maskable'],
  ]
  expect(manifest.icons).toHaveLength(iconFiles.length)
  for (const [file, size, purpose] of iconFiles) {
    const icon = manifest.icons.find((item) => item.src === `${base}icons/${file}`)
    expect(icon).toBeDefined()
    expect(icon.sizes).toBe(`${size}x${size}`)
    expect(icon.type).toBe('image/png')
    expect(icon.purpose).toBe(purpose)
  }
  const favicon = page.locator('link[rel=icon]')
  await expect(favicon).toHaveAttribute('type', 'image/png')
  await expect(favicon).toHaveAttribute('href', `${base}icons/chagok-icon-192.png`)
  await expect(page.locator('link[rel=apple-touch-icon]')).toHaveAttribute('href', `${base}icons/chagok-apple-touch-icon.png`)
  for (const [file, size] of [...iconFiles, ['chagok-apple-touch-icon.png', 180]]) {
    const response = await request.get(new URL(`${base}icons/${file}`, page.url()).href)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
    const buffer = await response.body()
    expect([...buffer.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
    expect(buffer.readUInt32BE(16)).toBe(size)
    expect(buffer.readUInt32BE(20)).toBe(size)
  }
  const heroResponse = await request.get(new URL(`${base}images/chagok-tea-hero.webp`, page.url()).href)
  expect(heroResponse.status()).toBe(200)
  expect(heroResponse.headers()['content-type']).toContain('image/webp')
  const heroBuffer = await heroResponse.body()
  expect(heroBuffer.toString('ascii', 0, 4)).toBe('RIFF')
  expect(heroBuffer.toString('ascii', 8, 12)).toBe('WEBP')
  const assetPaths = await page.locator('script[src], link[rel=stylesheet]').evaluateAll((elements) => elements.map((element) => new URL(element.src || element.href).pathname))
  expect(assetPaths.length).toBeGreaterThan(0)
  for (const path of assetPaths) expect(path.startsWith(base)).toBe(true)
  await nav(page, '설정')
  await expect(page.locator('.settings-footer')).toContainText('차곡차곡')
  await expect(page.locator('body')).not.toContainText(/Tea Life Story/i)
  expect(issues).toEqual([])
})

test('generated home artwork and new brand preserve mobile diary entry and bottom navigation access', async ({ page }) => {
  const issues = diagnostics(page)
  await start(page)
  for (const height of [640, 844]) {
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height })
      await loadedImage(page.locator('img.tea-illustration'))
      const layout = await page.locator('.new-entry-button').evaluate((button) => {
        const rect = button.getBoundingClientRect()
        const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          bottom: rect.bottom, navTop: document.querySelector('.bottom-nav').getBoundingClientRect().top,
          clickable: button === target || button.contains(target),
        }
      })
      expect(layout.overflow).toBe(false)
      expect(layout.bottom).toBeLessThanOrEqual(layout.navTop)
      expect(layout.clickable).toBe(true)
      const linksAccessible = await page.locator('.bottom-nav a').evaluateAll((links) => links.every((link) => {
        const rect = link.getBoundingClientRect()
        const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        return rect.left >= 0 && rect.right <= innerWidth && rect.height >= 44 && (link === target || link.contains(target))
      }))
      expect(linksAccessible).toBe(true)
      await page.locator('.new-entry-button').click()
      await expect(page).toHaveURL(/#\/entries\/new$/)
      const inputLayout = await page.getByLabel('차 이름 *').evaluate((input) => {
        const rect = input.getBoundingClientRect()
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          bottom: rect.bottom, saveTop: document.querySelector('.save-bar').getBoundingClientRect().top,
          clickable: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === input,
        }
      })
      expect(inputLayout.overflow).toBe(false)
      expect(inputLayout.bottom).toBeLessThanOrEqual(inputLayout.saveTop)
      expect(inputLayout.clickable).toBe(true)
      await nav(page, '홈')
    }
  }
  expect(issues).toEqual([])
})

test('existing tea-life-story database and v1 JSON remain compatible; generated artwork and new routes work offline', async ({ page, context, browser }) => {
  const issues = diagnostics(page)
  await start(page)
  const entry = createEntry()
  Object.assign(entry, { id: 'before-chagok-entry', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z', favorite: true })
  Object.assign(entry.tea, { name: '이름을 바꾸기 전에 남긴 보이차', category: '나의 보이차' })
  Object.assign(entry.context, { date: '2026-01-02', time: '09:00', location: '창가', people: '오랜 친구', reason: '차 한 잔의 안부' })
  entry.experience.rating = 4
  entry.experience.notes = '앱의 이름과 그림이 달라져도 이 이야기는 그대로 남아요.'
  entry.tags = ['이전 기록', '보존']
  entry.photos = [{ id: 'before-chagok-photo', name: '이전 사진.png', data: `data:image/png;base64,${readFileSync('public/icons/icon-192.png').toString('base64')}` }]
  const draft = createEntry()
  draft.id = 'before-chagok-draft'
  draft.tea.name = '이전에 작성하던 초안'
  const data = {
    entries: [entry], categories: [{ id: 'before-category', name: '나의 보이차' }],
    tools: [{ id: 'before-tool', name: '내 자사호' }], materials: [{ id: 'before-material', name: '내 자사' }],
    settings: [{ key: 'draft', value: draft }],
  }
  // Seed the pre-branding DB directly in an isolated browser, then open the renamed app.
  await page.evaluate(async (data) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('tea-life-story', 1)
      request.onupgradeneeded = () => {
        for (const store of Object.keys(data)) request.result.createObjectStore(store, { keyPath: store === 'settings' ? 'key' : 'id' })
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(Object.keys(data), 'readwrite')
        for (const [store, items] of Object.entries(data)) {
          const target = transaction.objectStore(store)
          target.clear()
          for (const item of items) target.put(item)
        }
        transaction.oncomplete = () => { db.close(); resolve() }
        transaction.onerror = () => { db.close(); reject(transaction.error) }
        transaction.onabort = () => { db.close(); reject(transaction.error) }
      }
    })
  }, data)
  await page.reload()
  await expect(page.locator('.tea-card')).toContainText(entry.tea.name)
  await nav(page, '설정')
  const original = await backup(page)
  expect(original.app).toBe('tea-life-story')
  expect(original.version).toBe(1)
  expect(original.data).toEqual(data)

  const restoredContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  try {
    const restoredPage = await restoredContext.newPage()
    const restoredIssues = diagnostics(restoredPage)
    await restoredPage.goto(new URL('./#/settings', page.url()).href)
    await expect(restoredPage.getByRole('heading', { name: '나의 일기장 설정', exact: true })).toBeVisible()
    await restoredPage.locator('#backup-file').setInputFiles({ name: 'tea-life-story-old-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(original)) })
    await restoredPage.getByRole('dialog').getByRole('radio', { name: /^전체 교체/ }).check()
    await restoredPage.getByRole('button', { name: '전체 교체하기', exact: true }).click()
    await expect(restoredPage.getByRole('dialog')).toHaveCount(0)
    await restoredPage.reload()
    const restored = await backup(restoredPage)
    expect(restored.app).toBe('tea-life-story')
    expect(restored.version).toBe(1)
    expect(restored.data).toEqual(data)
    await nav(restoredPage, '새 기록')
    await restoredPage.getByRole('button', { name: '이어쓰기', exact: true }).click()
    await expect(restoredPage.getByLabel('차 이름 *')).toHaveValue(draft.tea.name)
    expect(restoredIssues).toEqual([])
  } finally { await restoredContext.close() }

  await nav(page, '홈')
  await loadedImage(page.locator('img.tea-illustration'))
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await context.setOffline(true)
  await page.reload()
  await expect(page).toHaveTitle('차곡차곡 · 나의 차 일기')
  await expect(page.getByText(/오프라인 ·/)).toBeVisible()
  await loadedImage(page.locator('img.tea-illustration'))
  await loadedImage(page.locator('.brand-mark-image'))
  await nav(page, '통계')
  await page.getByLabel('돌아보고 싶은 달', { exact: true }).fill('2026-01')
  await expect(page.locator('.stat-card').first()).toContainText('1 건')
  await nav(page, '기록')
  await page.locator('.tea-card').click()
  await expect(page.getByRole('heading', { name: entry.tea.name, exact: true })).toBeVisible()
  await expect(page.locator('.detail-photos img')).toHaveCount(1)
  await nav(page, '설정')
  expect((await backup(page)).data).toEqual(data)
  expect(issues).toEqual([])
})
