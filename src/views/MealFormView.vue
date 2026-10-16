<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useEntryStore } from '../stores/entryStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { useAppStore } from '../stores/appStore.js'
import { clone, createMeal, localDate } from '../utils/entry.js'
import { isMeal } from '../utils/record.js'
import { mealSources, mealTimes, portions, spiceLevels, beforeStates, mealDrinks } from '../config/meals.js'
import RecordKindSwitch from '../components/common/RecordKindSwitch.vue'
import FormField from '../components/common/FormField.vue'
import ChoiceButtons from '../components/common/ChoiceButtons.vue'
import BaseModal from '../components/common/BaseModal.vue'
import EmptyState from '../components/common/EmptyState.vue'
import AppIcon from '../components/common/AppIcon.vue'
import TeaExtrasForm from '../components/tea/TeaExtrasForm.vue'
import TeaRating from '../components/tea/TeaRating.vue'
import MealIngredients from '../components/meal/MealIngredients.vue'

const route = useRoute()
const router = useRouter()
const store = useEntryStore()
const settings = useSettingsStore()
const app = useAppStore()
const editing = Boolean(route.params.id)
const existing = editing ? store.entries.find((item) => item.id === route.params.id && isMeal(item)) : null
const entry = ref(existing ? clone(existing) : createMeal())
const initial = JSON.stringify(entry.value)
const pendingDraft = ref(null)
const ready = ref(editing)
const saving = ref(false)
const processing = ref(false)
const error = ref('')
const draftStatus = ref('')
const expanded = ref(settings.entryDetailsExpanded || editing)
const form = ref(null)
const details = ref(null)
const nameInput = ref(null)
const remembering = ref(false)
const preferenceError = ref('')
const extraCount = computed(() => [entry.value.meal.occasion, entry.value.meal.venue, entry.value.meal.portion, entry.value.meal.spice, entry.value.meal.before, entry.value.meal.drink, entry.value.meal.ingredients.length, entry.value.experience.rating, entry.value.experience.notes, entry.value.photos.length, entry.value.tags.length, entry.value.favorite].filter(Boolean).length)
let timer
let dirty = false
let saved = false
let preferenceSave = Promise.resolve()
function checkName() { nameInput.value?.setCustomValidity(entry.value.meal.name.trim() ? '' : '한 끼 이름을 한 글자 이상 적어 주세요.') }
watch(() => entry.value.meal.name, checkName, { flush: 'post' })
watch(ready, () => nextTick(checkName))
async function flushDraft() {
  clearTimeout(timer)
  if (editing || !ready.value || !dirty || saved) return
  try { await settings.saveDraft(entry.value); draftStatus.value = '초안 저장됨' }
  catch { draftStatus.value = '초안 저장 실패'; app.notify('밥 기록 초안을 저장하지 못했습니다. 작성 내용은 유지됩니다.', 'error') }
}
watch(entry, () => {
  if (!ready.value || saving.value) return
  dirty = true
  if (!editing) { draftStatus.value = '초안 저장 중…'; clearTimeout(timer); timer = setTimeout(flushDraft, 250) }
}, { deep: true, flush: 'sync' })
async function chooseDraft(resume) {
  try {
    if (resume) {
      const draft = clone(pendingDraft.value)
      if (store.entries.some((item) => item.id === draft.id)) { draft.createdAt = new Date().toISOString(); draft.updatedAt = draft.createdAt; app.notify('저장된 기록이 있어 초안은 새 밥 기록으로 이어갑니다.') }
      draft.id = entry.value.id
      entry.value = draft
    } else await settings.clearDraft('meal')
    pendingDraft.value = null; ready.value = true; dirty = resume
    draftStatus.value = resume ? '작성 중이던 밥 기록을 불러왔어요' : ''
  } catch { error.value = '밥 초안을 처리하지 못했습니다. 다시 시도해 주세요.' }
}
async function toggleDetails() {
  expanded.value = !expanded.value; remembering.value = true; preferenceError.value = ''
  preferenceSave = settings.saveEntryDetailsExpanded(expanded.value)
  try { await preferenceSave } catch { preferenceError.value = '펼침 상태를 기억하지 못했습니다. 작성 내용은 유지됩니다.' }
  finally { remembering.value = false }
}
async function editDate() { expanded.value = true; await nextTick(); const input = details.value.querySelector('input[type=date]'); input.focus(); input.scrollIntoView({ block: 'center' }) }
async function save() {
  if (saving.value || processing.value) return
  checkName()
  const invalid = [...form.value.elements].find((field) => field.willValidate && !field.validity.valid)
  if (invalid) { if (details.value.contains(invalid)) expanded.value = true; await nextTick(); invalid.focus(); invalid.reportValidity(); return }
  saving.value = true; error.value = ''; clearTimeout(timer)
  try {
    const id = await store.save(entry.value)
    saved = true
    if (!editing) { try { await settings.clearDraft('meal') } catch { app.notify('밥 기록은 저장됐지만 초안을 지우지 못했습니다.', 'error') } }
    app.notify(editing ? '한 끼의 이야기를 수정했어요.' : '한 끼를 남겼어요. 식후 느낌은 나중에 덧붙여요.')
    await router.push(`/meals/${id}`)
  } catch (issue) { error.value = issue.message.includes('식후 느낌') ? issue.message : '저장하지 못했습니다. 작성 내용과 기존 기록은 유지됩니다.' }
  finally { saving.value = false }
}
function hide() { if (document.visibilityState === 'hidden') void flushDraft() }
function beforeUnload(event) { if (editing && !saved && JSON.stringify(entry.value) !== initial) { event.preventDefault(); event.returnValue = '' } }
onMounted(async () => {
  if (!editing) { try { pendingDraft.value = await settings.getDraft('meal'); ready.value = !pendingDraft.value } catch { error.value = '밥 초안을 확인하지 못했습니다. 다시 열어 주세요.' } }
  await nextTick(); checkName()
  document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', flushDraft); window.addEventListener('beforeunload', beforeUnload)
})
onBeforeRouteLeave(async () => {
  if (processing.value || saving.value && !saved) return false
  if (editing && !saved && JSON.stringify(entry.value) !== initial && !window.confirm('수정한 밥 기록을 저장하지 않고 나갈까요?')) return false
  await flushDraft(); await preferenceSave.catch(() => {})
})
onUnmounted(() => { clearTimeout(timer); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', flushDraft); window.removeEventListener('beforeunload', beforeUnload) })
</script>
<template><div class="entry-form-view meal-form-view"><RouterLink :to="editing ? `/meals/${route.params.id}` : '/'" class="back-link"><AppIcon name="back" />{{ editing ? '기록으로' : '일기장으로' }}</RouterLink><div class="page-title"><h1>{{ editing ? '한 끼를 다시 펼쳐요' : '오늘의 한 끼를 남겨요' }}</h1><p>먹은 것을 먼저 남기고, 식후 느낌은 나중에.</p></div><RecordKindSwitch v-if="!editing" kind="meal" /><EmptyState v-if="editing && !existing" title="밥 기록을 찾을 수 없어요" :action="false" /><form v-else-if="ready" ref="form" novalidate @submit.prevent="save"><div class="form-status"><span>* 필수 입력</span><span role="status">{{ draftStatus }}</span></div><fieldset class="form-fields" :disabled="saving"><section class="form-section"><div class="section-label"><span>01</span><h2>한 끼 <small>穀 / MEAL</small></h2></div><FormField v-slot="{ id }" label="한 끼 이름 *"><input :id="id" ref="nameInput" v-model="entry.meal.name" required maxlength="200" placeholder="예: 두부조림과 밥, 고등어구이 정식" /></FormField><ChoiceButtons v-model="entry.meal.source" label="식사 구분" :options="mealSources" /><FormField v-slot="{ id }" label="한 줄 감상"><textarea :id="id" v-model="entry.experience.feeling" rows="2" maxlength="10000" placeholder="맛과 그날의 이야기를 남겨요" /></FormField></section><div class="entry-detail-control"><button type="button" class="button secondary entry-details-toggle" :aria-expanded="expanded" aria-controls="meal-details" :disabled="remembering || processing" @click="toggleDetails"><AppIcon :name="expanded ? 'close' : 'plus'" />{{ expanded ? '세부 항목 접기' : '자세히 남기기' }}</button><p v-if="!expanded && extraCount" class="muted small">세부 항목 {{ extraCount }}개도 함께 저장돼요.</p><p v-if="preferenceError" class="inline-error" role="alert">{{ preferenceError }}</p></div><div id="meal-details" ref="details" v-show="expanded" role="region" aria-label="세부 기록"><section class="form-section"><h2>어떻게 먹었나요?</h2><ChoiceButtons v-model="entry.meal.occasion" label="끼니" :options="mealTimes" /><FormField v-slot="{ id }" label="음식점·지점"><input :id="id" v-model="entry.meal.venue" maxlength="200" placeholder="외식·배달 때 가게와 지점을 남겨요" /></FormField><ChoiceButtons v-model="entry.meal.portion" label="먹은 양" :options="portions" /><ChoiceButtons v-model="entry.meal.spice" label="매운 정도" :options="spiceLevels" /><ChoiceButtons v-model="entry.meal.before" label="식전 속 상태" :options="beforeStates" /><ChoiceButtons v-model="entry.meal.drink" label="함께 마신 것" :options="mealDrinks" /><div class="field"><span class="field-label">맛 평점 · 선택</span><TeaRating v-model="entry.experience.rating" label="맛 평점" /></div><div class="field-grid"><FormField v-slot="{ id }" label="식사 날짜"><input :id="id" v-model="entry.context.date" type="date" /></FormField><FormField v-slot="{ id }" label="식사 시간"><input :id="id" v-model="entry.context.time" type="time" /></FormField><FormField v-slot="{ id }" label="먹은 장소"><input :id="id" v-model="entry.context.location" maxlength="10000" /></FormField><FormField v-slot="{ id }" label="함께 먹은 사람"><input :id="id" v-model="entry.context.people" maxlength="10000" /></FormField></div></section><MealIngredients v-model="entry.meal.ingredients" /><TeaExtrasForm v-model="entry" meal @busy="processing = $event" /></div><div class="entry-date-summary"><span>먹은 날짜 · {{ entry.context.date === localDate() ? '오늘' : entry.context.date || '날짜 미입력' }} {{ entry.context.time }}</span><button type="button" class="button text-button" @click="editDate">날짜·시간 수정</button></div></fieldset><p v-if="error" role="alert" class="inline-error">{{ error }}</p><div class="save-bar"><button type="submit" class="button primary" :disabled="saving || processing"><AppIcon name="book" />{{ saving ? '저장 중…' : editing ? '밥 기록 수정 저장' : '밥 기록 저장' }}</button></div></form><p v-else-if="!pendingDraft" role="status">{{ error || '밥 초안을 확인하고 있어요…' }}</p><BaseModal v-if="pendingDraft" title="쓰다 남긴 밥 기록이 있어요" @close="router.push('/')"><p class="draft-name">{{ pendingDraft.meal.name || '이름을 아직 적지 않은 한 끼' }}</p><p>차 초안과 밥 초안은 각각 보관됩니다.</p><p v-if="error" role="alert" class="inline-error">{{ error }}</p><div class="modal-actions"><button type="button" class="button secondary" @click="chooseDraft(false)">새로 작성</button><button type="button" class="button primary" @click="chooseDraft(true)">이어쓰기</button></div><p class="muted small">새로 작성하면 이전 밥 초안이 삭제됩니다.</p></BaseModal></div></template>
