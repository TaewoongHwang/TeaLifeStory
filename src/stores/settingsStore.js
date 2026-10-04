import { defineStore } from 'pinia'
import { listOptions, putOption, removeOption, getSetting, setSetting, deleteSetting } from '../db/settings.js'
import { exportBackup, importBackup } from '../db/backup.js'
import { normalizeEntry } from '../utils/entry.js'

// Serialize draft operations, so a pending autosave cannot recreate a discarded draft.
let draftQueue = Promise.resolve()
function queueDraft(operation) {
  draftQueue = draftQueue.catch(() => {}).then(operation)
  return draftQueue
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({ categories: [], tools: [], materials: [] }),
  actions: {
    async load() { Object.assign(this, await listOptions()) },
    async saveOption(store, name, id = crypto.randomUUID()) {
      const trimmed = name.trim()
      if (!trimmed || trimmed.length > 100) throw new Error('이름을 1~100자로 입력해 주세요.')
      if (this[store].some((item) => item.name === trimmed && item.id !== id)) throw new Error('이미 있는 이름입니다.')
      await putOption(store, { id, name: trimmed })
      await this.load()
    },
    async deleteOption(store, id) { await removeOption(store, id); await this.load() },
    getDraft() { return draftQueue.catch(() => {}).then(() => getSetting('draft')) },
    saveDraft(entry) {
      const snapshot = normalizeEntry(entry)
      return queueDraft(() => setSetting('draft', snapshot))
    },
    clearDraft() { return queueDraft(() => deleteSetting('draft')) },
    async exportData() { await draftQueue.catch(() => {}); return exportBackup() },
    async importData(data, mode) {
      await draftQueue.catch(() => {})
      await importBackup(data, mode)
      await this.load()
    },
  },
})
