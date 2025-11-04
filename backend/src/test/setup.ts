import { execSync } from 'child_process';
import path from 'path';

// This setup file runs before the test suite (each worker).
// It ensures the database is reset and migrations are applied so tests run predictably.
try {
  const cwd = path.resolve(__dirname, '..', '..');
  // Call the Node db reset helper directly to avoid nesting npm calls.
  console.log('[test setup] running node ./scripts/dbReset.js (this may take a moment)...');
  execSync('node ./scripts/dbReset.js', { stdio: 'inherit', cwd });
  console.log('[test setup] db reset complete');
} catch (err) {
  console.error('[test setup] failed to reset DB', err);
  // Re-throw so Vitest fails early and CI surfaces the problem
  throw err;
}
