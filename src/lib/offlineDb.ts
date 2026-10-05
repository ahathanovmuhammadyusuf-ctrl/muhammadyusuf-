/**
 * IndexedDB and Local Storage Offline Persistence
 * Provides resilient offline caching for active test attempts and answers
 */

const DB_NAME = 'TestPlatformOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'answers_cache';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAnswerLocally(
  attemptId: string,
  questionId: string,
  optionId: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const key = `${attemptId}_${questionId}`;
    store.put({
      key,
      attemptId,
      questionId,
      optionId,
      timestamp: Date.now(),
    });

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    // Fallback to localStorage if IndexedDB has issues
    try {
      const localKey = `tp_ans_${attemptId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
      existing[questionId] = optionId;
      localStorage.setItem(localKey, JSON.stringify(existing));
    } catch (e) {
      console.warn('Fallback storage error:', e);
    }
  }
}

export async function getStoredAnswersForAttempt(
  attemptId: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  try {
    // Check localStorage fallback first
    const localKey = `tp_ans_${attemptId}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      Object.assign(result, JSON.parse(localData));
    }

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    const items: any[] = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = reject;
    });

    items
      .filter((item) => item.attemptId === attemptId)
      .forEach((item) => {
        result[item.questionId] = item.optionId;
      });
  } catch (err) {
    // Return what we have from local fallback
  }

  return result;
}

export async function clearStoredAnswers(attemptId: string): Promise<void> {
  try {
    localStorage.removeItem(`tp_ans_${attemptId}`);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    const items: any[] = await new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });

    items.forEach((item) => {
      if (item.attemptId === attemptId) {
        store.delete(item.key);
      }
    });
  } catch (err) {
    // Ignore cleanup error
  }
}

// Active attempt caching for session resume
const ACTIVE_ATTEMPT_KEY = 'tp_active_attempt';

export function saveActiveAttemptState(data: any): void {
  try {
    localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Active attempt save error', e);
  }
}

export function getActiveAttemptState(): any | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ATTEMPT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearActiveAttemptState(): void {
  try {
    localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
  } catch (e) {
    // Ignore
  }
}
