<script setup>
import { computed, ref, watch } from 'vue'
const value = defineModel({ type: String, required: true })
const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  shortcuts: { type: Array, default: () => [] },
})
const expanded = ref(false)
const ordered = computed(() => [...new Set([...props.shortcuts.filter((name) => props.options.includes(name)), ...props.options])])
const primary = computed(() => ordered.value.slice(0, 6))
const extra = computed(() => ordered.value.slice(6))
watch([value, extra], () => { if (extra.value.includes(value.value)) expanded.value = true }, { immediate: true })
function choose(name) { value.value = value.value === name ? '' : name }
</script>
<template>
  <fieldset class="field choice-field">
    <legend>{{ label }}</legend>
    <div class="choice-buttons">
      <button v-for="name in primary" :key="name" type="button" :aria-label="name" :aria-pressed="value === name" @click="choose(name)"><span v-if="value === name" aria-hidden="true">✓</span><span>{{ name }}</span></button>
    </div>
    <details v-if="extra.length" class="choice-more" :open="expanded" @toggle="expanded = $event.target.open">
      <summary>더 보기 <span>{{ extra.length }}개</span></summary>
      <div class="choice-buttons"><button v-for="name in extra" :key="name" type="button" :aria-label="name" :aria-pressed="value === name" @click="choose(name)"><span v-if="value === name" aria-hidden="true">✓</span><span>{{ name }}</span></button></div>
    </details>
    <small class="muted">{{ value ? '선택한 버튼을 다시 누르면 해제돼요.' : '선택 사항 · 비워 두어도 좋아요.' }}</small>
  </fieldset>
</template>
