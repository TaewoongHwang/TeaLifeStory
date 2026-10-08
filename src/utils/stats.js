const compareText = (a, b) => a < b ? -1 : a > b ? 1 : 0
const averageRating = (entries) => {
  const rated = entries.filter((entry) => entry.experience.rating > 0)
  return rated.length
    ? (rated.reduce((sum, entry) => sum + entry.experience.rating, 0) / rated.length).toFixed(1)
    : '—'
}

export function buildTeaStats(entries, month) {
  const undatedCount = entries.filter((entry) => !entry.context.date.trim()).length
  const empty = { count: 0, average: '—', ratedCount: 0, days: 0, favoriteCount: 0, undatedCount, categories: [], trend: [], highlights: [] }
  if (typeof month !== 'string' || month.length !== 7 || !/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(month)) return empty

  const current = entries.filter((entry) => entry.context.date.slice(0, 7) === month)
  const groups = new Map()
  for (const entry of current) {
    const name = entry.tea.category.trim() || '미분류'
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(entry)
  }
  const categories = [...groups].map(([name, group]) => ({
    name,
    count: group.length,
    ratedCount: group.filter((entry) => entry.experience.rating > 0).length,
    average: averageRating(group),
    share: Math.round(group.length / current.length * 100),
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko-KR') || compareText(a.name, b.name))

  // Integer month offsets avoid Date's special treatment of years below 100.
  const [year, monthNumber] = month.split('-').map(Number)
  const selectedIndex = (year - 1) * 12 + monthNumber - 1
  const counts = new Map()
  for (const entry of entries) {
    const key = entry.context.date.slice(0, 7)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  const trend = []
  for (let index = Math.max(0, selectedIndex - 5); index <= selectedIndex; index++) {
    const number = index % 12 + 1
    const key = `${String(Math.floor(index / 12) + 1).padStart(4, '0')}-${String(number).padStart(2, '0')}`
    trend.push({ month: key, label: `${number}월`, count: counts.get(key) || 0 })
  }

  const highlights = current
    .filter((entry) => entry.favorite === true || entry.experience.rating >= 4)
    .sort((a, b) => Number(b.favorite === true) - Number(a.favorite === true)
      || b.experience.rating - a.experience.rating
      || compareText(`${b.context.date}T${b.context.time || '00:00'}`, `${a.context.date}T${a.context.time || '00:00'}`)
      || compareText(a.id, b.id))
    .slice(0, 3)

  return {
    count: current.length,
    average: averageRating(current),
    ratedCount: current.filter((entry) => entry.experience.rating > 0).length,
    days: new Set(current.map((entry) => entry.context.date)).size,
    favoriteCount: current.filter((entry) => entry.favorite === true).length,
    undatedCount,
    categories,
    trend,
    highlights,
  }
}
