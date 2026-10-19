<script setup>
const base = import.meta.env.BASE_URL
</script>
<template>
  <img class="tea-illustration" :src="`${base}images/chagok-tea-hero.webp`" :srcset="`${base}images/chagok-tea-hero-small.webp 600w, ${base}images/chagok-tea-hero.webp 960w`" sizes="(max-width: 599px) 180px, 285px" alt="수반 위의 자사호, 공도배와 보이차가 담긴 찻잔" width="960" height="640" decoding="async" fetchpriority="high" />
</template>
