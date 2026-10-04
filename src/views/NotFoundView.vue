<script setup>
import EmptyState from '../components/common/EmptyState.vue'
</script>
<template><div><EmptyState title="이 페이지는 찾을 수 없어요" description="일기장으로 돌아가 차 이야기를 이어가세요." :action="false" /><RouterLink to="/" class="button secondary">홈으로</RouterLink></div></template>
