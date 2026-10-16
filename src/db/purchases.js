import { getDB } from './index.js'
export async function listPurchases() { return (await getDB()).getAll('purchases') }
export async function putPurchase(value) { return (await getDB()).put('purchases', value) }
export async function removePurchase(id) { return (await getDB()).delete('purchases', id) }
