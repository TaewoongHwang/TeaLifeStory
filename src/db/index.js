import { openDB } from 'idb'
import { defaults, optionStores } from '../config/defaults.js'

export const storeNames = ['entries', ...optionStores, 'settings']
let connection
export function getDB() {
  if (!connection) {
    connection = openDB('tea-life-story', 1, {
      upgrade(db, _oldVersion, _newVersion, transaction) {
        db.createObjectStore('entries', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'key' })
        for (const store of optionStores) {
          db.createObjectStore(store, { keyPath: 'id' })
          defaults[store].forEach((name, index) => transaction.objectStore(store).put({ id: `${store}-${index}`, name }))
        }
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
