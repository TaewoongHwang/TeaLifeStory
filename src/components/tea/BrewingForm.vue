<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore.js'
import FormField from '../common/FormField.vue'
const brewing = defineModel({ type: Object, required: true })
const settings = useSettingsStore()
const tools = computed(() => [...new Set([...settings.tools.map((item) => item.name), brewing.value.tool].filter(Boolean))])
const materials = computed(() => [...new Set([...settings.materials.map((item) => item.name), brewing.value.material].filter(Boolean))])
</script>
<template>
  <section class="form-section"><div class="section-label"><span>02</span><h2>우림 <small>BREWING</small></h2></div>
    <div class="field-grid"><FormField v-slot="{ id }" label="도구"><select :id="id" v-model="brewing.tool"><option value="">선택하지 않음</option><option v-for="name in tools" :key="name">{{ name }}</option></select></FormField><FormField v-slot="{ id }" label="재질"><select :id="id" v-model="brewing.material"><option value="">선택하지 않음</option><option v-for="name in materials" :key="name">{{ name }}</option></select></FormField></div>
    <FormField v-slot="{ id }" label="물 용량"><div class="input-unit"><input :id="id" v-model.number="brewing.volume" type="number" min="0" max="100000" step="1" inputmode="numeric" placeholder="예: 150" /><span>cc</span></div></FormField>
  </section>
</template>
