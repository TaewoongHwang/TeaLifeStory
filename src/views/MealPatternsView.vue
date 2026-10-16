<script setup>
import { computed, reactive, ref } from 'vue'
import { useEntryStore } from '../stores/entryStore.js'
import { findMealPatterns, mealStatus } from '../utils/meal.js'
import { isMeal } from '../utils/record.js'
import { mealSources } from '../config/meals.js'
import FormField from '../components/common/FormField.vue'
import ChoiceButtons from '../components/common/ChoiceButtons.vue'
import MealCard from '../components/meal/MealCard.vue'
const store = useEntryStore()
const filters = reactive({ ingredients: [], venue: '', source: '', from: '', to: '' })
const meals = computed(() => store.entries.filter(isMeal))
const ingredients = computed(() => [...new Set(meals.value.flatMap(entry => entry.meal.ingredients.map(food => food.name)))].sort((a, b) => a.localeCompare(b, 'ko')))
const venues = computed(() => [...new Set(meals.value.map(entry => entry.meal.venue).filter(Boolean))].sort())
const result = computed(() => findMealPatterns(meals.value, filters))
const status = ref('')
const visibleRows = computed(() => result.value.rows.filter(entry => !status.value || mealStatus(entry) === status.value))
function toggle(name) { filters.ingredients = filters.ingredients.includes(name) ? filters.ingredients.filter(item => item !== name) : [...filters.ingredients, name] }
function reset() { Object.assign(filters, { ingredients: [], venue: '', source: '', from: '', to: '' }); status.value = '' }
</script>
<template>
  <div><RouterLink to="/settings" class="back-link">← 설정</RouterLink><div class="page-title"><h1>나에게 편했던 한 끼</h1><p>재료 조합과 음식점을 골라, 그때의 속 느낌을 함께 돌아봐요.</p></div><section class="panel"><ChoiceButtons v-model="filters.source" label="식사 구분" :options="mealSources" /><details class="ingredient-catalog"><summary>함께 먹은 재료로 찾기{{ filters.ingredients.length ? ` · ${filters.ingredients.length}개 선택` : '' }}</summary><p class="small muted">선택한 재료가 모두 들어 있는 식사를 찾아요.</p><div class="choice-grid"><button v-for="name in ingredients" :key="name" class="choice-button" :aria-pressed="filters.ingredients.includes(name)" @click="toggle(name)">{{ filters.ingredients.includes(name) ? '✓ ' : '' }}{{ name }}</button></div><p v-if="!ingredients.length" class="muted">밥 기록에 재료를 남기면 여기서 조합을 고를 수 있어요.</p></details>
      <FormField v-slot="{ id }" label="음식점·지점"><select :id="id" v-model="filters.venue"><option value="">모든 음식점과 집밥</option><option v-for="venue in venues" :key="venue">{{ venue }}</option></select></FormField><div class="field-grid"><FormField v-slot="{ id }" label="시작일"><input :id="id" v-model="filters.from" type="date" /></FormField><FormField v-slot="{ id }" label="종료일"><input :id="id" v-model="filters.to" type="date" /></FormField></div><button class="button text-button" @click="reset">조건 초기화</button><p v-if="filters.from && filters.to && filters.from > filters.to" class="inline-error" role="alert">종료일을 시작일 이후로 선택해 주세요.</p></section>
    <section class="panel" aria-labelledby="pattern-counts"><h2 id="pattern-counts">선택한 조건의 밥 기록 {{ result.total }}끼</h2><dl class="meal-counts"><div><dt>편안함만 기록</dt><dd>{{ result.comfortable }}끼</dd></div><div><dt>불편함 기록 있음</dt><dd>{{ result.discomfort }}끼</dd></div><div><dt>식후 느낌 미기록</dt><dd>{{ result.missing }}끼</dd></div></dl><p class="small muted">한 끼에 느낌을 여러 번 남겨도 한 번만 셉니다. 편안함 뒤 불편함을 남긴 식사는 ‘불편함 기록 있음’에 포함해요. 미기록은 편안함으로 세지 않아요.</p><p class="small muted">내가 남긴 경험을 돌아보는 기록입니다. 특정 재료가 원인이라는 뜻은 아니며, 먹은 양·조리법·식전 상태도 함께 살펴보세요.</p></section>
    <div class="record-filter" role="group" aria-label="식후 느낌 필터"><button v-for="item in [{ value: '', label: '전체' }, { value: 'comfortable', label: '편안함' }, { value: 'discomfort', label: '불편함' }, { value: 'missing', label: '미기록' }]" :key="item.value" :aria-pressed="status === item.value" @click="status = item.value">{{ status === item.value ? '✓ ' : '' }}{{ item.label }}</button></div><p class="small muted" role="status">조건에 맞는 {{ visibleRows.length }}끼의 이야기</p><div v-if="visibleRows.length" class="card-stack"><MealCard v-for="entry in visibleRows" :key="entry.id" :entry="entry" /></div><p v-else class="panel muted">조건에 맞는 밥 기록이 아직 없어요.</p>
  </div>
</template>
