export const choiceShortcuts = {
  categories: ['녹차', '홍차', '황차', '백차', '흑차'],
  tools: ['다관', '개완', '자사호', '티포트', '머그컵', '텀블러'],
}

// Shortcuts only set a value when tapped; optional fields start empty.
export const numericInputs = {
  amount: { unit: 'g', presets: [3, 5, 7], increment: 0.5, min: 0, max: 100000, inputStep: 0.1, inputmode: 'decimal' },
  volume: { unit: 'cc', presets: [100, 150, 200], increment: 25, min: 0, max: 100000, inputStep: 1, inputmode: 'numeric' },
  waterTemperature: { unit: '°C', presets: [80, 90, 95, 100], increment: 5, min: 0, max: 100, inputStep: 'any', inputmode: 'decimal' },
  steepTime: { unit: '초', presets: [10, 30, 60, 120], increment: 5, min: 0, max: 100000, inputStep: 'any', inputmode: 'decimal' },
}
