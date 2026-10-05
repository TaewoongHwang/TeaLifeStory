import { getDB } from './index.js'
import { optionStores } from '../config/defaults.js'
import { clone, normalizeEntry } from '../utils/entry.js'

export async function listOptions() {
  const db = await getDB()
  const result = await Promise.all(optionStores.map((store) => db.getAll(store)))
  return Object.fromEntries(optionStores.map((store, index) => [store, result[index]]))
}
export async function putOption(store, option) {
  if (!optionStores.includes(store)) throw new Error('지원하지 않는 설정입니다.')
  return (await getDB()).put(store, clone(option))
}
export async function removeOption(store, id) {
  if (!optionStores.includes(store)) throw new Error('지원하지 않는 설정입니다.')
  return (await getDB()).delete(store, id)
}
export async function getSetting(key) {
  const item = await (await getDB()).get('settings', key)
  return key === 'draft' && item ? normalizeEntry(item.value) : item?.value
}
export async function setSetting(key, value) { return (await getDB()).put('settings', { key, value: clone(value) }) }
export async function deleteSetting(key) { return (await getDB()).delete('settings', key) }
