<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEntryStore } from '../stores/entryStore.js'
import { useAppStore } from '../stores/appStore.js'
import { formatDate } from '../utils/entry.js'
import TeaRating from '../components/tea/TeaRating.vue'
import AppIcon from '../components/common/AppIcon.vue'
import BaseModal from '../components/common/BaseModal.vue'
import EmptyState from '../components/common/EmptyState.vue'
const route = useRoute()
const router = useRouter()
const store = useEntryStore()
const app = useAppStore()
const entry = computed(() => store.entries.find((item) => item.id === route.params.id))
const deleting = ref(false)
const busy = ref(false)
const error = ref('')
const favoriting = ref(false)
const flavorFields = { aroma: '향', taste: '맛', body: '바디감', aftertaste: '여운' }
async function toggleFavorite() {
  favoriting.value = true
  try { await store.toggleFavorite(entry.value.id) }
  catch { app.notify('즐겨찾기를 변경하지 못했습니다. 다시 시도해 주세요.', 'error') }
  finally { favoriting.value = false }
}
async function remove() {
  busy.value = true
  try { await store.remove(entry.value.id); app.notify('차 기록을 삭제했어요.'); await router.push('/entries') }
  catch { error.value = '기록을 삭제하지 못했습니다. 다시 시도해 주세요.' }
  finally { busy.value = false }
}
</script>
<template>
  <div><RouterLink to="/entries" class="back-link"><AppIcon name="back" />모든 기록</RouterLink>
    <article v-if="entry" class="detail-paper"><div class="detail-header"><span class="page-eyebrow">{{ formatDate(entry.context.date) }}</span><span v-if="entry.isSample" class="pill">개발용 샘플</span><h1>{{ entry.tea.name }}</h1><span class="pill">{{ entry.tea.category || '미분류' }}</span><div class="detail-rating"><TeaRating :model-value="entry.experience.rating" readonly /><span class="muted">{{ entry.experience.rating ? `${entry.experience.rating} / 5` : '평점 미입력' }}</span></div></div>
    <button type="button" class="button secondary favorite-button" :aria-pressed="entry.favorite" :disabled="favoriting" @click="toggleFavorite"><AppIcon name="heart" />{{ entry.favorite ? '즐겨찾기 해제' : '즐겨찾기에 담기' }}</button>
    <section class="detail-section"><h2>茶 <small>한 잔의 차</small></h2><dl class="detail-brew"><div><dt>사용량</dt><dd>{{ entry.tea.amount != null ? `${entry.tea.amount} g` : '—' }}</dd></div><div><dt>도구</dt><dd>{{ entry.brewing.tool || '—' }}</dd></div><div><dt>재질</dt><dd>{{ entry.brewing.material || '—' }}</dd></div><div><dt>물 용량</dt><dd>{{ entry.brewing.volume != null ? `${entry.brewing.volume} cc` : '—' }}</dd></div><div><dt>물 온도</dt><dd>{{ entry.brewing.waterTemperature != null ? `${entry.brewing.waterTemperature} °C` : '—' }}</dd></div><div><dt>우림 시간</dt><dd>{{ entry.brewing.steepTime != null ? `${entry.brewing.steepTime} 초` : '—' }}</dd></div></dl></section>
    <section class="detail-section"><h2>그날의 순간 <small>THE MOMENT</small></h2><dl class="detail-context"><div><dt>When</dt><dd>{{ formatDate(entry.context.date) }} {{ entry.context.time }}</dd></div><div><dt>Where</dt><dd>{{ entry.context.location || '—' }}</dd></div><div><dt>Who</dt><dd>{{ entry.context.people || '—' }}</dd></div><div><dt>Why</dt><dd>{{ entry.context.reason || '—' }}</dd></div></dl></section>
    <section class="detail-section"><h2>남아 있는 느낌 <small>THE EXPERIENCE</small></h2><dl class="detail-flavor"><div v-for="(label, key) in flavorFields" :key="key"><dt>{{ label }}</dt><dd>{{ entry.experience[key] || '—' }}</dd></div></dl><p v-if="entry.experience.feeling" class="feeling-note">{{ entry.experience.feeling }}</p><p v-else class="muted">아직 남긴 느낌이 없어요.</p></section>
    <section v-if="entry.photos.length || entry.tags.length || entry.experience.notes" class="detail-section"><h2>조금 더 <small>EXTRA NOTES</small></h2><div class="detail-photos"><img v-for="photo in entry.photos" :key="photo.id" :src="photo.data" :alt="photo.name" loading="lazy" /></div><div class="tag-row"><span v-for="tag in entry.tags" :key="tag">#{{ tag }}</span></div><p v-if="entry.experience.notes" class="preserve-lines">{{ entry.experience.notes }}</p></section>
    <div class="detail-actions"><RouterLink :to="`/entries/${entry.id}/edit`" class="button secondary"><AppIcon name="edit" />기록 수정</RouterLink><button type="button" class="button danger-text" @click="deleting = true">삭제</button></div></article>
    <EmptyState v-else title="기록을 찾을 수 없어요" description="삭제되었거나 이 기기에 없는 기록입니다." :action="false" />
    <BaseModal v-if="deleting" title="이 차 기록을 삭제할까요?" @close="!busy && (deleting = false)"><p>삭제한 기록은 되돌릴 수 없습니다. 필요하다면 설정에서 먼저 백업해 주세요.</p><p v-if="error" class="inline-error" role="alert">{{ error }}</p><div class="modal-actions"><button class="button secondary" :disabled="busy" @click="deleting = false">취소</button><button class="button danger" :disabled="busy" @click="remove">{{ busy ? '삭제 중…' : '삭제하기' }}</button></div></BaseModal>
  </div>
</template>
