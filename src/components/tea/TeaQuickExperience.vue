<script setup>
import FormField from '../common/FormField.vue'
import TeaRating from './TeaRating.vue'
const experience = defineModel({ type: Object, required: true })
defineProps({ expanded: Boolean })
</script>
<template>
  <section class="form-section quick-experience" aria-label="평점과 감상">
    <div class="field"><span class="field-label">오늘의 평점 <small class="muted">선택 사항</small></span><TeaRating v-model="experience.rating" /></div>
    <FormField v-slot="{ id }" label="한 줄 감상" hint="선택 사항 · 길게 적어도, 비워 두어도 좋아요."><textarea :id="id" v-model="experience.feeling" :rows="expanded ? 6 : 2" class="lined-textarea" placeholder="오늘의 차는 어땠나요?" maxlength="10000" /></FormField>
  </section>
</template>
