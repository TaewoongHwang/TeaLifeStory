<script setup>
import { ref } from 'vue'
import FormField from '../common/FormField.vue'
import AppIcon from '../common/AppIcon.vue'
import { processPhoto } from '../../utils/photos.js'
const entry = defineModel({ type: Object, required: true })
const emit = defineEmits(['busy'])
const error = ref('')
const busy = ref(false)
const tags = ref(entry.value.tags.join(', '))
function updateTags(value) {
  tags.value = value
  entry.value.tags = [...new Set(value.split(',').map((tag) => tag.trim().replace(/^#/, '').trim().slice(0, 100)).filter(Boolean))].slice(0, 30)
}
async function addPhotos(event) {
  error.value = ''
  const files = [...event.target.files]
  if (files.length + entry.value.photos.length > 6) { error.value = '사진은 최대 6장까지 담을 수 있어요.'; event.target.value = ''; return }
  busy.value = true
  emit('busy', true)
  try { for (const file of files) entry.value.photos.push(await processPhoto(file)) }
  catch (issue) { error.value = issue.message }
  finally { busy.value = false; emit('busy', false); event.target.value = '' }
}
</script>
<template>
  <section class="form-section"><div class="section-label"><span>05</span><h2>조금 더 <small>EXTRA NOTES</small></h2></div>
    <FormField v-slot="{ id }" label="사진" hint="최대 6장 · JPG, PNG, WebP · 한 장당 15MB 이하. 저장할 때 크기를 줄입니다."><label class="photo-upload" :for="id"><AppIcon name="image" /><span>{{ busy ? '사진을 담고 있어요…' : '한 잔의 순간을 사진으로 담아 보세요' }}</span></label><input :id="id" class="file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="busy" @change="addPhotos" /></FormField>
    <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
    <div v-if="entry.photos.length" class="photo-grid"><figure v-for="photo in entry.photos" :key="photo.id"><img :src="photo.data" :alt="photo.name" /><button type="button" :aria-label="`${photo.name} 사진 삭제`" @click="entry.photos = entry.photos.filter((item) => item.id !== photo.id)"><AppIcon name="close" /></button></figure></div>
    <FormField v-slot="{ id }" label="태그" hint="쉼표로 구분해 주세요. 최대 30개."><input :id="id" :value="tags" placeholder="아침, 혼자, 편안함" maxlength="3000" @input="updateTags($event.target.value)" @change="tags = entry.tags.join(', ')" /></FormField>
    <FormField v-slot="{ id }" label="메모"><textarea :id="id" v-model="entry.experience.notes" rows="4" class="lined-textarea" placeholder="차의 산지나 구입처, 다음 잔을 위해 기억해 둘 것들…" maxlength="10000" /></FormField>
    <label class="checkbox-field"><input v-model="entry.favorite" type="checkbox" /><span>즐겨찾기에 담기<small class="muted">다시 펼쳐 보고 싶은 한 잔을 모아 두세요.</small></span></label>
  </section>
</template>
