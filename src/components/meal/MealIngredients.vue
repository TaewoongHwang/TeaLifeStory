<script setup>
import { ref } from 'vue'
import { foodGroups, preparations } from '../../config/meals.js'
import { clone } from '../../utils/entry.js'
import ChoiceButtons from '../common/ChoiceButtons.vue'
import FormField from '../common/FormField.vue'
import PurchasePicker from './PurchasePicker.vue'
const ingredients = defineModel({ type: Array, required: true })
const custom = ref('')
const picking = ref(null)
function add(name, group = '') {
  name = name.trim()
  if (!name || name.length > 100 || ingredients.value.some((food) => food.name === name) || ingredients.value.length >= 100) return
  ingredients.value.push({ id: crypto.randomUUID(), name, group, preparation: '', purchase: null })
  custom.value = ''
}
function toggle(name, group) {
  if (ingredients.value.some((food) => food.name === name)) ingredients.value = ingredients.value.filter((food) => food.name !== name)
  else add(name, group)
}
function connect(purchase) {
  const food = ingredients.value.find((item) => item.id === picking.value.id)
  if (food) food.purchase = clone(purchase)
  picking.value = null
}
</script>
<template><section class="form-section"><div class="section-label"><span>02</span><h2>함께 먹은 재료</h2></div><p class="section-prompt">확인한 재료만 남겨도 좋아요. 재료를 남기면 같은 조합을 다시 찾을 수 있어요.</p><details class="meal-ingredient-choices"><summary>재료 버튼으로 고르기</summary><fieldset v-for="(foods, group) in foodGroups" :key="group" class="field choice-field"><legend>{{ group }}</legend><div class="choice-buttons"><button v-for="name in foods" :key="name" type="button" :aria-pressed="ingredients.some((item) => item.name === name)" @click="toggle(name, group)">{{ ingredients.some((item) => item.name === name) ? '✓ ' : '' }}{{ name }}</button></div></fieldset></details><FormField v-slot="{ id }" label="재료 직접 입력"><div class="inline-add"><input :id="id" v-model="custom" maxlength="100" placeholder="예: 연근, 직접 만든 소스" @keydown.enter.prevent="add(custom)" /><button type="button" class="button secondary" @click="add(custom)">재료 추가</button></div></FormField><div v-for="food in ingredients" :key="food.id" class="meal-ingredient"><div class="meal-item-heading"><strong>{{ food.name }}</strong><button type="button" class="button text-button" :aria-label="`${food.name} 재료 빼기`" @click="ingredients = ingredients.filter((item) => item.id !== food.id)">빼기</button></div><ChoiceButtons v-model="food.group" :label="`${food.name} 분류`" :options="Object.keys(foodGroups)" /><ChoiceButtons v-model="food.preparation" :label="`${food.name} 조리법`" :options="preparations" /><div v-if="food.purchase" class="purchase-snapshot"><strong>{{ food.purchase.name }}{{ food.purchase.product ? ` · ${food.purchase.product}` : '' }}</strong><p>{{ [food.purchase.shop, food.purchase.date].filter(Boolean).join(' · ') || '구매처·날짜 미기록' }}</p><p v-if="food.purchase.notes" class="preserve-lines">{{ food.purchase.notes }}</p><button type="button" class="button text-button" @click="food.purchase = null">구매 연결 해제</button></div><button type="button" class="button secondary" @click="picking = food">{{ food.purchase ? '다른 구매 정보 선택' : '구매 정보 연결' }}</button></div><PurchasePicker v-if="picking" :name="picking.name" @choose="connect" @close="picking = null" /></section></template>
