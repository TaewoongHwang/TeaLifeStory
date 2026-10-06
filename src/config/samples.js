import { createEntry, localDate } from '../utils/entry.js'
export function createSamples() {
  return [
    ['우전 녹차', '녹차', '다관', 5, '아침 공기가 차가워지면서 녹차 향이 더 선명하게 느껴졌다.', ['아침', '산뜻함']],
    ['운남 보이차', '보이차', '개완', 4, '비가 오는 저녁. 평소보다 부드럽고 편안했다.', ['비 오는 날', '편안함']],
    ['백호은침', '백차', '유리포트', 0, '잠깐 멈춰 쉬어 가는 오후. 은은한 단맛이 오래 남았다.', ['오후', '혼자']],
  ].map(([name, category, tool, rating, feeling, tags], index) => {
    const entry = createEntry()
    const date = new Date()
    date.setDate(date.getDate() - index)
    entry.id = `development-sample-${index + 1}`
    entry.isSample = true
    entry.tea = { ...entry.tea, name, category, amount: 4 + index }
    entry.brewing = { ...entry.brewing, tool, material: '도자기', volume: 150 }
    entry.context.date = localDate(date)
    entry.context.location = '집, 창가'
    entry.experience = { ...entry.experience, rating, feeling }
    entry.tags = tags
    return entry
  })
}
