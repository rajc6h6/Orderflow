/**
 * OrderFlow — Offline Action Queue (IndexedDB via idb)
 *
 * Stores pending write-actions when the device is offline so they
 * can be replayed once connectivity is restored.
 */

import { openDB } from 'idb';

const DB_NAME = 'orderflow-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-actions';

/**
 * Open (or create) the IndexedDB database.
 */
function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
}

/**
 * Enqueue a pending action for later sync.
 *
 * @param {{ type: string, payload: object }} action
 * @returns {Promise<number>} The auto-generated id
 */
export async function enqueueAction(action) {
  const db = await getDb();
  const record = {
    ...action,
    createdAt: new Date().toISOString(),
  };
  const id = await db.add(STORE_NAME, record);
  return id;
}

/**
 * Retrieve all queued (un-synced) actions.
 *
 * @returns {Promise<Array>}
 */
export async function getQueuedActions() {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

/**
 * Remove an action after it has been successfully synced.
 *
 * @param {number} id
 */
export async function removeAction(id) {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

/**
 * Process (flush) every queued action.
 *
 * Accepts a handler function that receives each action and should
 * return a promise that resolves on success.  Successfully-handled
 * actions are removed from the queue; failures remain for retry.
 *
 * @param {(action: object) => Promise<{ success: boolean }>} handler
 * @returns {Promise<{ processed: number, failed: number }>}
 */
export async function processQueue(handler) {
  const actions = await getQueuedActions();
  let processed = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      const result = await handler(action);
      if (result && result.success) {
        await removeAction(action.id);
        processed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { processed, failed };
}
