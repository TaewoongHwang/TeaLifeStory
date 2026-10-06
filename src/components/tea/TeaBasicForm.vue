<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import FormField from '../common/FormField.vue'
const tea = defineModel({ type: Object, required: true })
const settings = useSettingsStore()
const categories = computed(() => [...new Set([...settings.categories.map((item) => item.name), tea.value.category].filter(Boolean))])
function step(delta) { tea.value.amount = Math.max(0, Math.min(100000, Math.round(((Number(tea.value.amount) || 0) + delta) * 10) / 10)) }
</script>
<template>
  <section class="form-section"><div class="section-label"><span>01</span><h2>차 <small>茶 / TEA</small></h2></div>
    <p class="section-prompt">오늘 곁에 둔 차의 이름부터 적어 볼까요?</p>
    <FormField v-slot="{ id }" label="차 이름 *"><input :id="id" v-model="tea.name" placeholder="어떤 차를 마셨나요?" required maxlength="200" autocomplete="off" /></FormField>
    <div class="field-grid"><FormField v-slot="{ id }" label="차 종류"><select :id="id" v-model="tea.category"><option value="">선택하지 않음</option><option v-for="name in categories" :key="name">{{ name }}</option></select></FormField>
    <FormField v-slot="{ id }" label="차 사용량"><div class="stepper"><button type="button" aria-label="차 사용량 1g 줄이기" @click="step(-1)">−</button><input :id="id" v-model.number="tea.amount" type="number" min="0" max="100000" step="0.1" inputmode="decimal" placeholder="0" /><span>g</span><button type="button" aria-label="차 사용량 1g 늘리기" @click="step(1)">+</button></div></FormField></div>
  </section>
</template>
