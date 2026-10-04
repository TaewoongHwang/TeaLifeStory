<script setup>
import AppIcon from './common/AppIcon.vue'
</script>
<template>
  <header class="app-header">
    <RouterLink to="/" class="brand"><span class="brand-mark"><AppIcon name="leaf" /></span><span>Tea Life Story<small>나의 차 일기</small></span></RouterLink>
    <span class="header-note">한 잔, 한 페이지.</span>
  </header>
</template>
