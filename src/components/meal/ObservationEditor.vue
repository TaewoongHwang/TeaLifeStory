<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { localDate } from '../../utils/entry.js'
import { bodyFeelings } from '../../config/meals.js'
import { validateObservation } from '../../db/mealValidation.js'
import { useEntryStore } from '../../stores/entryStore.js'
import FormField from '../common/FormField.vue'
const props = defineProps({ entry: { type: Object, required: true }, value: { type: Object, default: null } })
const emit = defineEmits(['saved', 'cancel', 'busy', 'dirty'])
const store = useEntryStore()
const now = new Date()
const observation = ref(props.value ? JSON.parse(JSON.stringify(props.value)) : { id: crypto.randomUUID(), date: localDate(now), time: now.toTimeString().slice(0, 5), feelings: [], notes: '' })
const saving = ref(false)
const error = ref('')
let dirty = false
watch(observation, () => { dirty = true; emit('dirty', true) }, { deep: true, flush: 'sync' })
function beforeUnload(event) { if (dirty) { event.preventDefault(); event.returnValue = '' } }
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
function toggle(feeling) {
  const selected = observation.value.feelings
  observation.value.feelings = selected.includes(feeling) ? selected.filter(name => name !== feeling) : feeling === '편안함' ? [feeling] : [...selected.filter(name => name !== '편안함'), feeling]
}
async function save() {
  error.value = ''
  if (!observation.value.feelings.length) { error.value = '지금의 속 느낌을 하나 이상 선택해 주세요.'; return }
  saving.value = true; emit('busy', true)
  try {
    const value = validateObservation(observation.value, props.entry)
    await store.saveObservation(props.entry.id, value)
    dirty = false; emit('dirty', false); emit('saved')
  } catch (issue) { error.value = issue.message.includes('식후 느낌의 시각') ? issue.message : '느낌을 저장하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.' }
  finally { saving.value = false; emit('busy', false) }
}
</script>
<template>
  <form @submit.prevent="save"><p class="muted">느낌을 확인한 실제 시각으로 남겨요. 나중에 달라졌다면 새 느낌을 추가할 수 있어요.</p><fieldset class="form-fields" :disabled="saving"><div class="field-grid"><FormField v-slot="{ id }" label="느낌을 확인한 날짜"><input :id="id" v-model="observation.date" type="date" required /></FormField><FormField v-slot="{ id }" label="느낌을 확인한 시간"><input :id="id" v-model="observation.time" type="time" required /></FormField></div>
    <fieldset class="choice-field"><legend>지금의 속 느낌</legend><div class="choice-grid"><button v-for="feeling in bodyFeelings" :key="feeling" type="button" class="choice-button" :aria-pressed="observation.feelings.includes(feeling)" @click="toggle(feeling)">{{ observation.feelings.includes(feeling) ? '✓ ' : '' }}{{ feeling }}</button></div></fieldset>
    <FormField v-slot="{ id }" label="느낌 메모"><textarea :id="id" v-model="observation.notes" rows="3" maxlength="10000" placeholder="예: 두 시간 뒤에도 속이 가볍고 편했다" /></FormField>
    <p v-if="error" class="inline-error" role="alert">{{ error }}</p><div class="modal-actions"><button type="button" class="button secondary" @click="emit('cancel')">취소</button><button class="button primary">{{ saving ? '저장 중…' : '식후 느낌 저장' }}</button></div></fieldset></form>
</template>
