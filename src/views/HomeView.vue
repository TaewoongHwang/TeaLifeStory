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
  <div class="home-view"><div class="page-eyebrow">차곡차곡 · 나의 차 일기</div>
    <section class="home-hero"><div class="hero-copy"><span class="hero-date">{{ month }} · 차와 함께한 하루</span><h1>오늘은 어떤 차를 <em>마셨나요?</em></h1><p>따뜻한 한 잔, 잠깐의 쉼.<span class="hero-story-invitation"><br />오늘의 향과 마음을 천천히 남겨 보세요.</span></p></div><div class="hero-teaware"><TeaIllustration /><span>차가 머무는 자리, 마음이 쉬어 가는 시간.</span></div></section>
    <RouterLink to="/entries/new" class="button primary new-entry-button"><AppIcon name="plus" /> 차 기록하기<span>한 잔의 마음을 담아요</span></RouterLink>
    <div class="monthly-note"><p v-if="stats.count">이번 달에는 <strong>{{ stats.count }}잔의 차</strong>를 이야기로 남겼어요.</p><p v-else>이달의 첫 이야기를 기다리고 있어요.</p><RouterLink to="/stats" aria-label="이번 달 통계 보기"><AppIcon name="arrow" /></RouterLink></div>
    <section class="recent-section"><div class="section-heading"><h2>최근에 남긴 이야기 <small>PAGES FROM MY TEA JOURNAL</small></h2><RouterLink to="/entries">모두 보기 <AppIcon name="arrow" /></RouterLink></div><div v-if="recent.length" class="card-stack"><TeaCard v-for="entry in recent" :key="entry.id" :entry="entry" /></div><EmptyState v-else /></section>
    <div class="home-footer"><span>茶</span><p>차는 천천히 우러나고,<br />우리의 하루는 한 줄씩 남아요.</p><small>YOUR EVERYDAY TEA JOURNAL</small></div>
  </div>
</template>
