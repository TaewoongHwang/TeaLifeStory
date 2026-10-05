<script setup>
import { computed } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { localDate, filterEntries, summarize } from '../utils/entry.js'
import TeaCard from '../components/tea/TeaCard.vue'
import TeaIllustration from '../components/tea/TeaIllustration.vue'
import AppIcon from '../components/common/AppIcon.vue'
import EmptyState from '../components/common/EmptyState.vue'
const store = useEntryStore()
const month = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date())
const stats = computed(() => summarize(store.entries, localDate().slice(0, 7)))
const recent = computed(() => filterEntries(store.entries).slice(0, 3))
</script>
<template>
  <div class="home-view"><div class="page-eyebrow">TEA LIFE STORY / MY DAILY JOURNAL</div>
    <section class="home-hero"><div class="hero-copy"><span class="hero-date">{{ month }} · 한 잔의 기록</span><h1>오늘은 어떤 차를 <em>마셨나요?</em></h1><p>언제, 어디서, 누구와.<br />차 한 잔에 머물렀던<br />오늘의 이야기를 남겨요.</p></div><TeaIllustration /></section>
    <RouterLink to="/entries/new" class="button primary new-entry-button"><AppIcon name="plus" /> 차 기록하기<span>오늘의 한 잔을 남겨요</span></RouterLink>
    <div class="monthly-note"><p>이번 달에는 <strong>{{ stats.count }}잔</strong>의 이야기가 쌓였어요.</p><RouterLink to="/stats" aria-label="이번 달 통계 보기"><AppIcon name="arrow" /></RouterLink></div>
    <section class="recent-section"><div class="section-heading"><h2>최근에 남긴 이야기 <small>PAGES FROM MY TEA JOURNAL</small></h2><RouterLink to="/entries">모두 보기 <AppIcon name="arrow" /></RouterLink></div><div v-if="recent.length" class="card-stack"><TeaCard v-for="entry in recent" :key="entry.id" :entry="entry" /></div><EmptyState v-else /></section>
    <div class="home-footer"><span>茶</span><p>좋은 차는 천천히 우러나고,<br />좋은 기억은 한 줄씩 쌓입니다.</p><small>YOUR EVERYDAY TEA JOURNAL</small></div>
  </div>
</template>
