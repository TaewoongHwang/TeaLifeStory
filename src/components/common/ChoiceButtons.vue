<script setup>
import { computed, ref, watch } from 'vue'
const value = defineModel({ type: String, required: true })
const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  shortcuts: { type: Array, default: () => [] },
  primaryOnly: Boolean,
  labels: { type: Object, default: () => ({}) },
})
const expanded = ref(false)
const ordered = computed(() => [...new Set([...props.shortcuts.filter((name) => props.options.includes(name)), ...props.options])])
const primary = computed(() => props.primaryOnly ? ordered.value.filter((name) => props.shortcuts.includes(name)) : ordered.value.slice(0, 6))
const extra = computed(() => ordered.value.filter((name) => !primary.value.includes(name)))
watch([value, extra], () => { if (extra.value.includes(value.value)) expanded.value = true }, { immediate: true })
function choose(name) { value.value = value.value === name ? '' : name }
function labelFor(name) {
  const label = props.labels[name] || name
  return label !== name && props.options.includes(label) ? `${label} (${name})` : label
}
</script>
<template>
  <fieldset class="field choice-field">
    <legend>{{ label }}</legend>
    <div class="choice-buttons">
      <button v-for="name in primary" :key="name" type="button" :aria-label="labelFor(name)" :aria-pressed="value === name" @click="choose(name)"><span v-if="value === name" aria-hidden="true">✓</span><span>{{ labelFor(name) }}</span></button>
    </div>
    <details v-if="extra.length" class="choice-more" :open="expanded" @toggle="expanded = $event.target.open">
      <summary>더 보기 <span>{{ extra.length }}개</span></summary>
      <div class="choice-buttons"><button v-for="name in extra" :key="name" type="button" :aria-label="labelFor(name)" :aria-pressed="value === name" @click="choose(name)"><span v-if="value === name" aria-hidden="true">✓</span><span>{{ labelFor(name) }}</span></button></div>
    </details>
    <small class="muted">{{ value ? '선택한 버튼을 다시 누르면 해제돼요.' : '선택 사항 · 비워 두어도 좋아요.' }}</small>
  </fieldset>
</template>
