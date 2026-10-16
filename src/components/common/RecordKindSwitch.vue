<script setup>
defineProps({ kind: { type: String, default: 'tea' } })
</script>
<template><nav class="record-kind-switch" aria-label="기록 종류"><RouterLink to="/entries/new" :aria-current="kind === 'tea' ? 'page' : undefined">차 한 잔</RouterLink><RouterLink to="/meals/new" :aria-current="kind === 'meal' ? 'page' : undefined">밥 한 끼</RouterLink></nav></template>
