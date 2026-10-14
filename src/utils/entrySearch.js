import { displayToolName } from '../config/defaults.js'

const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim()

export function parseEntrySearch(search) {
  return normalize(search).split(' ').filter(Boolean).map((text) => {
    const iso = text.match(/^(\d{4})[-./](\d{1,2})(?:[-./](\d{1,2}))?$/)
    const korean = text.match(/^(?:(\d{1,4})년)?(?:(\d{1,2})월)?(?:(\d{1,2})일)?$/)
    if (iso || korean) {
      const parts = iso || korean
      return { type: 'date', year: parts[1] ? Number(parts[1]) : null, month: parts[2] ? Number(parts[2]) : null, day: parts[3] ? Number(parts[3]) : null }
    }
    return { type: 'text', text }
  })
}

function searchableFields(entry) {
  const fields = [
    { label: '차 이름', value: entry.tea.name },
    { label: '차 종류', value: entry.tea.category, alias: entry.tea.category === '블렌딩차' ? '블렌딩티' : '' },
    { label: '감상', value: entry.experience.feeling },
    { label: '향', value: entry.experience.aroma },
    { label: '맛', value: entry.experience.taste },
    { label: '여운', value: entry.experience.aftertaste },
    { label: '바디감', value: entry.experience.body },
    { label: '메모', value: entry.experience.notes },
    { label: '장소', value: entry.context.location },
    { label: '함께한 사람', value: entry.context.people },
    { label: '마신 이유', value: entry.context.reason },
    { label: '차구', value: displayToolName(entry.brewing.tool), alias: entry.brewing.tool },
    { label: '재질', value: entry.brewing.material },
    { label: '태그', value: entry.tags.map((tag) => `#${tag}`).join(' ') },
  ]
  return fields.filter((field) => field.value).map((field) => ({ ...field, text: normalize(field.value), alias: normalize(field.alias || '') }))
}

function matchesField(field, term) {
  return field.text.includes(term.text) || field.alias.includes(term.text)
}

export function matchesEntrySearch(entry, terms) {
  if (!terms.length) return true
  const fields = searchableFields(entry)
  const [year, month, day] = entry.context.date.split('-').map(Number)
  return terms.every((term) => {
    if (term.type === 'date') {
      return Boolean(entry.context.date) && (term.year === null || term.year === year) &&
        (term.month === null || term.month === month) && (term.day === null || term.day === day)
    }
    // Bare years and complete times are useful; single digits must not match every date.
    const dateMatch = /^\d{4}$/.test(term.text) && Boolean(entry.context.date) && Number(term.text) === year
    const timeMatch = /^\d{1,2}:\d{2}$/.test(term.text) && entry.context.time === term.text.padStart(5, '0')
    return dateMatch || timeMatch || fields.some((field) => matchesField(field, term))
  })
}

export function entrySearchSnippet(entry, search) {
  const terms = parseEntrySearch(search).filter((term) => term.type === 'text')
  if (!terms.length) return null
  // Prefer a matching description that would otherwise be hidden on the card.
  const fields = searchableFields(entry).slice(2)
  const match = fields.map((field) => ({ ...field, score: terms.filter((term) => matchesField(field, term)).length }))
    .filter((field) => field.score > 0).sort((a, b) => b.score - a.score)[0]
  if (!match) return null
  const text = match.value.normalize('NFKC').replace(/\s+/g, ' ').trim()
  const escaped = terms.map((term) => term.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length)
  const pattern = new RegExp(escaped.join('|'), 'giu')
  const first = pattern.exec(text)
  const start = Math.max(0, (first?.index || 0) - 30)
  const end = Math.min(text.length, Math.max(start + 110, (first?.index || 0) + (first?.[0].length || 0)))
  const excerpt = `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
  pattern.lastIndex = 0
  const parts = []
  let position = 0
  for (const found of excerpt.matchAll(pattern)) {
    if (found.index > position) parts.push({ text: excerpt.slice(position, found.index), matched: false })
    parts.push({ text: found[0], matched: true })
    position = found.index + found[0].length
  }
  if (position < excerpt.length) parts.push({ text: excerpt.slice(position), matched: false })
  return { label: match.label, parts }
}
