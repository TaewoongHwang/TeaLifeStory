<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useEntryStore } from '../stores/entryStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { useAppStore } from '../stores/appStore.js'
import { clone, createEntry, normalizeEntry } from '../utils/entry.js'
import TeaBasicForm from '../components/tea/TeaBasicForm.vue'
import BrewingForm from '../components/tea/BrewingForm.vue'
import TeaContextForm from '../components/tea/TeaContextForm.vue'
import TeaExperienceForm from '../components/tea/TeaExperienceForm.vue'
import TeaExtrasForm from '../components/tea/TeaExtrasForm.vue'
import BaseModal from '../components/common/BaseModal.vue'
import AppIcon from '../components/common/AppIcon.vue'
import EmptyState from '../components/common/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const store = useEntryStore()
const settings = useSettingsStore()
const app = useAppStore()
const editing = Boolean(route.params.id)
const existing = editing ? store.entries.find((item) => item.id === route.params.id) : null
const entry = ref(existing ? clone(existing) : createEntry())
const initial = JSON.stringify(entry.value)
const pendingDraft = ref(null)
const ready = ref(editing)
const saving = ref(false)
const processing = ref(false)
const draftStatus = ref('')
const error = ref('')
let timer
let saved = false
let dirty = false

async function flushDraft() {
  clearTimeout(timer)
  if (editing || !ready.value || !dirty || saved) return
  try { await settings.saveDraft(entry.value); draftStatus.value = '초안 저장됨' }
  catch { draftStatus.value = '초안 저장 실패'; app.notify('초안을 저장하지 못했습니다. 저장 공간을 확인하고 JSON으로 백업해 주세요.', 'error') }
}
watch(entry, () => {
  if (!ready.value || saving.value) return
  dirty = true
  if (!editing) {
    draftStatus.value = '초안 저장 중…'
    clearTimeout(timer)
    timer = setTimeout(flushDraft, 250)
  }
}, { deep: true, flush: 'sync' })

async function chooseDraft(resume) {
  try {
    if (resume) entry.value = clone(pendingDraft.value)
    else await settings.clearDraft()
    pendingDraft.value = null
    ready.value = true
    draftStatus.value = resume ? '작성 중이던 초안을 불러왔어요' : ''
    dirty = resume
  } catch { error.value = '초안을 처리하지 못했습니다. 다시 시도해 주세요.' }
}

async function save() {
  if (saving.value || processing.value) return
  saving.value = true
  error.value = ''
  clearTimeout(timer)
  const snapshot = normalizeEntry(entry.value)
  try {
    const id = await store.save(snapshot)
    saved = true
    if (!editing) {
      try { await settings.clearDraft() }
      catch { app.notify('기록은 저장됐지만 초안을 지우지 못했습니다.', 'error'); await router.push(`/entries/${id}`); return }
    }
    app.notify(editing ? '차 이야기를 수정했어요.' : '오늘의 차 이야기를 담았어요.')
    await router.push(`/entries/${id}`)
  } catch { error.value = '저장하지 못했습니다. 입력값과 기기의 저장 공간을 확인해 주세요. 작성 내용은 유지됩니다.' }
  finally { saving.value = false }
}
function hide() { if (document.visibilityState === 'hidden') void flushDraft() }
function beforeUnload(event) { if (editing && !saved && JSON.stringify(entry.value) !== initial) { event.preventDefault(); event.returnValue = '' } }
onMounted(async () => {
  if (!editing) {
    try { pendingDraft.value = await settings.getDraft(); ready.value = !pendingDraft.value }
    catch { error.value = '초안을 확인하지 못했습니다. 다시 열어 주세요.' }
  }
  document.addEventListener('visibilitychange', hide)
  window.addEventListener('beforeunload', beforeUnload)
  window.addEventListener('pagehide', flushDraft)
})
onBeforeRouteLeave(async () => {
  if (processing.value || saving.value && !saved) return false
  if (editing && !saved && JSON.stringify(entry.value) !== initial) return window.confirm('수정한 내용을 저장하지 않고 나갈까요?')
  await flushDraft()
})
onUnmounted(() => { clearTimeout(timer); document.removeEventListener('visibilitychange', hide); window.removeEventListener('beforeunload', beforeUnload); window.removeEventListener('pagehide', flushDraft) })
</script>
<template>
  <div class="entry-form-view"><RouterLink :to="editing ? `/entries/${route.params.id}` : '/'" class="back-link"><AppIcon name="back" />{{ editing ? '기록으로' : '일기장으로' }}</RouterLink><div class="page-eyebrow">A MOMENT TO REMEMBER / 茶</div><div class="page-title"><h1>{{ editing ? '차 이야기를 다시 펼쳐요' : '오늘의 한 잔을 남겨요' }}</h1><p>차 이름만 적어도 좋아요.<br />향과 마음, 그날의 순간은 천천히.</p></div>
    <EmptyState v-if="editing && !existing" title="기록을 찾을 수 없어요" description="삭제되었거나 이 기기에 없는 기록입니다." :action="false" />
    <form v-else-if="ready" @submit.prevent="save"><div class="form-status"><span>* 필수 입력</span><span role="status">{{ draftStatus }}</span></div><fieldset :disabled="saving" class="form-fields"><TeaBasicForm v-model="entry.tea" /><BrewingForm v-model="entry.brewing" /><TeaContextForm v-model="entry.context" /><TeaExperienceForm v-model="entry.experience" /><TeaExtrasForm v-model="entry" @busy="processing = $event" /></fieldset><p v-if="error" class="inline-error" role="alert">{{ error }}</p><div class="save-bar"><button type="submit" class="button primary" :disabled="saving || processing"><AppIcon name="book" />{{ saving ? '저장 중…' : editing ? '수정 저장' : '기록 저장' }}</button></div></form>
    <p v-else-if="!pendingDraft" role="status">{{ error || '초안을 확인하고 있어요…' }}</p>
    <BaseModal v-if="pendingDraft" title="작성 중이던 기록이 있습니다." @close="router.push('/')"><p>지난번에 남기던 차 이야기를 이어갈까요?</p><p class="draft-name">{{ pendingDraft.tea.name || '이름을 아직 적지 않은 차' }}</p><p v-if="error" class="inline-error" role="alert">{{ error }}</p><div class="modal-actions"><button class="button secondary" @click="chooseDraft(false)">새로 작성</button><button class="button primary" @click="chooseDraft(true)">이어쓰기</button></div><p class="muted small">새로 작성하면 기존 초안이 삭제됩니다.</p></BaseModal>
  </div>
</template>
