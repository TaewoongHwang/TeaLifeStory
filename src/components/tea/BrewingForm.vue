<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import ChoiceButtons from '../common/ChoiceButtons.vue'
import NumberQuickInput from '../common/NumberQuickInput.vue'
import { choiceShortcuts, numericInputs } from '../../config/entryInputs.js'
const brewing = defineModel({ type: Object, required: true })
const settings = useSettingsStore()
const tools = computed(() => [...new Set([...settings.tools.map((item) => item.name), brewing.value.tool].filter(Boolean))])
const materials = computed(() => [...new Set([...settings.materials.map((item) => item.name), brewing.value.material].filter(Boolean))])
</script>
<template>
  <section class="form-section"><div class="section-label"><span>02</span><h2>우림 <small>BREWING</small></h2></div>
    <ChoiceButtons v-model="brewing.tool" label="도구" :options="tools" :shortcuts="choiceShortcuts.tools" />
    <ChoiceButtons v-model="brewing.material" label="재질" :options="materials" />
    <div class="quick-input-grid">
      <NumberQuickInput v-model="brewing.volume" label="물 용량" :config="numericInputs.volume" />
      <NumberQuickInput v-model="brewing.waterTemperature" label="물 온도" hint="선택 사항 · 0~100°C" :config="numericInputs.waterTemperature" />
      <NumberQuickInput v-model="brewing.steepTime" label="우림 시간" hint="선택 사항 · 초 단위" :config="numericInputs.steepTime" />
    </div>
  </section>
</template>
