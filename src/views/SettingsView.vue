<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.js'
import { useEntryStore } from '../stores/entryStore.js'
import { useAppStore } from '../stores/appStore.js'
import { MAX_BACKUP_SIZE, validateBackup } from '../db/backup.js'
import { localDate } from '../utils/entry.js'
import { entriesToCsv } from '../utils/csv.js'
import { optionStores } from '../config/defaults.js'
import OptionManager from '../components/OptionManager.vue'
import InstallGuide from '../components/InstallGuide.vue'
import AppIcon from '../components/common/AppIcon.vue'
import BaseModal from '../components/common/BaseModal.vue'
const settings = useSettingsStore()
const entries = useEntryStore()
const app = useAppStore()
const busy = ref(false)
const backup = ref(null)
const fileName = ref('')
const mode = ref('merge')
const error = ref('')
const csvError = ref('')
const dev = import.meta.env.DEV
function downloadFile(blob, name) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name
  try { document.body.append(link); link.click() }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
async function exportData() {
  busy.value = true
  error.value = ''
  try {
    const data = await settings.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadFile(blob, `tea-life-story-${localDate()}.json`)
    app.notify('백업 파일을 내보냈어요. 안전한 곳에 보관해 주세요.')
  } catch { error.value = '백업 파일을 만들지 못했습니다. 다시 시도해 주세요.' }
  finally { busy.value = false }
}
async function exportCsv() {
  busy.value = true
  csvError.value = ''
  try {
    await entries.load()
    const blob = new Blob([entriesToCsv(entries.entries)], { type: 'text/csv;charset=utf-8' })
    downloadFile(blob, `tea-life-story-records-${localDate()}.csv`)
    app.notify('차 기록을 CSV로 내보냈어요. 엑셀 등에서 표로 펼쳐 보세요.')
  } catch { csvError.value = 'CSV 파일을 만들지 못했습니다. 다시 시도해 주세요. 기존 기록은 유지됩니다.' }
  finally { busy.value = false }
}
async function selectBackup(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  busy.value = true
  error.value = ''
  try {
    if (file.size > MAX_BACKUP_SIZE) throw new Error('백업은 30MB 이하의 JSON 파일만 가져올 수 있습니다.')
    backup.value = validateBackup(JSON.parse(await file.text()))
    fileName.value = file.name
  } catch { error.value = '백업을 읽을 수 없습니다. 30MB 이하의 차곡차곡 JSON 백업 파일인지 확인해 주세요. 기존 데이터는 유지됩니다.' }
  finally { busy.value = false }
}
async function restore() {
  busy.value = true
  error.value = ''
  try { await settings.importData(backup.value, mode.value); await entries.load(); backup.value = null; app.notify('백업에서 차 일기를 복원했어요.') }
  catch { error.value = '복원하지 못했습니다. 파일과 저장 공간을 확인해 주세요.' }
  finally { busy.value = false }
}
async function addSamples() {
  if (!dev) return
  busy.value = true
  try { const { createSamples } = await import('../config/samples.js'); for (const entry of createSamples()) await entries.save(entry); app.notify('개발용 샘플 3개를 추가했어요.') }
  catch { error.value = '샘플을 저장하지 못했습니다.' }
  finally { busy.value = false }
}
</script>
<template>
  <div><div class="page-eyebrow">MAKE IT YOUR OWN</div><div class="page-title"><h1>나의 일기장 설정</h1><p>나의 취향을 담고, 차 이야기를 오래 간직해요.</p></div>
    <section class="panel"><div class="section-heading"><h2>기록을 오래 간직하기 <small>KEEP YOUR STORIES</small></h2></div><p class="muted">소중한 기록과 사진은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우거나 기기를 바꾸기 전에 백업해 주세요.</p><div class="backup-actions"><button type="button" class="button secondary" :disabled="busy" @click="exportData"><AppIcon name="download" />전체 데이터 내보내기</button><label class="button secondary" :class="{ disabled: busy }" for="backup-file"><AppIcon name="upload" />데이터 가져오기</label><input id="backup-file" class="file-input" type="file" accept=".json,application/json" :disabled="busy" @change="selectBackup" /></div><p class="small muted">JSON · 기록, 사진, 선택 목록, 작성 중 초안을 함께 백업합니다.</p><p v-if="error && !backup" role="alert" class="inline-error">{{ error }}</p></section>
    <section class="panel"><div class="section-heading"><h2>차 이야기를 표로 펼치기 <small>STORIES IN A TABLE</small></h2></div><p class="muted">저장한 차 기록을 CSV 파일로 내려받아 엑셀 등에서 읽고 정리할 수 있어요.</p><div class="backup-actions"><button type="button" class="button secondary" :disabled="busy" @click="exportCsv"><AppIcon name="download" />차 기록 CSV 내보내기</button></div><p class="small muted">CSV는 표로 보는 용도이며 다시 가져올 수 없습니다. 사진·설정·초안까지 보관하거나 복원하려면 위의 JSON 백업을 이용해 주세요.</p><p v-if="csvError" role="alert" class="inline-error">{{ csvError }}</p></section>
    <section class="panel"><div class="section-heading"><h2>나의 선택 목록 <small>YOUR PREFERENCES</small></h2></div><p class="muted">자주 마시는 차와 사용하는 도구를 더해 보세요. 이름 변경·삭제는 앞으로의 선택 목록에 적용되며 기존 일기의 내용은 유지됩니다.</p><OptionManager v-for="store in optionStores" :key="store" :store-name="store" /></section>
    <InstallGuide />
    <section v-if="dev" class="panel"><h2>개발 확인용 샘플</h2><p class="muted">샘플 표시가 있는 기록 3개를 추가합니다. 실제 기록과 함께 통계에 포함되며 개별 삭제할 수 있습니다. 배포 버전에는 이 기능이 없습니다.</p><button class="button secondary" :disabled="busy" @click="addSamples">샘플 기록 3개 추가</button></section>
    <div class="settings-footer"><span>차곡차곡</span><p>한 잔의 차, 나만의 이야기.</p><small>VERSION 0.1.0 · LOCAL FIRST</small></div>
    <BaseModal v-if="backup" title="백업을 가져올까요?" @close="!busy && (backup = null)"><p class="preserve-lines">{{ fileName }}<br />차 기록 {{ backup.data.entries.length }}개 · 현재 기록 {{ entries.entries.length }}개</p><fieldset class="restore-options" :disabled="busy"><legend>복원 방식</legend><label><input v-model="mode" type="radio" value="merge" />병합 <small>기존 기록 유지. 같은 ID는 더 최근에 수정된 기록을 사용합니다.</small></label><label><input v-model="mode" type="radio" value="replace" />전체 교체 <small>현재 기록, 설정, 초안을 모두 지우고 백업 내용으로 교체합니다.</small></label></fieldset><p v-if="mode === 'replace'" class="inline-error">전체 교체는 되돌릴 수 없습니다. 현재 데이터를 먼저 내보내는 것을 권장합니다.</p><p v-if="error" role="alert" class="inline-error">{{ error }}</p><div class="modal-actions"><button class="button secondary" :disabled="busy" @click="backup = null">취소</button><button class="button" :class="mode === 'replace' ? 'danger' : 'primary'" :disabled="busy" @click="restore">{{ busy ? '복원 중…' : mode === 'replace' ? '전체 교체하기' : '병합하기' }}</button></div></BaseModal>
  </div>
</template>
