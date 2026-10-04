<script setup>
import TeaRating from './TeaRating.vue'
import AppIcon from '../common/AppIcon.vue'
import { formatDate } from '../../utils/entry.js'
defineProps({ entry: { type: Object, required: true } })
</script>
<template>
  <RouterLink :to="`/entries/${entry.id}`" class="tea-card">
    <div class="card-top"><span class="entry-date">{{ formatDate(entry.context.date) }}</span><span v-if="entry.isSample" class="pill">샘플</span><AppIcon name="arrow" /></div>
    <div class="card-content"><div class="card-copy"><h3>{{ entry.tea.name }}</h3><p class="entry-meta">{{ [entry.tea.category, entry.tea.amount != null ? `${entry.tea.amount}g` : '', entry.brewing.tool].filter(Boolean).join(' · ') || '한 잔의 차' }}</p><TeaRating :model-value="entry.experience.rating" readonly /><p v-if="entry.experience.feeling || entry.experience.notes" class="entry-excerpt">{{ entry.experience.feeling || entry.experience.notes }}</p><div v-if="entry.tags.length" class="tag-row"><span v-for="tag in entry.tags.slice(0, 3)" :key="tag">#{{ tag }}</span></div></div><img v-if="entry.photos[0]" class="card-photo" :src="entry.photos[0].data" :alt="entry.photos[0].name" loading="lazy" /></div>
  </RouterLink>
</template>
