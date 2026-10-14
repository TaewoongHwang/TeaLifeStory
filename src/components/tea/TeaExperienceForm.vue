<script setup>
import FormField from '../common/FormField.vue'
const experience = defineModel({ type: Object, required: true })
const fields = [
  { key: 'aroma', label: '향', placeholder: '마른 나무 향, 은은한 꽃향…' },
  { key: 'taste', label: '맛', placeholder: '달큰함, 산뜻함, 고소함…' },
  { key: 'body', label: '바디감', placeholder: '가벼움, 부드러움, 묵직함…' },
  { key: 'aftertaste', label: '여운', placeholder: '차를 삼킨 뒤 입안에 남는 느낌' },
]
</script>
<template>
  <section class="form-section"><div class="section-label"><span>04</span><h2>느낌 <small>THE EXPERIENCE</small></h2></div>
    <p class="section-prompt">향과 맛, 입안에 남은 느낌을 조금 더 적어 볼까요?</p>
    <div class="field-grid"><FormField v-for="field in fields" :key="field.key" v-slot="{ id }" :label="field.label"><input :id="id" v-model="experience[field.key]" :placeholder="field.placeholder" maxlength="10000" /></FormField></div>
  </section>
</template>
