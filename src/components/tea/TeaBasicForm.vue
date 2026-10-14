<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import FormField from '../common/FormField.vue'
import ChoiceButtons from '../common/ChoiceButtons.vue'
import NumberQuickInput from '../common/NumberQuickInput.vue'
import { choiceShortcuts, numericInputs } from '../../config/entryInputs.js'
import { defaults } from '../../config/defaults.js'
const tea = defineModel({ type: Object, required: true })
const settings = useSettingsStore()
const nameInput = ref(null)
function validateName() { nameInput.value?.setCustomValidity(tea.value.name.trim() ? '' : '차 이름을 한 글자 이상 적어 주세요.') }
onMounted(validateName)
watch(() => tea.value.name, validateName, { flush: 'post' })
const categories = computed(() => [...new Set([...defaults.categories, ...settings.categories.map((item) => item.name).filter((name) => name !== '보이차'), tea.value.category].filter(Boolean))])
</script>
<template>
  <section class="form-section"><div class="section-label"><span>01</span><h2>차 <small>茶 / TEA</small></h2></div>
    <p class="section-prompt">오늘 곁에 둔 차의 이름부터 적어 볼까요?</p>
    <FormField v-slot="{ id }" label="차 이름 *"><input :id="id" ref="nameInput" v-model="tea.name" placeholder="어떤 차를 마셨나요?" required maxlength="200" autocomplete="off" /></FormField>
    <ChoiceButtons v-model="tea.category" label="차 종류" :options="categories" :shortcuts="choiceShortcuts.categories" :labels="{ '블렌딩차': '블렌딩티', '보이차': '보이차 (이전 기록)' }" primary-only />
    <p v-if="tea.category === '보이차'" class="muted small">이전 기록의 보이차 분류를 유지하고 있어요. 흑차를 누르면 이 기록의 분류를 바꿀 수 있어요.</p>
    <NumberQuickInput v-model="tea.amount" label="차 사용량" :config="numericInputs.amount" />
  </section>
</template>
