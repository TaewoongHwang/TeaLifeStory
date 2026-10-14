import test from 'node:test'
import assert from 'node:assert/strict'
import { createEntry, filterEntries } from '../src/utils/entry.js'
import { entrySearchSnippet } from '../src/utils/entrySearch.js'

function entry(name = '우전', date = '2026-10-12') {
  const value = createEntry()
  value.tea.name = name
  value.context.date = date
  value.context.time = '09:30'
  return value
}

test('search finds recorded descriptions, context, tea and teaware without indexing metadata or photos', () => {
  const value = entry()
  const fields = [
    ['tea', 'name'], ['tea', 'category'], ['brewing', 'tool'], ['brewing', 'material'],
    ['context', 'location'], ['context', 'people'], ['context', 'reason'],
    ['experience', 'body'], ['experience', 'aroma'], ['experience', 'taste'],
    ['experience', 'aftertaste'], ['experience', 'feeling'], ['experience', 'notes'],
  ]
  for (const [index, [group, field]] of fields.entries()) value[group][field] = `검색항목${index}끝`
  value.tags = ['새벽한잔']
  const before = structuredClone(value)
  for (const index of fields.keys()) assert.equal(filterEntries([value], { search: `검색항목${index}끝` }).length, 1)
  assert.equal(filterEntries([value], { search: '#새벽한잔' }).length, 1)
  assert.equal(filterEntries([value], { search: value.id }).length, 0)
  value.photos = [{ name: '비공개사진검색어', data: 'data:image/png;base64,첨부자료검색어' }]
  assert.equal(filterEntries([value], { search: '비공개사진검색어' }).length, 0)
  assert.equal(filterEntries([value], { search: '첨부자료검색어' }).length, 0)
  value.photos = []
  assert.deepEqual(value, before)
})

test('whitespace-separated words all match across fields; Korean composition and Latin case are normalized', () => {
  const value = entry('Ｃａｆｅ 녹차')
  value.experience.feeling = '고소한 향\n\t편안한 기분'
  value.context.location = '집'
  assert.equal(filterEntries([value], { search: '  CAFE\t녹차\n고소한   집 ' }).length, 1)
  assert.equal(filterEntries([value], { search: '녹차 고소한 없는단어' }).length, 0)
  assert.equal(filterEntries([value], { search: '고소한'.normalize('NFD') }).length, 1)
  assert.equal(filterEntries([value], { search: ' \n\t' }).length, 1)
  // A name ending in 1 must not match a different name merely because its date includes 1.
  assert.deepEqual(filterEntries([entry('검수 차 1'), entry('검수 차 2')], { search: '검수 차 1' }).map((item) => item.tea.name), ['검수 차 1'])
})

test('Korean and separated dates match exact components, complete times and years, with existing filters and sort', () => {
  const values = [entry('봄차', '2026-01-02'), entry('가을차', '2026-11-12'), entry('가을차', '2026-10-12'), entry('이전차', '2025-10-12'), entry('날짜 없는 차', '')]
  assert.equal(filterEntries(values, { search: '1월' })[0].tea.name, '봄차')
  assert.equal(filterEntries(values, { search: '1월' }).length, 1)
  assert.equal(filterEntries(values, { search: '2일' }).length, 1)
  for (const search of ['2026-10-12', '2026.10.12', '2026/10/12', '2026-10', '2026.10', '2026-1-2', '2026년10월12일', '2026년 10월 12일', '2026 10월 가을차']) {
    assert.equal(filterEntries(values, { search }).length, 1, search)
  }
  assert.equal(filterEntries(values, { search: '13월' }).length, 0)
  assert.equal(filterEntries(values, { search: '10월', from: '2026-10-01', to: '2026-10-31' }).length, 1)
  assert.equal(filterEntries(values, { search: '9:30' }).length, 5)
  assert.equal(filterEntries(values, { search: '10:30' }).length, 0)
  values[2].favorite = true; values[2].experience.rating = 5; values[2].tea.category = '녹차'
  assert.equal(filterEntries(values, { search: '10월 가을차', category: '녹차', favoritesOnly: true, rating: '5' }).length, 1)
  assert.deepEqual(filterEntries(values, { search: '10월', sort: 'oldest' }).map((item) => item.context.date), ['2025-10-12', '2026-10-12'])
})

test('display aliases and original category or tool names both find old records without rewriting them', () => {
  const value = entry()
  value.tea.category = '블렌딩차'; value.brewing.tool = '다관'
  const before = structuredClone(value)
  for (const search of ['블렌딩티 차관', '블렌딩차 다관', '다관 블렌딩티']) assert.equal(filterEntries([value], { search }).length, 1)
  assert.deepEqual(value, before)
})

test('snippets show the matching hidden field and long-note context; punctuation and markup are plain text', () => {
  const value = entry()
  value.tea.category = '녹차'; value.experience.feeling = '오늘은 편안했다'
  value.experience.notes = `${'첫 잔 이야기 '.repeat(100)}고소한 향 <script>기록</script> (a+b) 두 번째 잔도 좋았다`
  const before = structuredClone(value)
  const snippet = entrySearchSnippet(value, '녹차 고소한')
  assert.equal(snippet.label, '메모')
  assert.equal(snippet.parts.filter((part) => part.matched).map((part) => part.text).join(''), '고소한')
  assert.ok(snippet.parts.map((part) => part.text).join('').startsWith('…'))
  assert.ok(snippet.parts.map((part) => part.text).join('').includes('<script>기록</script>'))
  assert.equal(entrySearchSnippet(value, '(a+b)').parts.find((part) => part.matched).text, '(a+b)')
  assert.equal(entrySearchSnippet(value, '10월'), null)
  assert.equal(entrySearchSnippet(value, '녹차'), null)
  assert.equal(entrySearchSnippet(value, '편안했다').label, '감상')
  assert.deepEqual(value, before)
})
