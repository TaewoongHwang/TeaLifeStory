<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePurchaseStore } from '../../stores/purchaseStore.js'
import BaseModal from '../common/BaseModal.vue'
import PurchaseEditor from './PurchaseEditor.vue'
import FormField from '../common/FormField.vue'
const props = defineProps({ name: { type: String, required: true } })
const emit = defineEmits(['choose', 'close'])
const store = usePurchaseStore()
const registering = ref(false)
const busy = ref(false)
const error = ref('')
const search = ref('')
const purchases = computed(() => store.purchases.filter(item => search.value.trim().toLocaleLowerCase('ko-KR').split(/\s+/).every(word => [item.name, item.product, item.shop, item.notes].join(' ').toLocaleLowerCase('ko-KR').includes(word))).sort((a, b) => Number(b.name === props.name) - Number(a.name === props.name) || b.updatedAt.localeCompare(a.updatedAt)))
onMounted(async () => { try { await store.load() } catch { error.value = '구매 목록을 불러오지 못했습니다. 다시 열어 주세요.' } })
</script>
<template><Teleport to="body"><BaseModal :title="registering ? '재료 구매 등록' : `${name} 구매 정보 연결`" @close="!busy && emit('close')"><template v-if="!registering"><p>실제로 사용한 구매 정보를 선택해 주세요. 지난 끼니의 정보는 이후 수정·삭제해도 보존됩니다.</p><p v-if="error" role="alert" class="inline-error">{{ error }}</p><FormField v-slot="{ id }" label="연결할 구매 정보 검색"><input :id="id" v-model="search" type="search" placeholder="재료, 제품, 구매처, 메모" /></FormField><div class="purchase-options"><button v-for="purchase in purchases" :key="purchase.id" type="button" class="purchase-option" @click="emit('choose', purchase)"><strong>{{ purchase.name }}{{ purchase.product ? ` · ${purchase.product}` : '' }}</strong><span>{{ [purchase.shop, purchase.date].filter(Boolean).join(' · ') || '구매처·날짜 미기록' }}</span></button></div><p v-if="!purchases.length" class="muted">아직 등록한 구매 정보가 없어요.</p><button type="button" class="button secondary" @click="registering = true">새 구매 정보 등록</button><button type="button" class="button text-button" @click="emit('close')">닫기</button></template><PurchaseEditor v-else :name="name" @busy="busy = $event" @saved="emit('choose', $event)" @cancel="registering = false" /></BaseModal></Teleport></template>
