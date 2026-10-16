import { openDB } from 'idb'
import { defaults, optionStores, categorySeedIds } from '../config/defaults.js'

export const storeNames = ['entries', ...optionStores, 'settings', 'purchases']
let connection
export function getDB() {
  if (!connection) {
    connection = openDB('tea-life-story', 2, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        if (_oldVersion < 1) {
          db.createObjectStore('entries', { keyPath: 'id' })
          db.createObjectStore('settings', { keyPath: 'key' })
          for (const store of optionStores) {
            db.createObjectStore(store, { keyPath: 'id' })
            defaults[store].forEach((name, index) => transaction.objectStore(store).put({ id: store === 'categories' ? categorySeedIds[name] : `${store}-${index}`, name }))
          }
        }
        if (_oldVersion < 2) db.createObjectStore('purchases', { keyPath: 'id' })
      },
      blocking() {
        connection?.then((db) => db.close())
        connection = undefined
      },
      terminated() { connection = undefined },
    }).catch((error) => { connection = undefined; throw error })
  }
  return connection
}
