import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEntry } from '../src/utils/entry.js'
import { entriesToCsv } from '../src/utils/csv.js'

// Read CSV independently so embedded commas, quotes and newlines must remain in one cell.
function readCsv(csv) {
  const rows = []
  let row = [], value = '', quoted = false
  const text = csv.replace(/^\uFEFF/, '')
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index++ }
      else quoted = !quoted
    } else if (!quoted && char === ',') {
      row.push(value); value = ''
    } else if (!quoted && char === '\r' && text[index + 1] === '\n') {
      row.push(value); rows.push(row); row = []; value = ''; index++
    } else value += char
  }
  assert.equal(quoted, false, 'all quoted cells must close')
  return rows
}

function record(name, date = '2026-10-06', time = '10:00') {
  const entry = createEntry()
  entry.tea.name = name
  entry.context.date = date
  entry.context.time = time
  return entry
}

test('CSV includes a Korean 26-column header, UTF-8 BOM and CRLF even with no records', () => {
  const csv = entriesToCsv([])
  assert.equal(csv.charCodeAt(0), 0xFEFF)
  assert.equal(Buffer.from(csv).subarray(0, 3).toString('hex'), 'efbbbf')
  assert.ok(csv.endsWith('\r\n'))
  const rows = readCsv(csv)
  assert.equal(rows.length, 1)
  assert.deepEqual(rows[0], ['기록 ID', '생성 시각', '수정 시각', '차 이름', '차 종류', '차 사용량(g)', '도구', '재질', '물 용량(cc)', '물 온도(°C)', '우림 시간(초)', '마신 날짜', '마신 시간', '장소', '함께한 사람', '마신 이유', '별점', '향', '맛', '바디감', '여운', '느낌', '메모', '태그', '즐겨찾기', '사진 수'])
})

test('CSV preserves complete diary fields, Korean, quotes and multiline text without photo contents', () => {
  const entry = record('보이차, "오래된 향"')
  entry.tea.category = '보이차'; entry.tea.amount = 5.5
  Object.assign(entry.brewing, { tool: '자사호', material: '자사', volume: 120, waterTemperature: 95, steepTime: 30 })
  Object.assign(entry.context, { location: '나무 탁자', people: '친구', reason: '비 오는 날\r\n잠깐 쉬기' })
  Object.assign(entry.experience, { rating: 5, aroma: '나무향', taste: '달큰함', body: '부드러움', aftertaste: '긴 여운', feeling: '편안함', notes: '첫 줄, "한 잔"\n둘째 줄' })
  entry.tags = ['비', '느린 오후']; entry.favorite = true
  entry.photos = [{ id: 'photo-1', name: 'private-name.jpg', data: 'data:image/jpeg;base64,PRIVATE' }]
  const csv = entriesToCsv([entry])
  const rows = readCsv(csv)
  assert.equal(rows.length, 2)
  assert.equal(rows[1].length, 26)
  assert.deepEqual(rows[1], [entry.id, entry.createdAt, entry.updatedAt, entry.tea.name, '보이차', '5.5', '자사호', '자사', '120', '95', '30', '2026-10-06', '10:00', '나무 탁자', '친구', entry.context.reason, '5', '나무향', '달큰함', '부드러움', '긴 여운', '편안함', entry.experience.notes, '비; 느린 오후', '예', '1'])
  assert.ok(csv.includes('"보이차, ""오래된 향"""'))
  assert.ok(!csv.includes('private-name.jpg'))
  assert.ok(!csv.includes('PRIVATE'))
})

test('CSV sorts a copy by drinking date and time; optional zero values stay distinct from empty', () => {
  const blank = record('이전 기록', '', '')
  delete blank.brewing.waterTemperature
  delete blank.brewing.steepTime
  delete blank.photos
  delete blank.favorite
  const morning = record('아침의 차', '2026-10-06', '09:00')
  Object.assign(morning.brewing, { volume: 0, waterTemperature: 0, steepTime: 0 })
  morning.tea.amount = 0
  const evening = record('저녁의 차', '2026-10-06', '20:00')
  const nextDay = record('다음 날', '2026-10-07', '')
  const entries = [blank, morning, evening, nextDay]
  const before = structuredClone(entries)
  const rows = readCsv(entriesToCsv(entries))
  assert.deepEqual(entries, before)
  assert.deepEqual(rows.slice(1).map((row) => row[3]), ['다음 날', '저녁의 차', '아침의 차', '이전 기록'])
  assert.equal(rows[3][5], '0')
  assert.deepEqual(rows[3].slice(8, 11), ['0', '0', '0'])
  assert.equal(rows[3][16], '')
  assert.equal(rows[4][5], '')
  assert.deepEqual(rows[4].slice(8, 11), ['', '', ''])
  assert.equal(rows[4][24], '아니오')
  assert.equal(rows[4][25], '0')
})

test('spreadsheet formula-like text is protected, including leading whitespace and full-width symbols', () => {
  for (const text of ['=SUM(1,2)', '+1+2', '-1+2', '@SUM(1,2)', '  =1+2', '\t+1', '\n-1', '\r\n@A1', '\u00a0=1', '\uFEFF=1', '＝1', '＋1', '－1', '＠A1', '=1+2";=1+2']) {
    const entry = record(text)
    entry.experience.notes = text
    const before = structuredClone(entry)
    const row = readCsv(entriesToCsv([entry]))[1]
    assert.equal(row[3], `\t${text}`)
    assert.equal(row[22], `\t${text}`)
    assert.deepEqual(entry, before)
  }
  for (const text of ['\t차 한 잔', '\n차 이야기', '\r한 줄']) {
    assert.equal(readCsv(entriesToCsv([record(text)]))[1][3], `'${text}`)
  }
  for (const text of ['보이차 - 숙차', 'email@example.com', '한 잔 + 여유', "'차", '  차 이야기']) {
    assert.equal(readCsv(entriesToCsv([record(text)]))[1][3], text)
  }
})
