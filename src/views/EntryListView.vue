<script setup>
import { computed, reactive, ref } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { filterEntries, localDate } from '../utils/entry.js'
import TeaCard from '../components/tea/TeaCard.vue'
import MealCard from '../components/meal/MealCard.vue'
import { isMeal } from '../utils/record.js'
import { mealSources } from '../config/meals.js'
import AppIcon from '../components/common/AppIcon.vue'
import FormField from '../components/common/FormField.vue'
import EmptyState from '../components/common/EmptyState.vue'
defineProps({ embedded: Boolean })
const store = useEntryStore()
const settings = useSettingsStore()
const filters = reactive({ search: '', kind: '', category: '', rating: '', from: '', to: '', sort: 'newest', favoritesOnly: false })
const searchInput = ref(null)
const categories = computed(() => filters.kind === 'meal' ? mealSources : [...new Set([...settings.categories.map((item) => item.name), ...store.entries.filter(item => !isMeal(item)).map((item) => item.tea.category)].filter(Boolean))])
const entries = computed(() => filterEntries(store.entries, filters))
const ratingLabel = computed(() => filters.rating === '' ? '모든 평점' : filters.rating === '0' ? '평점 미입력' : `${filters.rating}점`)
const hasConditions = computed(() => Boolean(filters.search.trim() || filters.kind || filters.category || filters.rating !== '' || filters.from || filters.to || filters.favoritesOnly))
function periodRange(value) {
  const now = new Date()
  const today = localDate(now)
  return {
    from: value === 'today' ? today : value === 'month' ? `${today.slice(0, 7)}-01` : '',
    to: value === 'today' ? today : value === 'month' ? localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)) : '',
  }
}
const period = computed(() => {
  for (const value of ['all', 'today', 'month']) {
    const range = periodRange(value)
    if (filters.from === range.from && filters.to === range.to) return value
  }
  return 'custom'
})
function choosePeriod(value) { Object.assign(filters, periodRange(value)) }
function reset() { Object.assign(filters, { kind: '', category: '', rating: '', from: '', to: '', sort: 'newest', favoritesOnly: false }) }
function chooseKind(kind) { filters.kind = kind; filters.category = '' }
function clearSearch() { filters.search = ''; searchInput.value?.focus() }
function resetAll() { reset(); clearSearch() }
</script>
<template>
  <div><template v-if="!embedded"><div class="page-eyebrow">PAGES OF TEA</div><div class="page-title"><h1>쌓여 가는 차 이야기</h1><p>다시 펼칠 때마다 그날의 차향이 떠오르도록.</p></div></template>
    <div class="record-filter" role="group" aria-label="기록 종류 필터"><button v-for="item in [{ value: '', label: '전체' }, { value: 'tea', label: '차' }, { value: 'meal', label: '밥' }]" :key="item.value" type="button" :aria-pressed="filters.kind === item.value" @click="chooseKind(item.value)">{{ filters.kind === item.value ? '✓ ' : '' }}{{ item.label }}</button></div><label class="search-label" for="entry-search">기록 검색</label>
    <div class="search-box"><AppIcon name="search" /><input id="entry-search" ref="searchInput" v-model="filters.search" type="search" placeholder="예: 10월 녹차 고소한" aria-describedby="entry-search-help" maxlength="200" /><button v-if="filters.search" type="button" class="search-clear" aria-label="검색어 지우기" @click="clearSearch"><AppIcon name="close" /></button></div>
    <p id="entry-search-help" class="search-help">이름·날짜·음식점·재료·구매처·식후 느낌까지 찾아요.<br />단어를 띄어 쓰면 함께 찾고, 날짜는 10월 또는 2026-10-12처럼 입력해요.</p>
    <div class="search-period" role="group" aria-label="빠른 기간 선택"><button v-for="item in [{ value: 'all', label: '전체 기간' }, { value: 'today', label: '오늘' }, { value: 'month', label: '이번 달' }]" :key="item.value" type="button" :aria-pressed="period === item.value" @click="choosePeriod(item.value)">{{ period === item.value ? '✓ ' : '' }}{{ item.label }}</button></div>
    <label class="checkbox-field"><input v-model="filters.favoritesOnly" type="checkbox" /><span>즐겨찾기만 보기</span></label>
    <details class="filter-panel"><summary>필터와 정렬 <span>{{ filters.category || (filters.kind === 'meal' ? '모든 식사' : '모든 차') }} · {{ ratingLabel }}{{ filters.from || filters.to ? ' · 기간 적용' : '' }}</span></summary><div class="field-grid"><FormField v-slot="{ id }" :label="filters.kind === 'meal' ? '식사 구분' : '차 종류'"><select :id="id" v-model="filters.category"><option value="">{{ filters.kind === 'meal' ? '모든 식사' : '모든 차' }}</option><option v-for="name in categories" :key="name">{{ name }}</option></select></FormField><FormField v-slot="{ id }" label="평점"><select :id="id" v-model="filters.rating"><option value="">모든 평점</option><option value="0">미입력</option><option v-for="star in 5" :key="star" :value="String(star)">{{ star }}점</option></select></FormField><FormField v-slot="{ id }" label="시작일"><input :id="id" v-model="filters.from" type="date" /></FormField><FormField v-slot="{ id }" label="종료일"><input :id="id" v-model="filters.to" type="date" /></FormField><FormField v-slot="{ id }" label="정렬"><select :id="id" v-model="filters.sort"><option value="newest">최신순</option><option value="oldest">오래된순</option><option value="rating">평점순</option></select></FormField><button class="button text-button" type="button" @click="reset">필터 초기화</button></div></details>
    <p v-if="filters.from && filters.to && filters.from > filters.to" class="inline-error" role="alert">종료일을 시작일 이후로 선택해 주세요.</p>
    <div class="search-results"><p class="list-count" role="status" aria-live="polite" aria-atomic="true"><template v-if="hasConditions">전체 {{ store.entries.length }}개 중 <strong>{{ entries.length }}</strong>개 찾았어요</template><template v-else>총 <strong>{{ entries.length }}</strong>개의 이야기</template></p><button v-if="hasConditions" class="button text-button" type="button" @click="resetAll">검색·필터 모두 해제</button></div><div v-if="entries.length" class="card-stack"><component :is="isMeal(entry) ? MealCard : TeaCard" v-for="entry in entries" :key="entry.id" :entry="entry" :search="filters.search" /></div><EmptyState v-else :title="store.entries.length ? '찾는 이야기가 없어요' : undefined" :description="store.entries.length ? '검색어를 짧게 바꾸거나 기간·필터를 해제해 보세요.' : undefined" :action="!store.entries.length" />
  </div>
</template>
