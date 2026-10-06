<script setup>
import FormField from '../common/FormField.vue'
const context = defineModel({ type: Object, required: true })
</script>
<template>
  <section class="form-section"><div class="section-label"><span>03</span><h2>그날의 순간 <small>THE MOMENT</small></h2></div>
    <p class="section-prompt">차 한 잔이 머문 곳과 함께한 사람을 떠올려 보세요.</p>
    <div class="field-grid"><FormField v-slot="{ id }" label="날짜 · When"><input :id="id" v-model="context.date" type="date" min="0001-01-01" max="9999-12-31" /></FormField><FormField v-slot="{ id }" label="시간"><input :id="id" v-model="context.time" type="time" /></FormField></div>
    <FormField v-slot="{ id }" label="장소 · Where"><input :id="id" v-model="context.location" placeholder="햇살이 드는 창가, 익숙한 찻집…" maxlength="10000" /></FormField>
    <FormField v-slot="{ id }" label="함께한 사람 · Who"><input :id="id" v-model="context.people" placeholder="혼자만의 시간, 또는 함께한 사람" maxlength="10000" /></FormField>
    <FormField v-slot="{ id }" label="오늘 이 차를 마신 이유 · Why"><textarea :id="id" v-model="context.reason" rows="3" class="lined-textarea" placeholder="잠시 쉬어 가고 싶어서, 반가운 사람과 이야기를 나누고 싶어서…" maxlength="10000" /></FormField>
  </section>
</template>
