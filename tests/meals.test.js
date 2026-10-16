import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDB } from 'idb'
import { createPinia, setActivePinia } from 'pinia'
import { getDB, storeNames } from '../src/db/index.js'
import { exportBackup, importBackup, validateBackup, validateEntry } from '../src/db/backup.js'
import { listEntries } from '../src/db/entries.js'
import { useEntryStore } from '../src/stores/entryStore.js'
import { useSettingsStore } from '../src/stores/settingsStore.js'
import { usePurchaseStore } from '../src/stores/purchaseStore.js'
import { createEntry, createMeal, filterEntries, summarize } from '../src/utils/entry.js'
import { createPurchase, findMealPatterns } from '../src/utils/meal.js'
import { buildTeaStats } from '../src/utils/stats.js'
import { entriesToCsv, mealsToCsv } from '../src/utils/csv.js'

function meal(name = '두부와 시금치') {
  const value = createMeal()
  value.meal.name = name
  value.context.date = '2026-10-10'; value.context.time = '12:00'
  return value
}
function food(name, purchase = null) { return { id: crypto.randomUUID(), name, group: '', preparation: '', purchase } }
function observation(time = '14:00', feelings = ['편안함']) { return { id: crypto.randomUUID(), date: '2026-10-10', time, feelings, notes: '' } }
async function clear() {
  const db = await getDB(), tx = db.transaction(storeNames, 'readwrite')
  await Promise.all(storeNames.map(name => tx.objectStore(name).clear())); await tx.done
  setActivePinia(createPinia())
}

test('v1 database upgrade adds purchases while preserving raw tea, draft, option IDs and photos', async () => {
  const legacy = createEntry(); legacy.tea.name = '기존 차'
  delete legacy.favorite; delete legacy.brewing.steepTime
  legacy.photos = [{ id: 'photo', name: '차.png', data: 'data:image/png;base64,AAAA' }]
  const old = await openDB('tea-life-story', 1, { upgrade(db) {
    for (const name of ['entries', 'categories', 'tools', 'materials', 'settings']) db.createObjectStore(name, { keyPath: name === 'settings' ? 'key' : 'id' })
  } })
  await old.put('entries', legacy); await old.put('settings', { key: 'draft', value: legacy }); await old.put('tools', { id: 'old-tool', name: '내 차구' }); old.close()
  const upgraded = await getDB()
  assert.equal(upgraded.version, 2)
  assert.deepEqual(await upgraded.get('entries', legacy.id), legacy)
  assert.deepEqual((await upgraded.get('settings', 'draft')).value, legacy)
  assert.deepEqual(await upgraded.getAll('purchases'), [])
  assert.equal((await upgraded.getAll('tools'))[0].id, 'old-tool')
  assert.equal((await listEntries())[0].favorite, false)
  assert.deepEqual(await upgraded.get('entries', legacy.id), legacy)
})
test('meal name alone saves; whitespace names, invalid meal fields and malformed observations are rejected without mutation', async () => {
  await clear()
  const store = useEntryStore(), value = meal()
  await store.save(value)
  assert.deepEqual((await listEntries())[0].meal, value.meal)
  const before = (await exportBackup()).data
  for (const mutate of [
    e => { e.meal.name = '  ' }, e => { e.kind = 'unknown' }, e => { e.meal.source = '예상하지 않은 구분' },
    e => { e.observations = [observation('11:59')] },
    e => { e.observations = [observation('14:00', ['편안함', '쓰림'])] },
    e => { e.observations = [observation('24:00')] },
    e => { e.observations = [{ ...observation(), date: '2026-02-30' }] },
    e => { const item = observation(); e.observations = [item, item] },
    e => { e.meal.ingredients = [food('두부', {})] },
    e => { e.photos = [{ id: 'bad', name: 'bad.svg', data: 'data:image/svg+xml;base64,AAAA' }] },
  ]) {
    const invalid = structuredClone(value); mutate(invalid)
    await assert.rejects(store.save(invalid))
    assert.deepEqual((await exportBackup()).data, before)
  }
  assert.deepEqual(validateEntry(value).observations, [])
})
test('tea and meal drafts have independent serialized save, resume and clear operations', async () => {
  await clear()
  const settings = useSettingsStore(), tea = createEntry(), value = meal()
  tea.tea.name = '차 초안'
  await Promise.all([settings.saveDraft(tea), settings.saveDraft(value)])
  assert.equal((await settings.getDraft()).tea.name, '차 초안')
  assert.equal((await settings.getDraft('meal')).meal.name, value.meal.name)
  await Promise.all([settings.saveDraft(value), settings.clearDraft('meal')])
  assert.equal(await settings.getDraft('meal'), undefined)
  assert.equal((await settings.getDraft()).tea.name, '차 초안')
  const data = await settings.exportData()
  assert.equal(data.version, 2)
})
test('purchase CRUD never changes meal snapshots; reuse, refresh and restore preserve original shop', async () => {
  await clear()
  const purchases = usePurchaseStore(), store = useEntryStore()
  const purchase = await purchases.save({ ...createPurchase(), name: '두부', product: '부침용', shop: '동네 마트', favorite: true })
  const first = meal(), second = meal('다음 끼니')
  first.meal.ingredients = [food('두부', structuredClone(purchase))]
  second.meal.ingredients = [food('두부', structuredClone(purchase))]
  await store.save(first); await store.save(second)
  await purchases.save({ ...purchase, shop: '바꾼 마트' })
  await purchases.remove(purchase.id)
  await store.load(); await purchases.load()
  assert.equal(purchases.purchases.length, 0)
  assert.ok(store.entries.every(e => e.meal.ingredients[0].purchase.shop === '동네 마트'))
  const backup = await exportBackup(); await clear(); await importBackup(backup)
  assert.deepEqual((await exportBackup()).data, backup.data)
})
test('atomic observation updates append on latest meal, support edit and delete, and preserve storage/UI after failure', async () => {
  await clear()
  const store = useEntryStore(), value = meal()
  await store.save(value)
  const first = observation(), second = observation('17:00', ['더부룩함'])
  await Promise.all([store.saveObservation(value.id, first), store.saveObservation(value.id, second)])
  assert.equal(store.entries[0].observations.length, 2)
  const staleForm = structuredClone(value)
  staleForm.meal.name = '수정한 한 끼'
  await store.save(staleForm)
  assert.equal(store.entries[0].observations.length, 2)
  assert.equal(store.entries[0].meal.name, '수정한 한 끼')
  staleForm.context.time = '19:00'
  await assert.rejects(store.save(staleForm), /식사 시각 이후/)
  assert.equal((await listEntries())[0].context.time, '12:00')
  await store.saveObservation(value.id, { ...first, notes: '두 시간 후' })
  assert.equal(store.entries[0].observations.find(e => e.id === first.id).notes, '두 시간 후')
  const before = (await exportBackup()).data, original = IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put = function (...args) {
    if (this.name === 'entries') throw new DOMException('Full', 'QuotaExceededError')
    return original.apply(this, args)
  }
  try { await assert.rejects(store.saveObservation(value.id, second, true)) }
  finally { IDBObjectStore.prototype.put = original }
  assert.equal(store.entries[0].observations.length, 2)
  assert.deepEqual((await exportBackup()).data, before)
  await store.saveObservation(value.id, second, true)
  assert.equal((await listEntries())[0].observations.length, 1)
})
test('v1 tea backup imports; v2 round-trips all stores and drafts; invalid v2 replacement and a late write failure preserve every store', async () => {
  await clear()
  const tea = createEntry(); tea.tea.name = '이전 백업'
  const v1 = { app: 'tea-life-story', version: 1, data: { entries: [tea], categories: [], tools: [], materials: [], settings: [{ key: 'draft', value: tea }] } }
  await importBackup(v1)
  assert.equal((await listEntries())[0].tea.name, '이전 백업')
  assert.deepEqual(validateBackup(v1).data.purchases, [])
  const invalidVersion = structuredClone(v1)
  invalidVersion.data.entries = [meal()]
  assert.throws(() => validateBackup(invalidVersion))
  const purchases = usePurchaseStore(), settings = useSettingsStore(), store = useEntryStore()
  await store.save(meal()); await settings.saveDraft(meal('밥 초안'))
  await purchases.save({ ...createPurchase(), name: '연근', shop: '시장' })
  const backup = await exportBackup(), before = structuredClone(backup.data)
  for (const mutate of [
    b => { delete b.data.purchases }, b => { b.data.purchases[0].name = '' },
    b => { b.data.settings.find(e => e.key === 'mealDraft').key = 'draft'; b.data.settings.shift() },
  ]) {
    const invalid = structuredClone(backup); mutate(invalid)
    await assert.rejects(importBackup(invalid)); assert.deepEqual((await exportBackup()).data, before)
  }
  const original = IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put = function (...args) { if (this.name === 'purchases') throw new DOMException('Full', 'QuotaExceededError'); return original.apply(this, args) }
  try { await assert.rejects(importBackup(backup, 'replace')) } finally { IDBObjectStore.prototype.put = original }
  assert.deepEqual((await exportBackup()).data, before)
  const newer = structuredClone(backup); newer.data.purchases[0].updatedAt = '2099-01-01T00:00:00Z'; newer.data.purchases[0].shop = '새 구매처'
  await importBackup(newer, 'merge')
  assert.equal((await exportBackup()).data.purchases[0].shop, '새 구매처')
})
test('meal search covers venue, actual ingredients, purchase notes and later feelings; tea stats and CSV stay separate', () => {
  const value = meal(), tea = createEntry(); tea.tea.name = '녹차'
  const purchase = { ...createPurchase(), name: '두부', shop: '동네 마트', notes: '단단한 식감' }
  value.meal.source = '외식'; value.meal.venue = '행복식당 강남점'; value.meal.ingredients = [food('두부', purchase)]
  value.observations = [{ ...observation(), notes: '두 시간 뒤 가벼웠다' }]
  value.experience.rating = 5; tea.context.date = '2026-10-10'
  const rows = [value, tea]
  assert.equal(filterEntries(rows, { search: '행복식당 단단한 편안함' }).length, 1)
  assert.equal(filterEntries(rows, { search: '10월 10일 가벼웠다', kind: 'meal' }).length, 1)
  assert.equal(filterEntries(rows, { kind: 'tea' }).length, 1)
  assert.equal(summarize(rows, '2026-10').count, 1)
  assert.deepEqual(buildTeaStats(rows, '2026-10'), buildTeaStats([tea], '2026-10'))
  assert.equal(entriesToCsv(rows), entriesToCsv([tea]))
  value.meal.name = '=SUM(1,2)'
  assert.match(mealsToCsv(rows), /"\t=SUM\(1,2\)"/)
  assert.match(mealsToCsv(rows), /행복식당 강남점/)
  assert.match(mealsToCsv(rows), /동네 마트/)
  assert.doesNotMatch(mealsToCsv(rows), /녹차/)
})
test('patterns use AND ingredient combinations and count meals, with missing and mixed observations distinct', () => {
  const comfortable = meal(), missing = meal(), mixed = meal(), other = meal()
  comfortable.meal.ingredients = [food('두부'), food('시금치')]; comfortable.observations = [observation(), observation('16:00')]
  missing.meal.ingredients = [food('두부'), food('시금치')]
  mixed.meal.ingredients = [food('두부'), food('시금치')]; mixed.observations = [observation(), observation('18:00', ['쓰림'])]
  other.meal.ingredients = [food('두부')]
  const before = structuredClone([comfortable, missing, mixed, other])
  const result = findMealPatterns(before, { ingredients: ['두부', '시금치'] })
  assert.equal(result.total, 3); assert.equal(result.comfortable, 1); assert.equal(result.discomfort, 1); assert.equal(result.missing, 1); assert.equal(result.observed, 2)
  assert.equal(findMealPatterns(before, { from: '2026-10-11' }).total, 0)
  assert.deepEqual(before, [comfortable, missing, mixed, other])
})
