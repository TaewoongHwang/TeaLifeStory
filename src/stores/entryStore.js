import { defineStore } from 'pinia'
import { listEntries, putEntry, removeEntry, updateEntry } from '../db/entries.js'
import { validateEntry } from '../db/backup.js'
import { isMeal } from '../utils/record.js'

export const useEntryStore = defineStore('entries', {
  state: () => ({ entries: [] }),
  actions: {
    async load() { this.entries = await listEntries() },
    async save(entry) {
      let saved = validateEntry(entry)
      if (isMeal(saved)) saved.meal.name = saved.meal.name.trim()
      else saved.tea.name = saved.tea.name.trim()
      saved.updatedAt = new Date().toISOString()
      validateEntry(saved)
      // Keep feelings added in another tab while this meal form was open.
      if (isMeal(saved)) saved = await updateEntry(saved.id, current => validateEntry({ ...saved, observations: current.observations }), saved)
      else await putEntry(saved)
      const index = this.entries.findIndex((item) => item.id === saved.id)
      if (index < 0) this.entries.push(saved)
      else this.entries[index] = saved
      return saved.id
    },
    async remove(id) {
      await removeEntry(id)
      this.entries = this.entries.filter((entry) => entry.id !== id)
    },
    async toggleFavorite(id) {
      const entry = this.entries.find((item) => item.id === id)
      if (!entry) throw new Error('기록을 찾을 수 없습니다.')
      await this.save({ ...entry, favorite: !entry.favorite })
    },
    async saveObservation(id, observation, remove = false) {
      const saved = await updateEntry(id, (entry) => {
        if (!isMeal(entry)) throw new Error('밥 기록에만 식후 느낌을 남길 수 있습니다.')
        const index = entry.observations.findIndex((item) => item.id === observation.id)
        if (remove) entry.observations = entry.observations.filter((item) => item.id !== observation.id)
        else if (index < 0) entry.observations.push(observation)
        else entry.observations[index] = observation
        entry.updatedAt = new Date().toISOString()
        return validateEntry(entry)
      })
      const index = this.entries.findIndex((item) => item.id === id)
      if (index >= 0) this.entries[index] = saved
      else this.entries.push(saved)
    },
  },
})
