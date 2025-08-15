import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const dirs = ['.next', '.turbo'];
for (const d of dirs) {
  const p = resolve(process.cwd(), d);
  if (existsSync(p)) {
    try {
      await rm(p, { recursive: true, force: true });
      console.log(`Removed ${d}`);
    } catch (e) {
      console.error(`Failed to remove ${d}:`, e.message);
      process.exitCode = 1;
    }
  }
}
