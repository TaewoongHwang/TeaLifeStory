<script setup>
const mark = `${import.meta.env.BASE_URL}icons/chagok-icon-192.png`
</script>
<template>
  <header class="app-header">
    <RouterLink to="/" class="brand"><span class="brand-mark" aria-hidden="true"><img :src="mark" class="brand-mark-image" alt="" aria-hidden="true" width="44" height="44" /></span><span>차곡차곡</span></RouterLink>
    <span class="header-note">Tea Cellar 햇살차방</span>
  </header>
</template>
