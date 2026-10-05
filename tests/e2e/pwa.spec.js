import { test, expect } from '@playwright/test'

test('production manifest and service worker meet Chromium installability checks', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '오늘은 어떤 차를 마셨나요?' })).toBeVisible()
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  const session = await context.newCDPSession(page)
  const manifest = await session.send('Page.getAppManifest')
  expect(manifest.errors).toEqual([])
  expect(JSON.parse(manifest.data).display).toBe('standalone')
  const result = await session.send('Page.getInstallabilityErrors')
  expect(result.installabilityErrors).toEqual([])
  await session.detach()
})

test('install request survives route changes; dismissals, failures and installation are handled', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '오늘은 어떤 차를 마셨나요?' })).toBeVisible()
  // OS installation cannot run headlessly. Exercise the browser event contract.
  async function requestInstall(fail = false) {
    await page.evaluate((fail) => {
      const event = new Event('beforeinstallprompt', { cancelable: true })
      event.prompt = async () => {
        window.installCalls = (window.installCalls || 0) + 1
        if (fail) throw new Error('Install prompt unavailable')
      }
      event.userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(event)
    }, fail)
  }
  const nav = (name) => page.getByRole('navigation').getByRole('link', { name, exact: true }).click()
  await requestInstall()
  await nav('기록')
  await nav('설정')
  await page.getByRole('button', { name: '앱 설치', exact: true }).click()
  await expect(page.getByRole('button', { name: '앱 설치', exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => window.installCalls)).toBe(1)
  await nav('홈')
  await requestInstall(true)
  await nav('설정')
  await page.getByRole('button', { name: '앱 설치', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('설치 안내를 열지 못했습니다')
  await page.getByRole('button', { name: '알림 닫기' }).click()
  await nav('홈')
  await requestInstall()
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await nav('설정')
  await expect(page.getByRole('heading', { name: '홈 화면의 차 일기장' })).toBeVisible()
  await expect(page.getByRole('button', { name: '앱 설치', exact: true })).toHaveCount(0)
  expect(errors).toEqual([])
})
