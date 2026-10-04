import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

export default createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/entries', component: () => import('../views/EntryListView.vue') },
    { path: '/entries/new', component: () => import('../views/EntryFormView.vue') },
    { path: '/entries/:id', component: () => import('../views/EntryDetailView.vue') },
    { path: '/entries/:id/edit', component: () => import('../views/EntryFormView.vue') },
    { path: '/stats', component: () => import('../views/StatsView.vue') },
    { path: '/settings', component: () => import('../views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
