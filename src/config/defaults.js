export const optionStores = ['categories', 'tools', 'materials']
export const defaults = {
  categories: ['보이차', '녹차', '홍차', '황차', '백차', '흑차', '청차', '블렌딩차', '허브차', '기타'],
  tools: ['다관', '개완', '자사호', '유리포트', '티포트', '머그컵', '텀블러', '기타'],
  materials: ['도자기', '자기', '유리', '자사', '금속', '나무', '기타'],
}
export const optionLabels = { categories: '차 종류', tools: '내 차구', materials: '재질' }

// Display vocabulary changes must not rewrite existing options, diaries or backups.
export function displayToolName(name, names = []) {
  if (name !== '다관') return name
  return names.includes('차관') ? '차관 (기존 항목)' : '차관'
}

// Keep the original v1 category IDs when seeding a new DB.
export const categorySeedIds = {
  녹차: 'categories-0', 백차: 'categories-1', 황차: 'categories-2', 청차: 'categories-3',
  홍차: 'categories-4', 흑차: 'categories-5', 보이차: 'categories-6', 블렌딩차: 'categories-7', 허브차: 'categories-8', 기타: 'categories-9',
}
