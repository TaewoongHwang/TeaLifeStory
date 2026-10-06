import { entryDate } from './entry.js'

const columns = [
  ['기록 ID', (entry) => entry.id],
  ['생성 시각', (entry) => entry.createdAt],
  ['수정 시각', (entry) => entry.updatedAt],
  ['차 이름', (entry) => entry.tea.name],
  ['차 종류', (entry) => entry.tea.category],
  ['차 사용량(g)', (entry) => entry.tea.amount],
  ['도구', (entry) => entry.brewing.tool],
  ['재질', (entry) => entry.brewing.material],
  ['물 용량(cc)', (entry) => entry.brewing.volume],
  ['물 온도(°C)', (entry) => entry.brewing.waterTemperature],
  ['우림 시간(초)', (entry) => entry.brewing.steepTime],
  ['마신 날짜', (entry) => entry.context.date],
  ['마신 시간', (entry) => entry.context.time],
  ['장소', (entry) => entry.context.location],
  ['함께한 사람', (entry) => entry.context.people],
  ['마신 이유', (entry) => entry.context.reason],
  ['별점', (entry) => entry.experience.rating || ''],
  ['향', (entry) => entry.experience.aroma],
  ['맛', (entry) => entry.experience.taste],
  ['바디감', (entry) => entry.experience.body],
  ['여운', (entry) => entry.experience.aftertaste],
  ['느낌', (entry) => entry.experience.feeling],
  ['메모', (entry) => entry.experience.notes],
  ['태그', (entry) => (entry.tags || []).join('; ')],
  ['즐겨찾기', (entry) => entry.favorite ? '예' : '아니오'],
  ['사진 수', (entry) => (entry.photos || []).length],
]

function cell(value) {
  let text = String(value ?? '')
  // CSV is for spreadsheet viewing. Keep protective prefixes out of stored data.
  // https://community.owasp.org/attacks/CSV_Injection
  if (typeof value === 'string') {
    if (/^\s*[=+\-@＝＋－＠]/u.test(text)) text = `\t${text}`
    else if (/^[\t\r\n]/.test(text)) text = `'${text}`
  }
  return `"${text.replaceAll('"', '""')}"`
}

export function entriesToCsv(entries) {
  const rows = [columns.map(([label]) => label)]
  const date = (entry) => entry.context.date ? entryDate(entry) : ''
  const sorted = [...entries].sort((a, b) => date(b).localeCompare(date(a)))
  for (const entry of sorted) rows.push(columns.map(([, read]) => read(entry)))
  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`
}
