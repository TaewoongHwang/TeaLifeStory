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
  <div class="home-view"><div class="page-eyebrow">A LITTLE RITUAL, A LASTING STORY</div>
    <section class="home-hero"><div class="hero-copy"><span class="hero-date">{{ month }}</span><h1>차 한 잔에 담긴<br /><em>나의 이야기.</em></h1><p>차 한 잔의 이야기를 기록합니다.<br />오늘의 향과 마음을 오래 기억하도록.</p></div><TeaIllustration /></section>
    <div class="monthly-note"><div><span class="muted">이번 달, 나를 위한 시간</span><p><strong>{{ stats.count }}</strong>잔의 차를 마셨어요<span class="small-leaf">葉</span></p></div><RouterLink to="/stats" aria-label="이번 달 통계 보기"><AppIcon name="arrow" /></RouterLink></div>
    <RouterLink to="/entries/new" class="button primary new-entry-button"><AppIcon name="plus" /> 차 기록하기<span>오늘의 한 잔을 남겨요</span></RouterLink>
    <section class="recent-section"><div class="section-heading"><h2>최근 차 기록 <small>RECENT STORIES</small></h2><RouterLink to="/entries">모두 보기 <AppIcon name="arrow" /></RouterLink></div><div v-if="recent.length" class="card-stack"><TeaCard v-for="entry in recent" :key="entry.id" :entry="entry" /></div><EmptyState v-else /></section>
    <div class="home-footer"><span>茶</span><p>좋은 차는 천천히 우러나고,<br />좋은 기억은 한 줄씩 쌓입니다.</p><small>YOUR EVERYDAY TEA JOURNAL</small></div>
  </div>
</template>
