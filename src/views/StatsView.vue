<script setup>
import { computed, ref } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { formatDate, localDate } from '../utils/entry.js'
import { buildTeaStats } from '../utils/stats.js'
import EmptyState from '../components/common/EmptyState.vue'
import AppIcon from '../components/common/AppIcon.vue'
const store = useEntryStore()
const month = ref(localDate().slice(0, 7))
const stats = computed(() => buildTeaStats(store.entries, month.value))
const trendMax = computed(() => Math.max(1, ...stats.value.trend.map((item) => item.count)))
const monthLabel = (value) => `${value.slice(0, 4)}년 ${Number(value.slice(5))}월`
</script>
<template>
  <div class="stats-view">
    <div class="page-eyebrow">MY TEA RHYTHM</div>
    <div class="page-title"><h1>나의 차 취향</h1><p>차와 함께한 날들, 마음에 남은 한 잔을 돌아봐요.</p></div>
    <div class="month-control"><label for="stats-month">돌아보고 싶은 달</label><input id="stats-month" v-model="month" type="month" min="0001-01" max="9999-12" /></div>
    <div class="stat-grid">
      <div class="stat-card"><span>남긴 차 이야기</span><strong>{{ stats.count }}<small> 건</small></strong></div>
      <div class="stat-card"><span>평균 평점</span><strong>{{ stats.average }}<small> / 5</small></strong><p class="stats-rating-count">평점 입력 {{ stats.ratedCount }}건</p></div>
    </div>
    <p class="muted small stats-scope-note">{{ stats.trend.length ? '마신 날짜가 선택한 달인 일기 기준 · 평점 미입력은 평균에 포함하지 않아요.' : '돌아볼 달을 선택하면 기록과 평균 평점을 보여드려요.' }}</p>
    <p v-if="stats.count" class="stats-journal-note">서로 다른 <strong>{{ stats.days }}일</strong>의 차 이야기를 남겼어요.<br /><span v-if="stats.favoriteCount">그중 <strong>즐겨찾기 {{ stats.favoriteCount }}건</strong>을 다시 펼쳐 보고 싶다고 표시했어요.</span><span v-else>기억해 두고 싶은 한 잔은 즐겨찾기로 모아 둘 수 있어요.</span></p>
    <p v-if="stats.undatedCount" class="muted small stats-undated-note">전체 기록 중 날짜가 없는 {{ stats.undatedCount }}건은 월별 통계에 포함되지 않아요. 기록에 날짜를 더하면 함께 볼 수 있어요.</p>

    <template v-if="stats.trend.length">
      <section class="panel stats-panel">
        <div class="section-heading"><h2>차와 함께한 흐름 <small>MY MONTHS OF TEA</small></h2></div>
        <p class="muted">{{ monthLabel(stats.trend[0].month) }}부터 {{ monthLabel(month) }}까지<br />달을 누르면 그달의 이야기를 볼 수 있어요.</p>
        <div class="month-trend" aria-label="월별 차 기록 수">
          <button v-for="item in stats.trend" :key="item.month" type="button" class="trend-month" :class="{ selected: item.month === month }" :aria-label="`${monthLabel(item.month)} · 기록 ${item.count}건`" :aria-pressed="item.month === month" @click="month = item.month">
            <strong>{{ item.count }}<span class="sr-only">건</span></strong>
            <span class="trend-track" aria-hidden="true"><span :style="{ height: `${item.count / trendMax * 100}%` }" /></span>
            <span>{{ item.label }}</span><small class="trend-selection">{{ item.month === month ? '선택' : '\u00a0' }}</small>
          </button>
        </div>
        <p class="small muted">마신 날짜를 기준으로 일기를 세었어요. 기록하지 않은 차나 실제 음용량을 나타내지는 않아요.</p>
      </section>

      <section class="panel stats-panel">
        <div class="section-heading"><h2>차 종류별 기록 <small>BY TEA TYPE</small></h2></div>
        <p v-if="stats.count" class="muted">자주 만난 차와 좋게 느낀 차를 나란히 살펴보세요.</p>
        <div v-if="stats.categories.length" class="bar-chart">
          <div v-for="item in stats.categories" :key="item.name" class="bar-row">
            <div><span class="stats-category-name">{{ item.name }}</span><strong>{{ item.count }}건 · {{ item.share }}%</strong></div>
            <div class="bar-track" aria-hidden="true"><span :style="{ width: `${item.count / stats.count * 100}%` }" /></div>
            <p class="stats-category-rating">{{ item.ratedCount ? `평균 ${item.average} / 5 · 평점 입력 ${item.ratedCount}건` : '평점 미입력' }}</p>
          </div>
        </div>
        <p v-if="stats.count" class="small muted">비율은 선택한 달의 전체 기록 기준으로 반올림했어요. 평점 입력 수를 함께 살펴봐 주세요.</p>
        <EmptyState v-else title="선택한 달의 기록이 없어요" description="다른 달의 이야기를 펼치거나 새로운 한 잔을 남겨 보세요." />
      </section>

      <section v-if="stats.count" class="panel stats-panel stats-highlights">
        <div class="section-heading"><h2>다시 펼쳐 보고 싶은 한 잔 <small>MOMENTS TO REVISIT</small></h2></div>
        <p class="muted">선택한 달의 즐겨찾기 또는 4~5점 기록이에요. 즐겨찾기·높은 평점·최근 마신 날짜 순으로 3건까지 모았어요.</p>
        <div v-if="stats.highlights.length" class="stats-memory-list">
          <RouterLink v-for="entry in stats.highlights" :key="entry.id" :to="`/entries/${encodeURIComponent(entry.id)}`" class="stats-memory">
            <div><strong class="stats-memory-name">{{ entry.tea.name }}</strong><span class="stats-memory-meta">{{ formatDate(entry.context.date, { month: 'numeric', day: 'numeric' }) }} · {{ entry.experience.rating ? `${entry.experience.rating} / 5` : '평점 미입력' }}<span v-if="entry.favorite" class="stats-memory-favorite"><AppIcon name="heart" />즐겨찾기</span></span></div><AppIcon name="arrow" />
          </RouterLink>
        </div>
        <p v-else class="muted small">기억하고 싶은 한 잔에 즐겨찾기나 4~5점 평점을 남기면 이곳에서 다시 만날 수 있어요.</p>
      </section>
    </template>
    <EmptyState v-else title="돌아볼 달을 선택해 주세요" description="한 달의 차 이야기를 모아 볼 수 있어요." :action="false" />
  </div>
</template>
