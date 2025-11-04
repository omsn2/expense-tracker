const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cwd = path.resolve(__dirname, '..');
const dbPath = path.resolve(cwd, 'dev.db');

try {
  console.log('[dbReset] Removing dev.db if it exists');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('[dbReset] dev.db removed');
  } else {
    console.log('[dbReset] dev.db does not exist, skipping removal');
  }

  console.log('[dbReset] Running Prisma migrate reset --force');
  // Use npx so it works even if prisma is not globally installed
  execSync('npx prisma migrate reset --force', { stdio: 'inherit', cwd });

  console.log('[dbReset] Migration reset complete');

  console.log('[dbReset] Running prisma generate');
  execSync('npx prisma generate', { stdio: 'inherit', cwd });
  console.log('[dbReset] Prisma generate complete');
} catch (err) {
  console.error('[dbReset] Error during db reset:', err);
  process.exit(1);
}
