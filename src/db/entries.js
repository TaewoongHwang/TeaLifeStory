import { getDB } from './index.js'
import { normalizeEntry } from '../utils/entry.js'

export async function listEntries() { return (await (await getDB()).getAll('entries')).map(normalizeEntry) }
export async function putEntry(entry) { return (await getDB()).put('entries', normalizeEntry(entry)) }
export async function removeEntry(id) { return (await getDB()).delete('entries', id) }
export async function updateEntry(id, change, initial = null) {
  const db = await getDB()
  const tx = db.transaction('entries', 'readwrite')
  try {
    const current = await tx.store.get(id)
    if (!current && !initial) throw new Error('기록을 찾을 수 없습니다.')
    const next = change(normalizeEntry(current || initial))
    await tx.store.put(next)
    await tx.done
    return next
  } catch (error) {
    try { tx.abort() } catch { /* Already aborted. */ }
    await tx.done.catch(() => {})
    throw error
  }
}
