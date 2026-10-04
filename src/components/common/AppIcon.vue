<script setup>
defineProps({ name: { type: String, required: true } })
const paths = {
  leaf: 'M19 4C9 3 3 8 5 15s14 5 14-11Z M5 20 15 10',
  home: 'm3 10 9-7 9 7 M5 9v11h5v-6h4v6h5V9',
  book: 'M4 3h13a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V3Z M4 17h15 M8 7h7 M8 11h5',
  plus: 'M12 5v14 M5 12h14',
  chart: 'M4 20h16 M7 16v-4 M12 16V5 M17 16V9',
  settings: 'M5 6h14 M5 12h14 M5 18h14 M9 3v6 M15 9v6 M9 15v6',
  arrow: 'M5 12h14 m-5-5 5 5-5 5',
  back: 'M19 12H5 m5-5-5 5 5 5',
  search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z m5-2 6 6',
  cup: 'M4 9h13v5a6 6 0 0 1-12 0V9 M17 10h2a3 3 0 0 1 0 6h-3 M3 21h16 M8 3v3 M13 3v3',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 6v6l4 2',
  download: 'M12 3v12 m-4-4 4 4 4-4 M4 16v5h16v-5',
  upload: 'M12 15V3 m-4 4 4-4 4 4 M4 16v5h16v-5',
  image: 'M3 3h18v18H3V3Z m0 13 5-5 5 5 4-4 4 4 M15 7h.01',
  close: 'm6 6 12 12 M6 18 18 6',
  edit: 'm16 3 5 5-12 12-6 1 1-6L16 3Z m-2 2 5 5',
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.leaf" /></svg></template>
