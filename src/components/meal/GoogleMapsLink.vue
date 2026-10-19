<script setup>
import { computed } from 'vue'
const props = defineProps({ venue: { type: String, default: '' }, label: { type: String, default: '구글맵에서 찾기' } })
const url = computed(() => {
  const query = props.venue.trim()
  return query ? `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}` : ''
})
</script>
<template>
  <a v-if="url" :href="url" class="button secondary map-search-link" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" :aria-label="`${label} (새 창)`">{{ label }}<span aria-hidden="true">↗</span></a>
  <button v-else type="button" class="button secondary map-search-link" disabled>{{ label }}<span aria-hidden="true">↗</span></button>
</template>
