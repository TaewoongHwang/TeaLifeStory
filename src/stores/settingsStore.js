import { defineStore } from 'pinia'
import { listOptions, putOption, removeOption, getSetting, setSetting, deleteSetting } from '../db/settings.js'
import { exportBackup, importBackup } from '../db/backup.js'
import { normalizeEntry } from '../utils/entry.js'

// Serialize draft operations, so a pending autosave cannot recreate a discarded draft.
let draftQueue = Promise.resolve()
let preferenceQueue = Promise.resolve()
function queueDraft(operation) {
  draftQueue = draftQueue.catch(() => {}).then(operation)
  return draftQueue
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({ categories: [], tools: [], materials: [], entryDetailsExpanded: false }),
  actions: {
    async load() {
      const [options, expanded] = await Promise.all([listOptions(), getSetting('entryDetailsExpanded')])
      Object.assign(this, options)
      this.entryDetailsExpanded = expanded === true
    },
    saveEntryDetailsExpanded(expanded) {
      preferenceQueue = preferenceQueue.catch(() => {}).then(async () => {
        if (typeof expanded !== 'boolean') throw new Error('작성 방식은 펼침 또는 접힘으로 선택해 주세요.')
        await setSetting('entryDetailsExpanded', expanded)
        this.entryDetailsExpanded = expanded
      })
      return preferenceQueue
    },
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
    async exportData() { await Promise.all([draftQueue.catch(() => {}), preferenceQueue.catch(() => {})]); return exportBackup() },
    async importData(data, mode) {
      await Promise.all([draftQueue.catch(() => {}), preferenceQueue.catch(() => {})])
      await importBackup(data, mode)
      await this.load()
    },
  },
})
