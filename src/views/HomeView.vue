<script setup>
import { computed } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { localDate, summarize } from '../utils/entry.js'
import { isMeal } from '../utils/record.js'
import EntryListView from './EntryListView.vue'
import TeaIllustration from '../components/tea/TeaIllustration.vue'
import AppIcon from '../components/common/AppIcon.vue'
const store = useEntryStore()
const month = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(new Date())
const stats = computed(() => summarize(store.entries, localDate().slice(0, 7)))
const mealCount = computed(() => store.entries.filter(entry => isMeal(entry) && entry.context.date.startsWith(localDate().slice(0, 7))).length)
</script>
<template>
  <div class="home-view"><div class="page-eyebrow">차곡차곡 · 차(茶)와 곡(穀)의 일기</div>
    <section class="home-hero"><div class="hero-copy"><span class="hero-date">{{ month }} · 차와 밥으로 채운 하루</span><h1>오늘의 한 잔,<br /><em>오늘의 한 끼.</em></h1><p>차의 향과 밥의 온기를 차곡차곡.<span class="hero-story-invitation"><br />내게 좋았던 순간을 천천히 남겨 보세요.</span></p></div><div class="hero-teaware"><TeaIllustration /><span>한 잔과 한 끼가 머무는 일기장.</span></div></section>
    <div class="home-record-actions"><RouterLink to="/entries/new" class="button primary new-entry-button"><AppIcon name="plus" /> 차 기록하기<span>한 잔의 마음</span></RouterLink><RouterLink to="/meals/new" class="button secondary new-entry-button"><AppIcon name="plus" /> 밥 기록하기<span>나에게 맞는 한 끼</span></RouterLink></div>
    <div class="monthly-note"><p v-if="stats.count || mealCount">이번 달 <strong>차 {{ stats.count }}잔 · 밥 {{ mealCount }}끼</strong>를 이야기로 남겼어요.</p><p v-else>이달의 첫 이야기를 기다리고 있어요.</p></div>
    <section class="recent-section" aria-labelledby="journal-heading"><div class="section-heading"><h2 id="journal-heading">쌓여 가는 차와 밥 이야기 <small>PAGES FROM MY JOURNAL</small></h2></div><EntryListView embedded /></section>
    <div class="home-footer"><span>茶 · 穀</span><p>한 잔의 여유, 한 끼의 온기.<br />우리의 하루는 한 줄씩 남아요.</p><small>YOUR EVERYDAY JOURNAL</small></div>
  </div>
</template>
