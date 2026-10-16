import { entryDate } from './entry.js'
import { isMeal } from './record.js'

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
  const sorted = entries.filter((entry) => !isMeal(entry)).sort((a, b) => date(b).localeCompare(date(a)))
  for (const entry of sorted) rows.push(columns.map(([, read]) => read(entry)))
  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`
}
export function mealsToCsv(entries) {
  const labels = ['기록 ID', '한 끼 이름', '식사 구분', '끼니', '식사 날짜', '식사 시간', '음식점', '먹은 양', '매운 정도', '식전 상태', '함께 마신 것', '재료·구매 정보', '맛 평점', '감상', '식후 느낌', '메모', '태그', '다시 먹고 싶음', '사진 수']
  const rows = [labels]
  for (const entry of entries.filter(isMeal).sort((a, b) => entryDate(b).localeCompare(entryDate(a)))) {
    rows.push([entry.id, entry.meal.name, entry.meal.source, entry.meal.occasion, entry.context.date, entry.context.time, entry.meal.venue, entry.meal.portion, entry.meal.spice, entry.meal.before, entry.meal.drink,
      entry.meal.ingredients.map((food) => [food.name, food.group, food.preparation, food.purchase ? [food.purchase.product, food.purchase.shop, food.purchase.date, food.purchase.notes].filter(Boolean).join(' / ') : ''].filter(Boolean).join(' · ')).join('\n'),
      entry.experience.rating || '', entry.experience.feeling, entry.observations.map((item) => `${item.date} ${item.time} · ${item.feelings.join(', ')}${item.notes ? ` · ${item.notes}` : ''}`).join('\n'), entry.experience.notes, entry.tags.join('; '), entry.favorite ? '예' : '아니오', entry.photos.length])
  }
  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`
}
