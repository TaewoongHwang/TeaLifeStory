<script setup>
import { useRoute } from 'vue-router'
import AppIcon from './common/AppIcon.vue'
const route = useRoute()
const links = [
  { to: '/', icon: 'book', label: '기록' },
  { to: '/entries/new', icon: 'plus', label: '새 기록', add: true },
  { to: '/settings', icon: 'settings', label: '설정' },
]
const active = (link) => link.to === '/' ? route.path === '/' || (route.path.startsWith('/entries') && route.path !== '/entries/new') : link.to === '/settings' ? route.path === '/settings' || route.path === '/stats' : route.path === link.to
</script>
<template>
  <nav class="bottom-nav" aria-label="주 메뉴">
    <RouterLink v-for="link in links" :key="link.to" :to="link.to" :class="{ active: active(link), 'nav-add': link.add }" :aria-label="link.label" :aria-current="active(link) ? 'page' : undefined">
      <span class="nav-icon"><AppIcon :name="link.icon" /></span><span>{{ link.add ? '기록하기' : link.label }}</span>
    </RouterLink>
  </nav>
</template>
