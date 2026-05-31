import { openDB, type DBSchema } from 'idb';
import type { MatchScore } from './types';

const DB_NAME = 'lumosworldcup';
const DB_VERSION = 1;
const STORE_NAME = 'scores';

interface WorldCupPredictionsDB extends DBSchema {
  scores: {
    key: string;
    value: MatchScore;
    indexes: {
      updatedAt: string;
    };
  };
}

const dbPromise = openDB<WorldCupPredictionsDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore(STORE_NAME, { keyPath: 'matchId' });
    store.createIndex('updatedAt', 'updatedAt');
  },
});

export async function getAllScores() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function saveScore(score: MatchScore) {
  const db = await dbPromise;
  await db.put(STORE_NAME, score);
}
