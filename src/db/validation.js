export const fail = () => { throw new Error('올바른 차곡차곡 백업 또는 기록이 아닙니다. 기존 데이터는 유지됩니다.') }
export const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)
export const text = (value, max = 10000) => typeof value === 'string' && value.length <= max
export const identifier = (value) => text(value, 200) && value.trim().length > 0
export const number = (value, max = 100000) => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max)
export const iso = (value) => text(value, 40) && !Number.isNaN(Date.parse(value))
export const date = (value) => value === '' || (text(value, 10) && /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value)
export const time = (value) => text(value, 5) && (value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value))
export const choice = (value, options) => value === '' || options.includes(value)
