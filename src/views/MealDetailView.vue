<script setup>
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useEntryStore } from '../stores/entryStore.js'
import { useAppStore } from '../stores/appStore.js'
import { isMeal } from '../utils/record.js'
import { formatDate } from '../utils/entry.js'
import { mealStatus, statusLabels } from '../utils/meal.js'
import ObservationEditor from '../components/meal/ObservationEditor.vue'
import TeaRating from '../components/tea/TeaRating.vue'
import BaseModal from '../components/common/BaseModal.vue'
import EmptyState from '../components/common/EmptyState.vue'
import GoogleMapsLink from '../components/meal/GoogleMapsLink.vue'
const route = useRoute(), router = useRouter(), store = useEntryStore(), app = useAppStore()
const entry = computed(() => store.entries.find(item => item.id === route.params.id && isMeal(item)))
const observations = computed(() => [...(entry.value?.observations || [])].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)))
const observing = ref(false), selected = ref(null), dirty = ref(false), busy = ref(false), deleting = ref(false), deletingObservation = ref(null), error = ref('')
function openObservation(value = null) { selected.value = value; dirty.value = false; observing.value = true }
function closeObservation() { if (!busy.value && (!dirty.value || window.confirm('입력 중인 식후 느낌을 저장하지 않고 닫을까요?'))) observing.value = false }
onBeforeRouteLeave(() => !busy.value && (!observing.value || !dirty.value || window.confirm('입력 중인 식후 느낌을 저장하지 않고 이동할까요?')))
async function remove(observation = null) {
  busy.value = true; error.value = ''
  try {
    if (observation) { await store.saveObservation(entry.value.id, observation, true); deletingObservation.value = null; app.notify('식후 느낌을 삭제했어요.') }
    else { await store.remove(entry.value.id); deleting.value = false; busy.value = false; app.notify('밥 기록을 삭제했어요.'); await router.push('/') }
  } catch { error.value = '삭제하지 못했습니다. 기존 기록은 유지됩니다. 다시 시도해 주세요.' }
  finally { busy.value = false }
}
async function favorite() {
  busy.value = true
  try { await store.toggleFavorite(entry.value.id) } catch { app.notify('즐겨찾기를 변경하지 못했습니다.', 'error') }
  finally { busy.value = false }
}
</script>
<template>
  <div><RouterLink to="/" class="back-link">← 모든 기록</RouterLink><article v-if="entry" class="detail-paper"><div class="detail-header"><span class="page-eyebrow">{{ formatDate(entry.context.date) }} {{ entry.context.time }}</span><h1>{{ entry.meal.name }}</h1><span class="pill">{{ entry.meal.source || '밥 기록' }}</span><span v-if="entry.meal.occasion" class="pill">{{ entry.meal.occasion }}</span><p v-if="entry.experience.feeling" class="feeling-note">{{ entry.experience.feeling }}</p></div>
    <button class="button secondary" :disabled="busy" :aria-pressed="entry.favorite" @click="favorite">{{ entry.favorite ? '다시 먹고 싶음 해제' : '다시 먹고 싶은 한 끼' }}</button>
    <section class="detail-section" aria-labelledby="observations-title"><h2 id="observations-title">먹고 나서 어땠나요?</h2><p class="muted">{{ statusLabels[mealStatus(entry)] }} · 맛의 만족도와 속 느낌을 따로 남겨요.</p><p v-if="!observations.length">아직 식후 느낌을 남기지 않았어요. 나중에 돌아와도 괜찮아요.</p>
      <ol v-if="observations.length" class="observation-list"><li v-for="item in observations" :key="item.id"><time>{{ item.date }} {{ item.time }}</time><strong>{{ item.feelings.join(' · ') }}</strong><p v-if="item.notes" class="preserve-lines">{{ item.notes }}</p><div class="detail-actions"><button class="button text-button" :aria-label="`${item.date} ${item.time} 느낌 수정`" @click="openObservation(item)">수정</button><button class="button danger-text" :aria-label="`${item.date} ${item.time} 느낌 삭제`" @click="error = ''; deletingObservation = item">삭제</button></div></li></ol>
      <button class="button primary" @click="openObservation()">{{ observations.length ? '새 식후 느낌 추가' : '식후 느낌 남기기' }}</button>
    </section>
    <section class="detail-section"><h2>그날의 한 끼</h2><dl class="detail-brew"><div v-for="(label, key) in { venue: '음식점·지점', portion: '먹은 양', spice: '매운 정도', before: '먹기 전 속 상태', drink: '함께 마신 것' }" :key="key"><dt>{{ label }}</dt><dd>{{ entry.meal[key] || '—' }}</dd></div><div><dt>장소</dt><dd>{{ entry.context.location || '—' }}</dd></div><div><dt>함께한 사람</dt><dd>{{ entry.context.people || '—' }}</dd></div></dl><GoogleMapsLink v-if="entry.meal.venue.trim()" :venue="entry.meal.venue" label="구글맵에서 보기" /><p v-if="entry.experience.rating" class="muted">맛 평점</p><TeaRating v-if="entry.experience.rating" :model-value="entry.experience.rating" readonly /></section>
    <section v-if="entry.meal.ingredients.length" class="detail-section"><h2>함께 먹은 재료</h2><ul class="ingredient-summary"><li v-for="food in entry.meal.ingredients" :key="food.id"><strong>{{ food.name }}</strong><span>{{ [food.group, food.preparation].filter(Boolean).join(' · ') }}</span><div v-if="food.purchase" class="purchase-snapshot"><p>{{ [food.purchase.name, food.purchase.product, food.purchase.shop, food.purchase.date].filter(Boolean).join(' · ') }}</p><p v-if="food.purchase.notes" class="preserve-lines">{{ food.purchase.notes }}</p></div></li></ul><p class="small muted">구매 정보는 이 식사에 연결했을 때의 내용입니다.</p></section>
    <section v-if="entry.photos.length || entry.tags.length || entry.experience.notes" class="detail-section"><h2>사진과 메모</h2><div class="detail-photos"><img v-for="photo in entry.photos" :key="photo.id" :src="photo.data" :alt="photo.name" loading="lazy" /></div><div class="tag-row"><span v-for="tag in entry.tags" :key="tag">#{{ tag }}</span></div><p class="preserve-lines">{{ entry.experience.notes }}</p></section>
    <div class="detail-actions"><RouterLink :to="`/meals/${entry.id}/edit`" class="button secondary">밥 기록 수정</RouterLink><button class="button danger-text" @click="error = ''; deleting = true">밥 기록 삭제</button></div></article><EmptyState v-else title="밥 기록을 찾을 수 없어요" description="삭제되었거나 이 기기에 없는 기록입니다." :action="false" />
    <Teleport to="body"><BaseModal v-if="observing && entry" :title="selected ? '식후 느낌 수정' : '식후 느낌 남기기'" @close="closeObservation"><ObservationEditor :entry="entry" :value="selected" @busy="busy = $event" @dirty="dirty = $event" @cancel="closeObservation" @saved="observing = false; app.notify('식후 느낌을 남겼어요.')" /></BaseModal>
      <BaseModal v-if="deleting || deletingObservation" :title="deletingObservation ? '이 식후 느낌을 삭제할까요?' : '이 밥 기록을 삭제할까요?'" @close="!busy && (deleting = false, deletingObservation = null)"><p>삭제한 내용은 되돌릴 수 없습니다.</p><p v-if="error" class="inline-error" role="alert">{{ error }}</p><div class="modal-actions"><button class="button secondary" :disabled="busy" @click="deleting = false; deletingObservation = null">취소</button><button class="button danger" :disabled="busy" @click="remove(deletingObservation)">삭제하기</button></div></BaseModal>
    </Teleport>
  </div>
</template>
