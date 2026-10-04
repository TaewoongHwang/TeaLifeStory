<script setup>
import FormField from '../common/FormField.vue'
const context = defineModel({ type: Object, required: true })
</script>
<template>
  <section class="form-section"><div class="section-label"><span>03</span><h2>오늘의 차 <small>THE MOMENT</small></h2></div>
    <div class="field-grid"><FormField v-slot="{ id }" label="날짜 · When"><input :id="id" v-model="context.date" type="date" min="0001-01-01" max="9999-12-31" /></FormField><FormField v-slot="{ id }" label="시간"><input :id="id" v-model="context.time" type="time" /></FormField></div>
    <FormField v-slot="{ id }" label="장소 · Where"><input :id="id" v-model="context.location" placeholder="햇살이 드는 창가, 익숙한 찻집…" maxlength="10000" /></FormField>
    <FormField v-slot="{ id }" label="함께한 사람 · Who"><input :id="id" v-model="context.people" placeholder="혼자, 혹은 함께한 누군가" maxlength="10000" /></FormField>
    <FormField v-slot="{ id }" label="오늘 이 차를 마신 이유 · Why"><textarea :id="id" v-model="context.reason" rows="2" placeholder="잠시 쉬어가고 싶어서" maxlength="10000" /></FormField>
  </section>
</template>
