<script setup>
import { onMounted, ref } from 'vue'
defineProps({ title: { type: String, required: true } })
defineEmits(['close'])
const dialog = ref(null)
onMounted(() => dialog.value.showModal())
</script>
<template>
  <dialog ref="dialog" class="modal" aria-labelledby="modal-title" @cancel.prevent="$emit('close')">
    <h2 id="modal-title">{{ title }}</h2>
    <slot />
  </dialog>
</template>
