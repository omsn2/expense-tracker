import { execSync } from 'child_process';
import path from 'path';

// Export a default async function for Vitest globalSetup
export default async function globalSetup() {
  try {
    const cwd = path.resolve(__dirname, '..', '..');
    console.log('[global-setup] running node ./scripts/dbReset.js (this may take a moment)...');
    execSync('node ./scripts/dbReset.js', { stdio: 'inherit', cwd });
    console.log('[global-setup] db reset complete');
  } catch (err) {
    console.error('[global-setup] failed to reset DB', err);
    throw err;
  }
}
