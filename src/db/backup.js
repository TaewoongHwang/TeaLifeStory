import { getDB, storeNames } from './index.js'
import { optionStores } from '../config/defaults.js'
import { clone } from '../utils/entry.js'

export const MAX_BACKUP_SIZE = 30 * 1024 * 1024
const fail = () => { throw new Error('올바른 Tea Life Story 백업 파일이 아닙니다. 기존 데이터는 유지됩니다.') }
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)
const text = (value, max = 10000) => typeof value === 'string' && value.length <= max
const identifier = (value) => text(value, 200) && value.trim().length > 0
const number = (value) => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100000)
const iso = (value) => text(value, 40) && !Number.isNaN(Date.parse(value))
const date = (value) => value === '' || (text(value, 10) && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value)

export function validateEntry(entry, draft = false) {
  if (!isObject(entry) || !identifier(entry.id) || !iso(entry.createdAt) || !iso(entry.updatedAt)) fail()
  const { tea, brewing, context, experience, photos, tags } = entry
  if (![tea, brewing, context, experience].every(isObject)) fail()
  if (!text(tea.name, 200) || (!draft && !tea.name.trim()) || !text(tea.category, 100) || !number(tea.amount) || tea.amountUnit !== 'g') fail()
  if (!text(brewing.tool, 100) || !text(brewing.material, 100) || !number(brewing.volume) || brewing.volumeUnit !== 'cc') fail()
  if (!date(context.date) || !text(context.time, 5) || (context.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(context.time))) fail()
  if (!['location', 'people', 'reason'].every((key) => text(context[key]))) fail()
  if (!Number.isInteger(experience.rating) || experience.rating < 0 || experience.rating > 5) fail()
  if (!['body', 'aroma', 'taste', 'aftertaste', 'feeling', 'notes'].every((key) => text(experience[key]))) fail()
  if (!Array.isArray(tags) || tags.length > 30 || !tags.every((tag) => text(tag, 100))) fail()
  if (!Array.isArray(photos) || photos.length > 6 || !photos.every((photo) => isObject(photo) && identifier(photo.id) && text(photo.name, 200) && text(photo.data, 3 * 1024 * 1024) && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data))) fail()
  return clone(entry)
}

export function validateBackup(input) {
  if (!isObject(input) || input.app !== 'tea-life-story' || input.version !== 1 || !isObject(input.data)) fail()
  const data = {}
  for (const store of storeNames) {
    const items = input.data[store]
    if (!Array.isArray(items) || items.length > 10000) fail()
    const ids = new Set()
    data[store] = items.map((item) => {
      const id = store === 'settings' ? item?.key : item?.id
      if (!identifier(id) || ids.has(id)) fail()
      ids.add(id)
      if (store === 'entries') return validateEntry(item)
      if (optionStores.includes(store)) {
        if (!isObject(item) || !text(item.name, 100) || !item.name.trim()) fail()
        return { id: item.id, name: item.name.trim() }
      }
      if (item.key !== 'draft') fail()
      return { key: 'draft', value: validateEntry(item.value, true) }
    })
  }
  return { app: input.app, version: 1, data }
}

export async function exportBackup() {
  const db = await getDB()
  const transaction = db.transaction(storeNames, 'readonly')
  const values = await Promise.all(storeNames.map((store) => transaction.objectStore(store).getAll()))
  await transaction.done
  return { app: 'tea-life-story', version: 1, exportedAt: new Date().toISOString(), data: Object.fromEntries(storeNames.map((store, index) => [store, values[index]])) }
}

export async function importBackup(input, mode = 'replace') {
  const backup = validateBackup(input) // Validate everything before opening any write transaction.
  if (!['replace', 'merge'].includes(mode)) throw new Error('복원 방식을 선택해 주세요.')
  const db = await getDB()
  const transaction = db.transaction(storeNames, 'readwrite')
  try {
    for (const store of storeNames) {
      const target = transaction.objectStore(store)
      if (mode === 'replace') await target.clear()
      for (const item of backup.data[store]) {
        if (mode === 'merge') {
          const existing = await target.get(store === 'settings' ? item.key : item.id)
          if (existing && (store !== 'entries' || Date.parse(existing.updatedAt) >= Date.parse(item.updatedAt))) continue
        }
        await target.put(item)
      }
    }
    await transaction.done
  } catch (error) {
    try { transaction.abort() } catch { /* A failed transaction is already aborted. */ }
    await transaction.done.catch(() => {})
    throw error
  }
}
