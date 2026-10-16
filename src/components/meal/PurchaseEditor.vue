<script setup>
import { ref } from 'vue'
import FormField from '../common/FormField.vue'
import { createPurchase } from '../../utils/meal.js'
import { clone } from '../../utils/entry.js'
import { usePurchaseStore } from '../../stores/purchaseStore.js'
const props = defineProps({ value: { type: Object, default: null }, name: { type: String, default: '' } })
const emit = defineEmits(['saved', 'cancel', 'busy'])
const store = usePurchaseStore()
const purchase = ref(props.value ? clone(props.value) : { ...createPurchase(), name: props.name })
const saving = ref(false)
const error = ref('')
async function save() {
  if (saving.value) return
  if (!purchase.value.name.trim()) { error.value = '재료 이름을 한 글자 이상 적어 주세요.'; return }
  saving.value = true; emit('busy', true); error.value = ''
  try { const saved = await store.save(purchase.value); emit('saved', saved) }
  catch { error.value = '구매 정보를 저장하지 못했습니다. 작성 내용은 유지됩니다.' }
  finally { saving.value = false; emit('busy', false) }
}
</script>
<template><form @submit.prevent="save"><fieldset :disabled="saving" class="plain-fieldset"><FormField v-slot="{ id }" label="재료 이름 *"><input :id="id" v-model="purchase.name" required maxlength="100" placeholder="예: 두부" /></FormField><FormField v-slot="{ id }" label="제품·브랜드"><input :id="id" v-model="purchase.product" maxlength="200" placeholder="예: 부침용 두부 300g" /></FormField><FormField v-slot="{ id }" label="구매처"><input :id="id" v-model="purchase.shop" maxlength="200" placeholder="예: 동네 마트, 시장, 온라인 상점" /></FormField><FormField v-slot="{ id }" label="구매일"><input :id="id" v-model="purchase.date" type="date" /></FormField><FormField v-slot="{ id }" label="구매 메모"><textarea :id="id" v-model="purchase.notes" maxlength="10000" rows="3" placeholder="맛, 식감, 구입할 때 기억할 내용" /></FormField><label class="checkbox-field"><input v-model="purchase.favorite" type="checkbox" /><span>다시 사고 싶은 재료</span></label><p v-if="error" role="alert" class="inline-error">{{ error }}</p><div class="modal-actions"><button type="button" class="button secondary" @click="emit('cancel')">취소</button><button type="submit" class="button primary">{{ saving ? '저장 중…' : '구매 정보 저장' }}</button></div></fieldset></form></template>
