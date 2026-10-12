import { expect } from '@playwright/test'

export async function chooseOption(page, label, name) {
  const group = page.getByRole('group', { name: label, exact: true })
  await expect(group).toBeVisible()
  const button = group.getByRole('button', { name, exact: true })
  if (!await button.isVisible()) await group.locator('summary').click()
  await button.click()
}
