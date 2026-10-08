import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEntry } from '../src/utils/entry.js'
import { buildTeaStats } from '../src/utils/stats.js'

function entry(id, date, rating = 0, category = '', favorite = false, time = '') {
  const value = createEntry()
  value.id = id
  value.tea.name = id
  value.tea.category = category
  value.context.date = date
  value.context.time = time
  value.experience.rating = rating
  value.favorite = favorite
  return value
}

test('monthly stats count recorded days and favorites while excluding optional ratings and undated entries', () => {
  const entries = [
    entry('first', '2026-10-01', 5, '녹차', true),
    entry('second', '2026-10-01', 3, '녹차'),
    entry('unrated', '2026-10-02'),
    entry('previous', '2026-09-30', 1, '홍차', true),
    entry('undated', '', 5, '홍차', true),
  ]
  const stats = buildTeaStats(entries, '2026-10')
  assert.equal(stats.count, 3)
  assert.equal(stats.average, '4.0')
  assert.equal(stats.ratedCount, 2)
  assert.equal(stats.days, 2)
  assert.equal(stats.favoriteCount, 1)
  assert.equal(stats.undatedCount, 1)
  const unrated = buildTeaStats([entries[2]], '2026-10')
  assert.equal(unrated.average, '—')
  assert.equal(unrated.categories[0].average, '—')
  assert.equal(unrated.ratedCount, 0)
})

test('categories separate recording frequency from ratings, normalize whitespace and sort tied names', () => {
  const entries = [
    entry('red-one', '2026-10-01', 4, '홍차'),
    entry('red-two', '2026-10-02', 2, '홍차'),
    entry('green-one', '2026-10-01', 5, ' 녹차 '),
    entry('green-unrated', '2026-10-02', 0, '녹차'),
    entry('no-category', '2026-10-03', 5, '  '),
  ]
  assert.deepEqual(buildTeaStats(entries, '2026-10').categories, [
    { name: '녹차', count: 2, ratedCount: 1, average: '5.0', share: 40 },
    { name: '홍차', count: 2, ratedCount: 2, average: '3.0', share: 40 },
    { name: '미분류', count: 1, ratedCount: 1, average: '5.0', share: 20 },
  ])
  assert.deepEqual(buildTeaStats([...entries].reverse(), '2026-10').categories, buildTeaStats(entries, '2026-10').categories)
})

test('six-month trend includes zero months and crosses a January year boundary', () => {
  const entries = [
    entry('before-window', '2025-07-31'),
    entry('august', '2025-08-01'),
    entry('december', '2025-12-31'),
    entry('january-one', '2026-01-01'),
    entry('january-two', '2026-01-31'),
    entry('after-window', '2026-02-01'),
    entry('undated', ''),
  ]
  assert.deepEqual(buildTeaStats(entries, '2026-01').trend, [
    { month: '2025-08', label: '8월', count: 1 },
    { month: '2025-09', label: '9월', count: 0 },
    { month: '2025-10', label: '10월', count: 0 },
    { month: '2025-11', label: '11월', count: 0 },
    { month: '2025-12', label: '12월', count: 1 },
    { month: '2026-01', label: '1월', count: 2 },
  ])
})

test('trend supports the first calendar year, early years, leap dates and the maximum year', () => {
  assert.deepEqual(buildTeaStats([entry('first-year', '0001-01-01')], '0001-01').trend, [
    { month: '0001-01', label: '1월', count: 1 },
  ])
  const early = buildTeaStats([entry('early', '0099-01-01')], '0099-01')
  assert.equal(early.trend[0].month, '0098-08')
  assert.deepEqual(early.trend.at(-1), { month: '0099-01', label: '1월', count: 1 })
  const leap = buildTeaStats([entry('leap', '2024-02-29'), entry('february', '2024-02-01')], '2024-02')
  assert.equal(leap.count, 2)
  assert.equal(leap.days, 2)
  assert.deepEqual(leap.trend.at(-1), { month: '2024-02', label: '2월', count: 2 })
  const maximum = buildTeaStats([], '9999-12')
  assert.equal(maximum.trend[0].month, '9999-07')
  assert.equal(maximum.trend.at(-1).month, '9999-12')
})

test('highlights prioritize favorites then rating, record time and stable IDs without filling with unrelated entries', () => {
  const favorites = [
    entry('favorite-low', '2026-10-31', 0, '', true),
    entry('favorite-b', '2026-10-03', 5, '', true, '12:00'),
    entry('favorite-earlier', '2026-10-03', 5, '', true, '11:00'),
    entry('favorite-a', '2026-10-03', 5, '', true, '12:00'),
  ]
  const rated = [
    entry('good', '2026-10-30', 4),
    entry('great-earlier', '2026-10-20', 5),
    entry('great-later', '2026-10-21', 5),
    entry('ordinary', '2026-10-31', 3),
    entry('other-month', '2026-09-01', 5, '', true),
  ]
  assert.deepEqual(buildTeaStats([...rated, ...favorites], '2026-10').highlights.map((value) => value.id), [
    'favorite-a', 'favorite-b', 'favorite-earlier',
  ])
  assert.deepEqual(buildTeaStats([favorites[0], ...rated], '2026-10').highlights.map((value) => value.id), [
    'favorite-low', 'great-later', 'great-earlier',
  ])
  assert.deepEqual(buildTeaStats([rated[0], rated[3]], '2026-10').highlights, [rated[0]])
  assert.deepEqual(buildTeaStats([rated[3]], '2026-10').highlights, [])
})

test('blank or invalid months stay empty and aggregation preserves input arrays and original record references', () => {
  const entries = [entry('great', '2026-10-01', 5, ' 녹차 '), entry('undated', '')]
  const before = structuredClone(entries)
  for (const value of entries) {
    Object.freeze(value.tea)
    Object.freeze(value.context)
    Object.freeze(value.experience)
    Object.freeze(value)
  }
  Object.freeze(entries)
  for (const month of ['', '2026-00', '2026-13', '0000-01', '10000-01', '26-10', '2026-1', '2026-10-01', ' 2026-10', '2026-10\n', null, undefined]) {
    assert.deepEqual(buildTeaStats(entries, month), {
      count: 0, average: '—', ratedCount: 0, days: 0, favoriteCount: 0, undatedCount: 1,
      categories: [], trend: [], highlights: [],
    })
  }
  const stats = buildTeaStats(entries, '2026-10')
  assert.equal(stats.highlights[0], entries[0])
  assert.deepEqual(entries, before)
})
