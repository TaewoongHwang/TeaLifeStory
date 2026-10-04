import { getDB } from './index.js'
import { clone } from '../utils/entry.js'

export async function listEntries() { return (await getDB()).getAll('entries') }
export async function putEntry(entry) { return (await getDB()).put('entries', clone(entry)) }
export async function removeEntry(id) { return (await getDB()).delete('entries', id) }
