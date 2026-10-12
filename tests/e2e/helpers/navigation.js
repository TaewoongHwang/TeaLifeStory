export async function nav(page, name) {
  if (name === '통계') {
    await page.getByRole('navigation').getByRole('link', { name: '설정', exact: true }).click()
    await page.getByRole('link', { name: '통계 보기', exact: true }).click()
    return
  }
  await page.getByRole('navigation').getByRole('link', { name: name === '홈' ? '기록' : name, exact: true }).click()
}
