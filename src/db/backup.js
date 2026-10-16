import { getDB, storeNames } from './index.js'
import { optionStores } from '../config/defaults.js'
import { normalizeEntry } from '../utils/entry.js'
import { isMeal } from '../utils/record.js'
import { fail, isObject, text, identifier, number, iso, date } from './validation.js'
import { validateMealFields, validatePurchase } from './mealValidation.js'

export const MAX_BACKUP_SIZE = 30 * 1024 * 1024

export function validateEntry(entry, draft = false) {
  if (!isObject(entry) || !identifier(entry.id) || !iso(entry.createdAt) || !iso(entry.updatedAt)) fail()
  if (entry.kind !== undefined && !['tea', 'meal'].includes(entry.kind)) fail()
  if (![entry.context, entry.experience].every(isObject)) fail()
  if (!isMeal(entry) && ![entry.tea, entry.brewing].every(isObject)) fail()
  // Drafts can contain unfinished out-of-range inputs. Final entries keep their bounds.
  const numeric = (value, max) => draft
    ? value === null || (typeof value === 'number' && Number.isFinite(value))
    : number(value, max)
  // Check raw numbers before JSON cloning could turn Infinity/NaN into null.
  if (!isMeal(entry)) {
    if (entry.tea.amount !== '' && !numeric(entry.tea.amount)) fail()
    if (entry.brewing.volume !== '' && !numeric(entry.brewing.volume)) fail()
    for (const [key, max] of [['waterTemperature', 100], ['steepTime', 100000]]) {
      if (Object.hasOwn(entry.brewing, key) && entry.brewing[key] !== '' && !numeric(entry.brewing[key], max)) fail()
    }
  }
  const normalized = normalizeEntry(entry)
  const { tea, brewing, context, experience, photos, tags, favorite } = normalized
  if (isMeal(normalized)) validateMealFields(normalized, draft)
  else {
    if (!text(tea.name, 200) || (!draft && !tea.name.trim()) || !text(tea.category, 100) || !numeric(tea.amount) || tea.amountUnit !== 'g') fail()
    if (!text(brewing.tool, 100) || !text(brewing.material, 100) || !numeric(brewing.volume) || brewing.volumeUnit !== 'cc') fail()
    if (!numeric(brewing.waterTemperature, 100) || !numeric(brewing.steepTime)) fail()
  }
  if (typeof favorite !== 'boolean') fail()
  if (!date(context.date) || !text(context.time, 5) || (context.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(context.time))) fail()
  if (!['location', 'people', 'reason'].every((key) => text(context[key]))) fail()
  if (!Number.isInteger(experience.rating) || experience.rating < 0 || experience.rating > 5) fail()
  if (!['body', 'aroma', 'taste', 'aftertaste', 'feeling', 'notes'].every((key) => text(experience[key]))) fail()
  if (!Array.isArray(tags) || tags.length > 30 || !tags.every((tag) => text(tag, 100))) fail()
  if (!Array.isArray(photos) || photos.length > 6 || !photos.every((photo) => isObject(photo) && identifier(photo.id) && text(photo.name, 200) && text(photo.data, 3 * 1024 * 1024) && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data))) fail()
  return normalized
}

export function validateBackup(input) {
  if (!isObject(input) || input.app !== 'tea-life-story' || ![1, 2].includes(input.version) || !isObject(input.data)) fail()
  const data = {}
  for (const store of storeNames) {
    const items = input.version === 1 && store === 'purchases' && input.data[store] === undefined ? [] : input.data[store]
    if (!Array.isArray(items) || items.length > 10000) fail()
    const ids = new Set()
    data[store] = items.map((item) => {
      const id = store === 'settings' ? item?.key : item?.id
      if (!identifier(id) || ids.has(id)) fail()
      ids.add(id)
      if (store === 'entries') { if (input.version === 1 && isMeal(item)) fail(); return validateEntry(item) }
      if (store === 'purchases') { if (input.version === 1) fail(); return validatePurchase(item) }
      if (optionStores.includes(store)) {
        if (!isObject(item) || !text(item.name, 100) || !item.name.trim()) fail()
        return { id: item.id, name: item.name.trim() }
      }
      if (item.key === 'entryDetailsExpanded') {
        if (typeof item.value !== 'boolean') fail()
        return { key: item.key, value: item.value }
      }
      if (!['draft', 'mealDraft'].includes(item.key)) fail()
      if (input.version === 1 && item.key === 'mealDraft') fail()
      const value = validateEntry(item.value, true)
      if (isMeal(value) !== (item.key === 'mealDraft')) fail()
      return { key: item.key, value }
    })
  }
  return { app: input.app, version: input.version, data }
}

export async function exportBackup() {
  const db = await getDB()
  const transaction = db.transaction(storeNames, 'readonly')
  const values = await Promise.all(storeNames.map((store) => transaction.objectStore(store).getAll()))
  await transaction.done
  const data = Object.fromEntries(storeNames.map((store, index) => [store, values[index]]))
  data.entries = data.entries.map(normalizeEntry)
  data.settings = data.settings.map((item) => ['draft', 'mealDraft'].includes(item.key) ? { ...item, value: normalizeEntry(item.value) } : item)
  return { app: 'tea-life-story', version: 2, exportedAt: new Date().toISOString(), data }
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
          if (existing && (!['entries', 'purchases'].includes(store) || Date.parse(existing.updatedAt) >= Date.parse(item.updatedAt))) continue
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
