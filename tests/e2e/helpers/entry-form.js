import { expect } from '@playwright/test'

export async function openDetails(page) {
  const button = page.locator('.entry-details-toggle')
  if (await button.getAttribute('aria-expanded') === 'false') await button.click()
  await expect(page.getByRole('region', { name: '세부 기록', exact: true })).toBeVisible()
}

export async function chooseOption(page, label, name) {
  if (label !== '차 종류') await openDetails(page)
  const group = page.getByRole('group', { name: label, exact: true })
  await expect(group).toBeVisible()
  const button = group.getByRole('button', { name, exact: true })
  if (!await button.isVisible()) await group.locator('summary').click()
  await button.click()
}
