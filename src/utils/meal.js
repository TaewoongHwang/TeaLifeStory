import { isMeal } from './record.js'

export function createPurchase() {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), createdAt: now, updatedAt: now, name: '', product: '', shop: '', date: '', notes: '', favorite: false }
}
export function mealStatus(entry) {
  if (!entry.observations.length) return 'missing'
  return entry.observations.some((item) => item.feelings.some((feeling) => feeling !== '편안함')) ? 'discomfort' : 'comfortable'
}
export const statusLabels = { missing: '식후 느낌 미기록', comfortable: '편안함만 기록', discomfort: '불편함 기록 있음' }
const key = (name) => name.trim().normalize('NFKC').toLocaleLowerCase('ko-KR')
export function findMealPatterns(entries, { ingredients = [], venue = '', from = '', to = '', source = '' } = {}) {
  const selected = ingredients.map(key).filter(Boolean)
  const rows = entries.filter((entry) => isMeal(entry) && (!from || entry.context.date >= from) && (!to || entry.context.date <= to)
    && (!venue || entry.meal.venue === venue) && (!source || entry.meal.source === source)
    && selected.every((name) => entry.meal.ingredients.some((food) => key(food.name) === name)))
    .sort((a, b) => `${b.context.date}T${b.context.time}`.localeCompare(`${a.context.date}T${a.context.time}`))
  const result = { rows, total: rows.length, observed: 0, comfortable: 0, discomfort: 0, missing: 0 }
  for (const entry of rows) result[mealStatus(entry)]++
  result.observed = result.total - result.missing
  return result
}
