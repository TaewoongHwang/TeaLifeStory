<script setup>
import { computed, reactive } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { useSettingsStore } from '../stores/settingsStore.js'
import { filterEntries } from '../utils/entry.js'
import TeaCard from '../components/tea/TeaCard.vue'
import AppIcon from '../components/common/AppIcon.vue'
import FormField from '../components/common/FormField.vue'
import EmptyState from '../components/common/EmptyState.vue'
const store = useEntryStore()
const settings = useSettingsStore()
const filters = reactive({ search: '', category: '', rating: '', from: '', to: '', sort: 'newest', favoritesOnly: false })
const categories = computed(() => [...new Set([...settings.categories.map((item) => item.name), ...store.entries.map((item) => item.tea.category)].filter(Boolean))])
const entries = computed(() => filterEntries(store.entries, filters))
function reset() { Object.assign(filters, { search: '', category: '', rating: '', from: '', to: '', sort: 'newest', favoritesOnly: false }) }
</script>
<template>
  <div><div class="page-eyebrow">PAGES OF TEA</div><div class="page-title"><h1>쌓여 가는 차 이야기</h1><p>다시 펼칠 때마다 그날의 차향이 떠오르도록.</p></div>
    <div class="search-box"><AppIcon name="search" /><label class="sr-only" for="entry-search">차 이름, 메모, 태그 검색</label><input id="entry-search" v-model="filters.search" type="search" placeholder="차 이름, 메모, 태그 검색" /></div>
    <label class="checkbox-field"><input v-model="filters.favoritesOnly" type="checkbox" /><span>즐겨찾기만 보기</span></label>
    <details class="filter-panel"><summary>필터와 정렬 <span>{{ filters.category || '모든 차' }} · {{ filters.rating === '' ? '모든 평점' : `${filters.rating}점` }}</span></summary><div class="field-grid"><FormField v-slot="{ id }" label="차 종류"><select :id="id" v-model="filters.category"><option value="">모든 차</option><option v-for="name in categories" :key="name">{{ name }}</option></select></FormField><FormField v-slot="{ id }" label="평점"><select :id="id" v-model="filters.rating"><option value="">모든 평점</option><option value="0">미입력</option><option v-for="star in 5" :key="star" :value="String(star)">{{ star }}점</option></select></FormField><FormField v-slot="{ id }" label="시작일"><input :id="id" v-model="filters.from" type="date" /></FormField><FormField v-slot="{ id }" label="종료일"><input :id="id" v-model="filters.to" type="date" /></FormField><FormField v-slot="{ id }" label="정렬"><select :id="id" v-model="filters.sort"><option value="newest">최신순</option><option value="oldest">오래된순</option><option value="rating">평점순</option></select></FormField><button class="button text-button" type="button" @click="reset">필터 초기화</button></div></details>
    <p v-if="filters.from && filters.to && filters.from > filters.to" class="inline-error" role="alert">종료일을 시작일 이후로 선택해 주세요.</p>
    <div class="list-count">총 <strong>{{ entries.length }}</strong>개의 이야기</div><div v-if="entries.length" class="card-stack"><TeaCard v-for="entry in entries" :key="entry.id" :entry="entry" /></div><EmptyState v-else :title="store.entries.length ? '찾는 이야기가 없어요' : undefined" :description="store.entries.length ? '검색어나 필터를 바꿔 보세요.' : undefined" :action="!store.entries.length" />
  </div>
</template>
