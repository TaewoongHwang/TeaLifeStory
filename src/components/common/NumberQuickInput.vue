<script setup>
import { computed } from 'vue'
import FormField from './FormField.vue'
import AppIcon from './AppIcon.vue'
const value = defineModel({ default: null })
const props = defineProps({
  label: { type: String, required: true },
  config: { type: Object, required: true },
  hint: { type: String, default: '' },
})
const number = computed(() => typeof value.value === 'number' && Number.isFinite(value.value) ? value.value : null)
function adjust(direction) {
  value.value = Math.min(props.config.max, Math.max(props.config.min, (number.value ?? 0) + direction * props.config.increment))
}
function presetLabel(preset) { return props.config.unit === '초' && preset >= 60 && preset % 60 === 0 ? `${preset / 60}분` : `${preset}${props.config.unit}` }
</script>
<template>
  <FormField v-slot="{ id }" :label="label" :hint="hint" class="quick-number-field">
    <div class="number-presets" role="group" :aria-label="`${label} 빠른 값`">
      <button v-for="preset in config.presets" :key="preset" type="button" :aria-label="presetLabel(preset)" :aria-pressed="number === preset" @click="value = preset"><span v-if="number === preset" aria-hidden="true">✓</span>{{ presetLabel(preset) }}</button>
    </div>
    <div class="quick-number-row">
      <div class="stepper quick-stepper">
        <button type="button" :aria-label="`${label} ${config.increment}${config.unit} 줄이기`" :disabled="number === null || number <= config.min" @click="adjust(-1)">−{{ config.increment }}</button>
        <input :id="id" v-model.number="value" type="number" :min="config.min" :max="config.max" :step="config.inputStep" :inputmode="config.inputmode" placeholder="미입력" />
        <span>{{ config.unit }}</span>
        <button type="button" :aria-label="`${label} ${config.increment}${config.unit} 늘리기`" :disabled="number !== null && number >= config.max" @click="adjust(1)">+{{ config.increment }}</button>
      </div>
      <button type="button" class="number-clear" :aria-label="`${label} 지우기`" @click="value = null"><AppIcon name="close" /></button>
    </div>
  </FormField>
</template>
