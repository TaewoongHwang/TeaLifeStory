import { defineStore } from 'pinia'
export const useAppStore = defineStore('app', {
  state: () => ({ message: '', tone: 'success' }),
  actions: { notify(message, tone = 'success') { this.message = message; this.tone = tone } },
})
