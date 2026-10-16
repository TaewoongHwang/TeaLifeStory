<script setup>
import { computed } from 'vue'
import { formatDate } from '../../utils/entry.js'
import { entrySearchSnippet } from '../../utils/entrySearch.js'
import { mealStatus, statusLabels } from '../../utils/meal.js'
import AppIcon from '../common/AppIcon.vue'
const props = defineProps({ entry: { type: Object, required: true }, search: { type: String, default: '' } })
const snippet = computed(() => entrySearchSnippet(props.entry, props.search))
</script>
<template>
  <RouterLink :to="`/meals/${entry.id}`" class="tea-card meal-card">
    <div class="card-top"><span class="entry-date">{{ formatDate(entry.context.date, { year: 'numeric', month: 'long', day: 'numeric' }) }} {{ entry.context.time }}</span><span class="pill">밥</span><span v-if="entry.favorite" class="pill">다시 먹고 싶음</span><AppIcon name="arrow" /></div>
    <div class="card-content"><div class="card-copy"><h3>{{ entry.meal.name }}</h3><p class="entry-meta">{{ [entry.meal.source, entry.meal.occasion, entry.meal.venue].filter(Boolean).join(' · ') || '한 끼의 기록' }}</p>
      <p v-if="snippet" class="search-excerpt"><span class="search-excerpt-label">{{ snippet.label }}</span><template v-for="(part, index) in snippet.parts" :key="index"><mark v-if="part.matched">{{ part.text }}</mark><span v-else>{{ part.text }}</span></template></p>
      <p v-else-if="entry.experience.feeling || entry.experience.notes" class="entry-excerpt">{{ entry.experience.feeling || entry.experience.notes }}</p>
      <p v-if="entry.meal.ingredients.length" class="entry-meta">{{ entry.meal.ingredients.map(food => food.name).join(' · ') }}</p><span class="meal-status" :data-status="mealStatus(entry)">{{ statusLabels[mealStatus(entry)] }}</span>
    </div><img v-if="entry.photos[0]" class="card-photo" :src="entry.photos[0].data" :alt="entry.photos[0].name" loading="lazy" /></div>
  </RouterLink>
</template>
