<script setup>
import { computed, ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import ChoiceButtons from '../common/ChoiceButtons.vue'
import NumberQuickInput from '../common/NumberQuickInput.vue'
import { choiceShortcuts, numericInputs } from '../../config/entryInputs.js'
import { defaults, displayToolName } from '../../config/defaults.js'
import TeawareRegister from './TeawareRegister.vue'
import AppIcon from '../common/AppIcon.vue'
const brewing = defineModel({ type: Object, required: true })
const amount = defineModel('amount', { default: null })
const settings = useSettingsStore()
const registering = ref(false)
const tools = computed(() => [...new Set([...settings.tools.map((item) => item.name), brewing.value.tool].filter(Boolean))])
const toolLabels = computed(() => ({ 다관: displayToolName('다관', tools.value) }))
const toolShortcuts = computed(() => [...settings.tools.map((item) => item.name).filter((name) => !defaults.tools.includes(name)), ...choiceShortcuts.tools])
const materials = computed(() => [...new Set([...settings.materials.map((item) => item.name), brewing.value.material].filter(Boolean))])
function registered(name) { brewing.value.tool = name; registering.value = false }
</script>
<template>
  <section class="form-section"><div class="section-label"><span>02</span><h2>우림 <small>HOW / BREWING</small></h2></div>
    <ChoiceButtons v-model="brewing.tool" label="사용한 차구" :options="tools" :shortcuts="toolShortcuts" :labels="toolLabels" />
    <div class="teaware-actions"><button type="button" class="button secondary" @click="registering = true"><AppIcon name="plus" />내 차구 등록</button><small class="muted">나만의 차구 이름을 등록해 두고 골라 보세요.</small></div>
    <ChoiceButtons v-model="brewing.material" label="재질" :options="materials" />
    <div class="quick-input-grid">
      <NumberQuickInput v-model="amount" label="차 사용량" :config="numericInputs.amount" />
      <NumberQuickInput v-model="brewing.volume" label="물 용량" :config="numericInputs.volume" />
      <NumberQuickInput v-model="brewing.waterTemperature" label="물 온도" hint="선택 사항 · 0~100°C" :config="numericInputs.waterTemperature" />
      <NumberQuickInput v-model="brewing.steepTime" label="우림 시간" hint="선택 사항 · 초 단위" :config="numericInputs.steepTime" />
    </div>
  </section>
  <TeawareRegister v-if="registering" @close="registering = false" @registered="registered" />
</template>
