<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import AppHeader from './components/AppHeader.vue'
import BottomNavigation from './components/BottomNavigation.vue'
import { useEntryStore } from './stores/entryStore.js'
import { useSettingsStore } from './stores/settingsStore.js'
import { useAppStore } from './stores/appStore.js'

const entries = useEntryStore()
const settings = useSettingsStore()
const app = useAppStore()
const ready = ref(false)
const error = ref('')
const online = ref(navigator.onLine)
const { needRefresh, updateServiceWorker } = useRegisterSW({ onRegisterError: () => app.notify('오프라인 준비에 실패했습니다. 인터넷 연결 후 다시 열어 주세요.', 'error') })
const updateConnection = () => { online.value = navigator.onLine }
async function initialize() {
  error.value = ''
  try { await Promise.all([entries.load(), settings.load()]); ready.value = true }
  catch { error.value = '저장소를 열지 못했습니다. 브라우저의 저장 공간과 개인정보 보호 설정을 확인해 주세요.' }
}
onMounted(() => { initialize(); window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection) })
onUnmounted(() => { window.removeEventListener('online', updateConnection); window.removeEventListener('offline', updateConnection) })
</script>
<template>
  <div class="app-shell">
    <AppHeader />
    <div v-if="!online" class="connection-note" role="status">오프라인 · 이 기기에 저장된 차 일기를 사용할 수 있어요.</div>
    <div v-if="needRefresh" class="update-note"><span>새 버전이 준비됐어요. 작성 중이면 저장 후 업데이트하세요.</span><button type="button" @click="updateServiceWorker()">업데이트</button><button type="button" aria-label="업데이트 알림 닫기" @click="needRefresh = false">닫기</button></div>
    <div v-if="app.message" class="notice" :class="app.tone" :role="app.tone === 'error' ? 'alert' : 'status'"><span>{{ app.message }}</span><button type="button" aria-label="알림 닫기" @click="app.message = ''">×</button></div>
    <main id="main-content"><RouterView v-if="ready" v-slot="{ Component, route }"><component :is="Component" :key="route.fullPath" /></RouterView><div v-else class="empty-state"><template v-if="error"><p role="alert">{{ error }}</p><button class="button primary" @click="initialize">다시 시도</button></template><p v-else role="status">차 일기장을 펼치고 있어요…</p></div></main>
    <BottomNavigation />
  </div>
</template>
