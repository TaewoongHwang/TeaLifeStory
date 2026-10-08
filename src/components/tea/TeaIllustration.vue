<script setup>
const base = import.meta.env.BASE_URL
</script>
<template>
  <img class="tea-illustration" :src="`${base}images/chagok-tea-hero.webp`" :srcset="`${base}images/chagok-tea-hero-small.webp 600w, ${base}images/chagok-tea-hero.webp 960w`" sizes="(max-width: 599px) and (max-height: 740px) 198px, 280px" alt="자사호와 찻잔, 차가 담긴 공도배가 놓인 차 자리" width="960" height="640" decoding="async" fetchpriority="high" />
</template>
