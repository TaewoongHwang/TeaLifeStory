import { defineStore } from 'pinia'
import { markRaw } from 'vue'
export const useAppStore = defineStore('app', {
  state: () => ({
    message: '', tone: 'success', installPrompt: null,
    installed: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  }),
  actions: {
    notify(message, tone = 'success') { this.message = message; this.tone = tone },
    captureInstallPrompt(event) { event.preventDefault(); this.installPrompt = markRaw(event) },
    markInstalled() { this.installed = true; this.installPrompt = null },
    async install() {
      const prompt = this.installPrompt
      if (!prompt || this.installed) return
      this.installPrompt = null
      try { await prompt.prompt(); await prompt.userChoice }
      catch { this.notify('설치 안내를 열지 못했습니다. 브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 이용해 주세요.', 'error') }
    },
  },
})
