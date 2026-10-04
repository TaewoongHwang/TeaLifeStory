<script setup>
import { useRoute } from 'vue-router'
import AppIcon from './common/AppIcon.vue'
const route = useRoute()
const links = [
  { to: '/', icon: 'home', label: '홈' },
  { to: '/entries', icon: 'book', label: '기록' },
  { to: '/entries/new', icon: 'plus', label: '새 기록', add: true },
  { to: '/stats', icon: 'chart', label: '통계' },
  { to: '/settings', icon: 'settings', label: '설정' },
]
const active = (link) => link.to === '/' ? route.path === '/' : link.to === '/entries' ? route.path.startsWith('/entries') && route.path !== '/entries/new' : route.path === link.to
</script>
<template>
  <nav class="bottom-nav" aria-label="주 메뉴">
    <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="{ active: active(link), 'nav-add': link.add }" :aria-label="link.label" :aria-current="active(link) ? 'page' : undefined">
      <span class="nav-icon"><AppIcon :name="link.icon" /></span><span>{{ link.add ? '기록하기' : link.label }}</span>
    </RouterLink>
  </nav>
</template>
