import { defineStore } from 'pinia'
import { listEntries, putEntry, removeEntry } from '../db/entries.js'
import { validateEntry } from '../db/backup.js'
import { clone } from '../utils/entry.js'

export const useEntryStore = defineStore('entries', {
  state: () => ({ entries: [] }),
  actions: {
    async load() { this.entries = await listEntries() },
    async save(entry) {
      const saved = clone(entry)
      saved.tea.name = saved.tea.name.trim()
      saved.updatedAt = new Date().toISOString()
      validateEntry(saved)
      await putEntry(saved)
      const index = this.entries.findIndex((item) => item.id === saved.id)
      if (index < 0) this.entries.push(saved)
      else this.entries[index] = saved
      return saved.id
    },
    async remove(id) {
      await removeEntry(id)
      this.entries = this.entries.filter((entry) => entry.id !== id)
    },
  },
})
