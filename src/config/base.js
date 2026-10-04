export function normalizeBase(value = '/') {
  const segments = value.split('/').filter(Boolean)
  return segments.length ? `/${segments.join('/')}/` : '/'
}
