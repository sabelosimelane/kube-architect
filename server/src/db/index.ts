import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
// Use in-memory DB for tests, otherwise file-based
const dbPath = isTest ? ':memory:' : (process.env.DATABASE_URL || path.join(__dirname, '../../dev.sqlite'));

export const db = new Database(dbPath, { verbose: isTest ? undefined : console.log });

// Initialize tables
export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// Auto-run init only if not in test mode, to allow tests to control initialization
if (!isTest) {
  initDb();
}
