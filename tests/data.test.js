import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { getDB, storeNames } from '../src/db/index.js'
import { listEntries, putEntry, removeEntry } from '../src/db/entries.js'
import { importBackup, exportBackup, validateBackup, validateEntry } from '../src/db/backup.js'
import { setSetting, getSetting } from '../src/db/settings.js'
import { useEntryStore } from '../src/stores/entryStore.js'
import { defaults } from '../src/config/defaults.js'
import { normalizeBase } from '../src/config/base.js'
import { createEntry, filterEntries, summarize, localDate, normalizeEntry } from '../src/utils/entry.js'

function entry(name, date = '2026-10-04', rating = 0) {
  const value = createEntry()
  value.tea.name = name
  value.context.date = date
  value.experience.rating = rating
  return value
}
test('Pages root and repository paths normalize repeated trailing slashes', () => {
  for (const value of ['', '/', '//', '///']) assert.equal(normalizeBase(value), '/')
  for (const value of ['tea-life-story', '/tea-life-story/', '/tea-life-story//']) assert.equal(normalizeBase(value), '/tea-life-story/')
})
async function clear() {
  const db = await getDB()
  const transaction = db.transaction(storeNames, 'readwrite')
  await Promise.all(storeNames.map((store) => transaction.objectStore(store).clear()))
  await transaction.done
}

test('initial database seeds configurable options once, with no sample entries', async () => {
  const db = await getDB()
  assert.equal((await listEntries()).length, 0)
  assert.equal((await db.getAll('categories')).length, defaults.categories.length)
  assert.equal((await db.getAll('tools')).length, defaults.tools.length)
  assert.equal((await db.getAll('materials')).length, defaults.materials.length)
})

test('CRUD preserves optional fields and photo data; replace restores all stores including draft', async () => {
  await clear()
  const value = entry('차 이름만')
  value.photos = [{ id: 'photo-1', name: 'cup.png', data: 'data:image/png;base64,iVBORw0KGgo=' }]
  await putEntry(value)
  assert.deepEqual((await listEntries())[0], value)
  value.experience.feeling = '수정한 내용'
  await putEntry(value)
  await setSetting('draft', createEntry())
  const backup = await exportBackup()
  await removeEntry(value.id)
  assert.equal((await listEntries()).length, 0)
  await importBackup(backup, 'replace')
  assert.deepEqual(await exportBackup().then((result) => result.data), backup.data)
})

test('malformed backup is rejected before replacing existing data', async () => {
  const backup = await exportBackup()
  const before = structuredClone(backup.data)
  backup.data.entries[0].experience.rating = 6
  await assert.rejects(importBackup(backup, 'replace'))
  assert.deepEqual((await exportBackup()).data, before)
})

test('backup restores unfinished numeric drafts while final entries still reject invalid numbers', async () => {
  const draft = createEntry()
  draft.tea.amount = -1
  draft.brewing.volume = 100001
  draft.brewing.waterTemperature = 120
  draft.brewing.steepTime = -5
  await setSetting('draft', draft)
  const backup = await exportBackup()
  await importBackup(backup, 'replace')
  assert.deepEqual(await getSetting('draft'), draft)
  draft.tea.name = '완료 전 초안'
  assert.throws(() => validateEntry(draft))
  for (const invalid of ['120', Infinity, NaN, {}, true]) {
    const malformed = structuredClone(draft)
    malformed.brewing.waterTemperature = invalid
    assert.throws(() => validateEntry(malformed, true))
  }
  await setSetting('draft', createEntry())
})

test('backup validates dates, duplicate IDs, types, units, unsafe photo URLs and unknown settings', async () => {
  const valid = await exportBackup()
  for (const mutate of [
    (backup) => { backup.data.entries[0].context.date = '2026-02-30' },
    (backup) => { backup.data.entries[0].tea.amount = '5' },
    (backup) => { backup.data.entries[0].brewing.volumeUnit = 'ml' },
    (backup) => { backup.data.entries[0].photos[0].data = 'javascript:alert(1)' },
    (backup) => { backup.data.entries[0].photos[0].data = 'data:image/svg+xml;base64,AAAA' },
    (backup) => { backup.data.entries.push(backup.data.entries[0]) },
    (backup) => { backup.data.settings.push({ key: 'unknown', value: {} }) },
    (backup) => { backup.version = 2 },
  ]) {
    const malformed = structuredClone(valid)
    mutate(malformed)
    assert.throws(() => validateBackup(malformed))
  }
})

test('a write failure during replace rolls back cleared stores and partial writes', async () => {
  const backup = await exportBackup()
  const before = structuredClone(backup.data)
  backup.data.entries.push(entry('追加'))
  const original = IDBObjectStore.prototype.put
  let writes = 0
  IDBObjectStore.prototype.put = function (...args) {
    if (this.name === 'entries' && ++writes === 2) throw new DOMException('Storage full', 'QuotaExceededError')
    return original.apply(this, args)
  }
  try { await assert.rejects(importBackup(backup, 'replace')) }
  finally { IDBObjectStore.prototype.put = original }
  assert.deepEqual((await exportBackup()).data, before)
})

test('merge keeps newest same-ID entry and existing draft; inserts new records', async () => {
  const backup = await exportBackup()
  const current = backup.data.entries[0]
  const older = structuredClone(current)
  older.updatedAt = '2020-01-01T00:00:00.000Z'
  older.tea.name = '오래된 이름'
  backup.data.entries = [older, entry('새로운 차')]
  backup.data.settings[0].value.tea.name = '덮어쓰지 않을 초안'
  await importBackup(backup, 'merge')
  let values = await listEntries()
  assert.equal(values.length, 2)
  assert.equal(values.find((value) => value.id === current.id).tea.name, current.tea.name)
  assert.notEqual(await (await getDB()).get('settings', 'draft').then((value) => value.value.tea.name), '덮어쓰지 않을 초안')
  older.updatedAt = '2090-01-01T00:00:00.000Z'
  older.tea.name = '최근 이름'
  backup.data.entries = [older]
  await importBackup(backup, 'merge')
  values = await listEntries()
  assert.equal(values.find((value) => value.id === current.id).tea.name, '최근 이름')
})

test('search, range and rating filters work; stats ignore unrated records', () => {
  const entries = [entry('녹차', '2026-10-01', 5), entry('홍차', '2026-10-03', 0), entry('보이차', '2026-09-01', 4)]
  entries[0].tea.category = '녹차'; entries[1].tea.category = '홍차'
  entries[0].tags = ['아침']; entries[1].experience.notes = '고소한 느낌'
  assert.equal(filterEntries(entries, { search: '아침' })[0].tea.name, '녹차')
  assert.equal(filterEntries(entries, { search: '고소한' })[0].tea.name, '홍차')
  assert.equal(filterEntries(entries, { rating: '0' }).length, 1)
  assert.equal(filterEntries(entries, { from: '2026-10-01', to: '2026-10-02' }).length, 1)
  assert.equal(filterEntries(entries, { sort: 'rating' })[0].tea.name, '녹차')
  assert.equal(filterEntries(entries, { sort: 'oldest' })[0].tea.name, '보이차')
  assert.equal(summarize(entries, '2026-10').count, 2)
  assert.equal(summarize(entries, '2026-10').average, '5.0')
  assert.equal(localDate(new Date(2026, 9, 4, 0, 5)), '2026-10-04')
  const blank = entry('선택 사항'); blank.tea.amount = ''; blank.brewing.volume = ''
  assert.equal(normalizeEntry(blank).tea.amount, null)
})

test('legacy records, drafts and v1 backups get additive defaults without mutating raw records', async () => {
  await clear()
  const legacy = entry('이전 버전의 차')
  legacy.photos = [{ id: 'photo-old', name: 'old.png', data: 'data:image/png;base64,iVBORw0KGgo=' }]
  delete legacy.brewing.waterTemperature
  delete legacy.brewing.steepTime
  delete legacy.favorite
  const db = await getDB()
  await db.put('entries', legacy)
  await setSetting('draft', legacy)
  const loaded = (await listEntries())[0]
  assert.equal(loaded.brewing.waterTemperature, null)
  assert.equal(loaded.brewing.steepTime, null)
  assert.equal(loaded.favorite, false)
  assert.deepEqual(loaded.photos, legacy.photos)
  assert.equal(loaded.updatedAt, legacy.updatedAt)
  assert.deepEqual(await db.get('entries', legacy.id), legacy)
  assert.equal((await getSetting('draft')).favorite, false)
  assert.deepEqual((await db.get('settings', 'draft')).value, legacy)
  const backup = await exportBackup()
  assert.equal(backup.data.entries[0].favorite, false)
  assert.equal(backup.data.settings[0].value.brewing.steepTime, null)
  backup.data.entries = [legacy]
  backup.data.settings[0].value = legacy
  await importBackup(backup)
  assert.deepEqual((await listEntries())[0], loaded)
  const noPhotos = structuredClone(legacy)
  delete noPhotos.photos
  assert.deepEqual(validateEntry(noPhotos).photos, [])
})

test('invalid new fields are rejected before replacing existing records', async () => {
  const before = (await exportBackup()).data
  for (const [area, key, value] of [
    ['brewing', 'waterTemperature', 101], ['brewing', 'waterTemperature', -1],
    ['brewing', 'waterTemperature', '85'], ['brewing', 'waterTemperature', Infinity],
    ['brewing', 'steepTime', -1], ['brewing', 'steepTime', NaN],
    ['brewing', 'steepTime', '60'], ['root', 'favorite', 'true'], ['root', 'favorite', null],
  ]) {
    const backup = await exportBackup()
    const target = area === 'root' ? backup.data.entries[0] : backup.data.entries[0][area]
    target[key] = value
    await assert.rejects(importBackup(backup, 'replace'))
    assert.deepEqual((await exportBackup()).data, before)
  }
})

test('temperature, seconds and favorites round-trip through JSON; zero differs from empty', async () => {
  await clear()
  const value = entry('기억하고 싶은 차')
  value.brewing.waterTemperature = 85.5
  value.brewing.steepTime = 60
  value.favorite = true
  await putEntry(value)
  const backup = JSON.parse(JSON.stringify(await exportBackup()))
  await removeEntry(value.id)
  await importBackup(backup)
  assert.deepEqual((await listEntries())[0], value)
  const zero = structuredClone(value)
  zero.brewing.waterTemperature = 0
  zero.brewing.steepTime = 0
  assert.equal(validateEntry(zero).brewing.waterTemperature, 0)
  zero.brewing.waterTemperature = ''; zero.brewing.steepTime = ''
  assert.equal(validateEntry(zero).brewing.steepTime, null)
  const plain = entry('일반 차')
  assert.deepEqual(filterEntries([value, plain], { favoritesOnly: true }), [value])
})

test('favorite save failure keeps UI state and stored record intact', async () => {
  setActivePinia(createPinia())
  const store = useEntryStore()
  await store.load()
  const before = structuredClone((await listEntries())[0])
  const original = IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put = function (...args) {
    if (this.name === 'entries') throw new DOMException('Storage full', 'QuotaExceededError')
    return original.apply(this, args)
  }
  try { await assert.rejects(store.toggleFavorite(before.id)) }
  finally { IDBObjectStore.prototype.put = original }
  assert.deepEqual((await listEntries())[0], before)
  assert.equal(store.entries[0].favorite, before.favorite)
  await store.toggleFavorite(before.id)
  assert.equal(store.entries[0].favorite, !before.favorite)
  assert.equal((await listEntries())[0].favorite, !before.favorite)
})
