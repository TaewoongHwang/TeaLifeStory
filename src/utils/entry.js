export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function createEntry() {
  const now = new Date()
  return {
    id: crypto.randomUUID(), createdAt: now.toISOString(), updatedAt: now.toISOString(),
    tea: { name: '', category: '', amount: null, amountUnit: 'g' },
    brewing: { tool: '', material: '', volume: null, volumeUnit: 'cc' },
    context: { date: localDate(now), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, location: '', people: '', reason: '' },
    experience: { rating: 0, body: '', aroma: '', taste: '', aftertaste: '', feeling: '', notes: '' },
    photos: [], tags: [],
  }
}

export const clone = (value) => JSON.parse(JSON.stringify(value))
export function normalizeEntry(value) {
  const entry = clone(value)
  if (entry.tea.amount === '') entry.tea.amount = null
  if (entry.brewing.volume === '') entry.brewing.volume = null
  return entry
}
export const entryDate = (entry) => `${entry.context.date}T${entry.context.time || '00:00'}`
export function formatDate(value, options = { month: 'long', day: 'numeric', weekday: 'short' }) {
  if (!value) return '날짜 미입력'
  return new Intl.DateTimeFormat('ko-KR', options).format(new Date(`${value}T12:00:00`))
}
export function summarize(entries, month = localDate().slice(0, 7)) {
  const current = entries.filter((entry) => entry.context.date.startsWith(month))
  const rated = current.filter((entry) => entry.experience.rating > 0)
  const counts = new Map()
  for (const entry of current) {
    const category = entry.tea.category || '미분류'
    counts.set(category, (counts.get(category) || 0) + 1)
  }
  const categories = [...counts].sort((a, b) => b[1] - a[1])
  return { count: current.length, average: rated.length ? (rated.reduce((sum, entry) => sum + entry.experience.rating, 0) / rated.length).toFixed(1) : '—', categories, favorite: categories[0]?.[0] || '—' }
}

export function filterEntries(entries, { search = '', category = '', rating = '', from = '', to = '', sort = 'newest' } = {}) {
  const query = search.trim().toLocaleLowerCase()
  return entries.filter((entry) => {
    const haystack = [entry.tea.name, entry.experience.notes, entry.experience.feeling, ...entry.tags].join(' ').toLocaleLowerCase()
    return (!query || haystack.includes(query)) && (!category || entry.tea.category === category) &&
      (rating === '' || entry.experience.rating === Number(rating)) &&
      (!from || entry.context.date >= from) && (!to || entry.context.date <= to)
  }).sort((a, b) => {
    if (sort === 'rating') return b.experience.rating - a.experience.rating || entryDate(b).localeCompare(entryDate(a))
    return sort === 'oldest' ? entryDate(a).localeCompare(entryDate(b)) : entryDate(b).localeCompare(entryDate(a))
  })
}
