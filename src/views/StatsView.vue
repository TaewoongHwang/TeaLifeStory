<script setup>
import { computed, ref } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { localDate, summarize } from '../utils/entry.js'
import EmptyState from '../components/common/EmptyState.vue'
const store = useEntryStore()
const month = ref(localDate().slice(0, 7))
const stats = computed(() => summarize(store.entries, month.value))
const max = computed(() => Math.max(1, ...stats.value.categories.map((item) => item[1])))
</script>
<template>
  <div><div class="page-eyebrow">MY TEA RHYTHM</div><div class="page-title"><h1>나의 차 취향</h1><p>차곡차곡 남긴 한 잔에서 나의 취향을 만나 보세요.</p></div><div class="month-control"><label for="stats-month">돌아보고 싶은 달</label><input id="stats-month" v-model="month" type="month" /></div>
    <div class="stat-grid"><div class="stat-card"><span>마신 차</span><strong>{{ stats.count }}<small> 잔</small></strong></div><div class="stat-card"><span>평균 평점</span><strong>{{ stats.average }}<small> / 5</small></strong></div><div class="stat-card stat-wide"><span>가장 자주 함께한 차 종류</span><strong>{{ stats.favorite }}</strong></div></div><p class="muted small">선택한 달 기준 · 평점을 입력한 기록만 평균에 포함합니다.</p>
    <section class="panel stats-panel"><div class="section-heading"><h2>차 종류별 기록 <small>BY TEA TYPE</small></h2></div><div v-if="stats.categories.length" class="bar-chart"><div v-for="[name, count] in stats.categories" :key="name" class="bar-row"><div><span>{{ name }}</span><strong>{{ count }}잔</strong></div><div class="bar-track" aria-hidden="true"><span :style="{ width: `${count / max * 100}%` }" /></div></div></div><EmptyState v-else title="선택한 달의 기록이 없어요" description="다른 달의 이야기를 펼치거나 새로운 한 잔을 남겨 보세요." /></section>
  </div>
</template>
