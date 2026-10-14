<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import BaseModal from '../common/BaseModal.vue'
import FormField from '../common/FormField.vue'
const emit = defineEmits(['close', 'registered'])
const settings = useSettingsStore()
const name = ref('')
const busy = ref(false)
const error = ref('')
async function register() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const savedName = name.value.trim()
    await settings.saveOption('tools', savedName)
    emit('registered', savedName)
  } catch (issue) {
    error.value = issue instanceof DOMException
      ? '차구를 등록하지 못했습니다. 저장 공간을 확인해 주세요. 입력 내용은 유지됩니다.'
      : issue.message || '차구를 등록하지 못했습니다. 입력 내용은 유지됩니다.'
  }
  finally { busy.value = false }
}
function close() { if (!busy.value) emit('close') }
</script>
<template>
  <Teleport to="body">
    <BaseModal title="내 차구 등록" @close="close">
      <p class="muted">같은 자사호라도 구분할 수 있도록 이름을 붙여 주세요.</p>
      <form @submit.prevent.stop="register">
        <FormField v-slot="{ id }" label="차구 이름 *"><input :id="id" v-model="name" required maxlength="100" autofocus :disabled="busy" placeholder="예: 주니 자사호 120cc, 백자 개완" /></FormField>
        <p class="small muted">등록하면 이번 기록에 선택되고, 다음 기록에서도 사용할 수 있어요. 설정의 내 차구에서 수정·삭제할 수 있어요.</p>
        <p v-if="error" role="alert" class="inline-error">{{ error }}</p>
        <div class="modal-actions"><button type="button" class="button secondary" :disabled="busy" @click="close">취소</button><button type="submit" class="button primary" :disabled="busy">{{ busy ? '등록 중…' : '등록하고 선택' }}</button></div>
      </form>
    </BaseModal>
  </Teleport>
</template>
