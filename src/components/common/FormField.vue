<script setup>
import { useId } from 'vue'
defineProps({ label: { type: String, required: true }, hint: { type: String, default: '' } })
const id = useId()
</script>
<template><div class="field"><label :for="id">{{ label }}</label><slot :id="id" /><small v-if="hint" class="muted">{{ hint }}</small></div></template>
