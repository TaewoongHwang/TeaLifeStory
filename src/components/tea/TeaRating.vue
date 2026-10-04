<script setup>
defineProps({ modelValue: { type: Number, default: 0 }, readonly: Boolean })
defineEmits(['update:modelValue'])
</script>
<template>
  <span v-if="readonly" class="rating-display" :aria-label="modelValue ? `5점 중 ${modelValue}점` : '평점 미입력'"><span v-for="star in 5" :key="star" :class="{ filled: star <= modelValue }" aria-hidden="true">★</span></span>
  <div v-else class="rating-input" role="group" aria-label="차 평점">
    <button v-for="star in 5" :key="star" type="button" :class="{ filled: star <= modelValue }" :aria-label="`${star}점`" :aria-pressed="star === modelValue" @click="$emit('update:modelValue', star === modelValue ? 0 : star)">★</button>
    <button type="button" class="rating-clear" @click="$emit('update:modelValue', 0)">{{ modelValue ? `${modelValue}점 · 지우기` : '미입력' }}</button>
  </div>
</template>
