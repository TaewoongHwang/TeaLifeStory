import { getDB } from './index.js'
import { normalizeEntry } from '../utils/entry.js'

export async function listEntries() { return (await (await getDB()).getAll('entries')).map(normalizeEntry) }
export async function putEntry(entry) { return (await getDB()).put('entries', normalizeEntry(entry)) }
export async function removeEntry(id) { return (await getDB()).delete('entries', id) }
