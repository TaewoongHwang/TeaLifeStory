export async function processPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 사진을 선택해 주세요.')
  if (file.size > 15 * 1024 * 1024) throw new Error('사진 한 장은 15MB 이하로 선택해 주세요.')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/jpeg', 0.78)
    if (data.length > 3 * 1024 * 1024) throw new Error('사진 용량을 줄여 다시 선택해 주세요.')
    return { id: crypto.randomUUID(), name: file.name.slice(0, 200), data }
  } finally { bitmap.close() }
}
