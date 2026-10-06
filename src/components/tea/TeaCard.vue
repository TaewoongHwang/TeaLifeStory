<script setup>
import { computed } from 'vue'
import TeaRating from './TeaRating.vue'
import AppIcon from '../common/AppIcon.vue'
import { formatDate } from '../../utils/entry.js'
const props = defineProps({ entry: { type: Object, required: true } })
const moments = computed(() => [
  { label: 'Where', value: props.entry.context.location },
  { label: 'Who', value: props.entry.context.people },
  { label: 'Why', value: props.entry.context.reason },
].filter((item) => item.value))
</script>
<template>
  <RouterLink :to="`/entries/${entry.id}`" class="tea-card">
    <div class="card-top"><span class="entry-date"><span class="card-when">When</span>{{ formatDate(entry.context.date) }}</span><span v-if="entry.isSample" class="pill">샘플</span><span v-if="entry.favorite" class="pill">즐겨찾기</span><AppIcon name="arrow" /></div>
    <div class="card-content"><div class="card-copy"><h3>{{ entry.tea.name }}</h3><TeaRating :model-value="entry.experience.rating" readonly /><p v-if="entry.experience.feeling || entry.experience.notes" class="entry-excerpt">{{ entry.experience.feeling || entry.experience.notes }}</p><p v-else-if="!moments.length" class="entry-quiet">차 한 잔의 이름으로 시작한 페이지.</p><dl v-if="moments.length" class="entry-moments"><div v-for="moment in moments" :key="moment.label"><dt>{{ moment.label }}</dt><dd>{{ moment.value }}</dd></div></dl><p class="entry-meta">{{ [entry.tea.category, entry.tea.amount != null ? `${entry.tea.amount}g` : '', entry.brewing.tool].filter(Boolean).join(' · ') || '한 잔의 차' }}</p><div v-if="entry.tags.length" class="tag-row"><span v-for="tag in entry.tags.slice(0, 3)" :key="tag">#{{ tag }}</span></div></div><img v-if="entry.photos[0]" class="card-photo" :src="entry.photos[0].data" :alt="entry.photos[0].name" loading="lazy" /></div>
  </RouterLink>
</template>
