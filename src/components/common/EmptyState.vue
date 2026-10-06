<script setup>
import AppIcon from './AppIcon.vue'
defineProps({ title: { type: String, default: '아직 담긴 이야기가 없어요' }, description: { type: String, default: '오늘의 한 잔으로 첫 페이지를 채워 보세요.' }, action: { type: Boolean, default: true } })
</script>
<template><div class="empty-state"><span class="empty-icon"><AppIcon name="cup" /></span><h3>{{ title }}</h3><p>{{ description }}</p><RouterLink v-if="action" to="/entries/new" class="button secondary">첫 차 기록하기 <AppIcon name="arrow" /></RouterLink></div></template>
