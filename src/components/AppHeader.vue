<script setup>
const mark = `${import.meta.env.BASE_URL}icons/chagok-icon-192.png`
</script>
<template>
  <header class="app-header">
    <RouterLink to="/" class="brand"><span class="brand-mark" aria-hidden="true"><img :src="mark" class="brand-mark-image" alt="" aria-hidden="true" width="44" height="44" /></span><span>차곡차곡<small>나의 차 일기</small></span></RouterLink>
    <span class="header-note">차 한 잔의 여유.</span>
  </header>
</template>
