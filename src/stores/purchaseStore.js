import { defineStore } from 'pinia'
import { listPurchases, putPurchase, removePurchase } from '../db/purchases.js'
import { validatePurchase } from '../db/mealValidation.js'

export const usePurchaseStore = defineStore('purchases', {
  state: () => ({ purchases: [] }),
  actions: {
    async load() { this.purchases = (await listPurchases()).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)) },
    async save(value) {
      const saved = validatePurchase({ ...value, updatedAt: new Date().toISOString() })
      await putPurchase(saved)
      const index = this.purchases.findIndex((item) => item.id === saved.id)
      if (index < 0) this.purchases.unshift(saved)
      else this.purchases[index] = saved
      return saved
    },
    async remove(id) { await removePurchase(id); this.purchases = this.purchases.filter((item) => item.id !== id) },
  },
})
