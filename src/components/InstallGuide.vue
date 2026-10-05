<script setup>
import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/appStore.js'
import AppIcon from './common/AppIcon.vue'
const app = useAppStore()
const { installPrompt, installed } = storeToRefs(app)
</script>
<template><section class="panel install-panel"><span class="install-icon"><AppIcon name="leaf" /></span><div><h2>{{ installed ? '홈 화면의 차 일기장' : '차 일기를 늘 가까이' }}</h2><p>{{ installed ? '설치된 앱으로 사용 중입니다.' : '브라우저 메뉴의 앱 설치 또는 홈 화면에 추가를 선택하세요. iPhone은 Safari 공유 메뉴에서 추가할 수 있어요.' }}</p><button v-if="installPrompt && !installed" type="button" class="button secondary" @click="app.install">앱 설치</button></div></section></template>
