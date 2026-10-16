import { isObject, text, identifier, iso, date, time, fail, choice } from './validation.js'
import { mealSources, mealTimes, portions, spiceLevels, preparations, foodGroups, bodyFeelings, beforeStates, mealDrinks } from '../config/meals.js'

export function validatePurchase(value) {
  if (!isObject(value) || !identifier(value.id) || !iso(value.createdAt) || !iso(value.updatedAt)) fail()
  if (!text(value.name, 100) || !value.name.trim() || !text(value.product, 200) || !text(value.shop, 200) || !date(value.date) || !text(value.notes) || typeof value.favorite !== 'boolean') fail()
  return { id: value.id, createdAt: value.createdAt, updatedAt: value.updatedAt, name: value.name.trim(), product: value.product, shop: value.shop, date: value.date, notes: value.notes, favorite: value.favorite }
}
export function validateObservation(value, entry) {
  if (!isObject(value) || !identifier(value.id) || !date(value.date) || !value.date || !time(value.time) || !value.time || !text(value.notes)) fail()
  if (!Array.isArray(value.feelings) || !value.feelings.length || value.feelings.length > bodyFeelings.length || new Set(value.feelings).size !== value.feelings.length || !value.feelings.every((name) => bodyFeelings.includes(name))) fail()
  if (value.feelings.includes('편안함') && value.feelings.length > 1) fail()
  if (entry.context.date && `${value.date}T${value.time}` < `${entry.context.date}T${entry.context.time || '00:00'}`) throw new Error('식후 느낌의 시각은 식사 시각 이후로 남겨 주세요.')
  return { id: value.id, date: value.date, time: value.time, feelings: [...value.feelings], notes: value.notes }
}
export function validateMealFields(entry, draft) {
  const { meal, observations } = entry
  if (!isObject(meal) || !text(meal.name, 200) || (!draft && !meal.name.trim()) || !choice(meal.source, mealSources) || !choice(meal.occasion, mealTimes) || !text(meal.venue, 200)) fail()
  if (!choice(meal.portion, portions) || !choice(meal.spice, spiceLevels) || !choice(meal.before, beforeStates) || !choice(meal.drink, mealDrinks)) fail()
  if (!Array.isArray(meal.ingredients) || meal.ingredients.length > 100) fail()
  const ids = new Set()
  for (const food of meal.ingredients) {
    if (!isObject(food) || !identifier(food.id) || ids.has(food.id) || !text(food.name, 100) || !food.name.trim() || !choice(food.group, Object.keys(foodGroups)) || !choice(food.preparation, preparations)) fail()
    ids.add(food.id)
    if (food.purchase !== null) food.purchase = validatePurchase(food.purchase)
  }
  if (!Array.isArray(observations) || observations.length > 200) fail()
  const observationIds = new Set()
  entry.observations = observations.map((value) => {
    if (observationIds.has(value?.id)) fail()
    observationIds.add(value?.id)
    return validateObservation(value, entry)
  })
}
