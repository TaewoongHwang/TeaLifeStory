export const isMeal = (entry) => entry.kind === 'meal'
export const recordCategory = (entry) => isMeal(entry) ? entry.meal.source : entry.tea.category
export const draftKey = (kind = 'tea') => kind === 'meal' ? 'mealDraft' : 'draft'
