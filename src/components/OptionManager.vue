<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.js'
import { optionLabels } from '../config/defaults.js'
import AppIcon from './common/AppIcon.vue'
const props = defineProps({ storeName: { type: String, required: true } })
const settings = useSettingsStore()
const name = ref('')
const editId = ref(null)
const busy = ref(false)
const error = ref('')
function edit(item) { editId.value = item.id; name.value = item.name; error.value = '' }
function cancel() { editId.value = null; name.value = ''; error.value = '' }
async function save() {
  busy.value = true
  error.value = ''
  try { await settings.saveOption(props.storeName, name.value, editId.value || undefined); cancel() }
  catch (issue) { error.value = issue.message }
  finally { busy.value = false }
}
async function remove(item) {
  if (!window.confirm(`“${item.name}”을 선택 목록에서 삭제할까요? 기존 차 기록의 내용은 유지됩니다.`)) return
  busy.value = true
  error.value = ''
  try { await settings.deleteOption(props.storeName, item.id); if (editId.value === item.id) cancel() }
  catch { error.value = '삭제하지 못했습니다. 다시 시도해 주세요.' }
  finally { busy.value = false }
}
</script>
<template>
  <details class="option-manager"><summary>{{ optionLabels[storeName] }} <span>{{ settings[storeName].length }}개</span></summary><ul class="option-list"><li v-for="item in settings[storeName]" :key="item.id"><span>{{ item.name }}</span><div><button type="button" :disabled="busy" :aria-label="`${item.name} 이름 수정`" @click="edit(item)"><AppIcon name="edit" /></button><button type="button" :disabled="busy" :aria-label="`${item.name} 선택 목록에서 삭제`" @click="remove(item)"><AppIcon name="close" /></button></div></li></ul><form class="option-form" @submit.prevent="save"><label class="sr-only" :for="`option-${storeName}`">{{ optionLabels[storeName] }} {{ editId ? '수정할' : '추가할' }} 이름</label><input :id="`option-${storeName}`" v-model="name" required maxlength="100" :placeholder="`${optionLabels[storeName]} 이름`" :disabled="busy" /><button class="button secondary" :disabled="busy">{{ editId ? '수정' : '추가' }}</button><button v-if="editId" type="button" class="button text-button" @click="cancel">취소</button></form><p v-if="error" class="inline-error" role="alert">{{ error }}</p></details>
</template>
