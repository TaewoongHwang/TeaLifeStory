<script setup>
import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/appStore.js'
import AppIcon from './common/AppIcon.vue'
const app = useAppStore()
const { installPrompt, installed } = storeToRefs(app)
</script>
<template><section class="panel install-panel"><span class="install-icon"><AppIcon name="teapot" /></span><div><h2>{{ installed ? '홈 화면의 차 일기장' : '차 일기를 늘 가까이' }}</h2><p>{{ installed ? '한 잔의 이야기를 홈 화면에서 바로 펼칠 수 있어요.' : '브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택해 주세요. iPhone에서는 Safari의 공유 메뉴에서 추가할 수 있어요.' }}</p><button v-if="installPrompt && !installed" type="button" class="button secondary" @click="app.install">앱 설치</button></div></section></template>
