<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePurchaseStore } from '../stores/purchaseStore.js'
import { useAppStore } from '../stores/appStore.js'
import PurchaseEditor from '../components/meal/PurchaseEditor.vue'
import BaseModal from '../components/common/BaseModal.vue'
const store = usePurchaseStore()
const app = useAppStore()
const editing = ref(null)
const creating = ref(false)
const deleting = ref(null)
const busy = ref(false)
const error = ref('')
const search = ref('')
const favorites = ref(false)
const purchases = computed(() => store.purchases.filter((item) => (!favorites.value || item.favorite) && search.value.trim().toLocaleLowerCase().split(/\s+/).every((word) => [item.name, item.product, item.shop, item.date, item.notes].join(' ').toLocaleLowerCase().includes(word))))
onMounted(async () => { try { await store.load() } catch { error.value = '구매 목록을 불러오지 못했습니다.' } })
function saved() { editing.value = null; creating.value = false; app.notify('재료 구매 정보를 남겼어요.') }
async function remove() {
  busy.value = true; error.value = ''
  try { await store.remove(deleting.value.id); deleting.value = null; app.notify('구매 목록에서 지웠어요. 지난 끼니의 정보는 보존됩니다.') }
  catch { error.value = '삭제하지 못했습니다. 기존 정보는 유지됩니다.' }
  finally { busy.value = false }
}
</script>
<template><div class="purchases-view"><RouterLink to="/settings" class="button text-button">설정으로 돌아가기</RouterLink><div class="page-title"><h1>다시 찾는 재료</h1><p>어디서 산 어떤 재료가 좋았는지 남겨요.</p></div><button type="button" class="button primary" @click="creating = true">재료 구매 등록</button><label class="field purchase-search"><span>구매 재료 검색</span><input v-model="search" type="search" placeholder="재료, 제품, 구매처, 메모" /></label><label class="checkbox-field"><input v-model="favorites" type="checkbox" /><span>다시 사고 싶은 재료만 보기</span></label><p v-if="error && !deleting" role="alert" class="inline-error">{{ error }}</p><p class="muted small">{{ purchases.length }}개의 구매 기록 · 수정·삭제해도 지난 끼니에 연결한 내용은 유지됩니다.</p><p v-if="!purchases.length" class="empty-state">아직 찾는 구매 정보가 없어요. 구입한 재료를 한 번 남겨 여러 끼니에 연결해 보세요.</p><article v-for="purchase in purchases" :key="purchase.id" class="panel purchase-card"><h2>{{ purchase.name }}</h2><p>{{ purchase.product }}</p><p>{{ [purchase.shop, purchase.date].filter(Boolean).join(' · ') || '구매처·날짜 미기록' }}</p><span v-if="purchase.favorite" class="pill">다시 사고 싶음</span><p class="preserve-lines">{{ purchase.notes }}</p><div class="meal-actions"><button type="button" class="button secondary" @click="editing = purchase">구매 정보 수정</button><button type="button" class="button text-button" @click="deleting = purchase">구매 정보 삭제</button></div></article><Teleport to="body"><BaseModal v-if="creating || editing" :title="editing ? '재료 구매 수정' : '재료 구매 등록'" @close="!busy && (creating = false, editing = null)"><PurchaseEditor :value="editing" @busy="busy = $event" @saved="saved" @cancel="creating = false; editing = null" /></BaseModal><BaseModal v-if="deleting" title="구매 목록에서 지울까요?" @close="!busy && (deleting = null)"><p>{{ deleting.name }}의 구매 정보를 목록에서 지웁니다. 이미 밥 기록에 연결한 내용은 그대로 남습니다.</p><p v-if="error" role="alert" class="inline-error">{{ error }}</p><div class="modal-actions"><button type="button" class="button secondary" :disabled="busy" @click="deleting = null">취소</button><button type="button" class="button danger" :disabled="busy" @click="remove">구매 정보 삭제하기</button></div></BaseModal></Teleport></div></template>
