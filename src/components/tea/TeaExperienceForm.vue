<script setup>
import FormField from '../common/FormField.vue'
import TeaRating from './TeaRating.vue'
const experience = defineModel({ type: Object, required: true })
const fields = [
  { key: 'aroma', label: '향', placeholder: '은은한 꽃향, 풋풋한 풀향…' },
  { key: 'taste', label: '맛', placeholder: '달큰함, 산뜻함, 고소함…' },
  { key: 'body', label: '바디감', placeholder: '가벼운, 부드러운, 묵직한…' },
  { key: 'aftertaste', label: '여운', placeholder: '입안에 오래 남는 느낌' },
]
</script>
<template>
  <section class="form-section"><div class="section-label"><span>04</span><h2>느낌 <small>THE EXPERIENCE</small></h2></div>
    <div class="field"><span class="field-label">오늘의 평점 <small class="muted">선택 사항</small></span><TeaRating v-model="experience.rating" /></div>
    <div class="field-grid"><FormField v-for="field in fields" :key="field.key" v-slot="{ id }" :label="field.label"><input :id="id" v-model="experience[field.key]" :placeholder="field.placeholder" maxlength="10000" /></FormField></div>
    <FormField v-slot="{ id }" label="차를 마시면서 느낀 점"><textarea :id="id" v-model="experience.feeling" rows="4" class="lined-textarea" placeholder="차 한 잔과 함께한 순간을 남겨 보세요." maxlength="10000" /></FormField>
  </section>
</template>
