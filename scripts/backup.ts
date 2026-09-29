/**
 * Copy the whole data directory (watches, portfolio valuations, inventory, run history) to a
 * timestamped folder outside the project, so deleting or re-cloning the project can't lose it.
 *
 *   pnpm backup                 -> ~/cs2-skins-portfolio-tracker-backups/<timestamp>/
 *   BACKUP_DIR=D:\backups pnpm backup
 *
 * Restore: stop the app and copy a backup folder's contents back into data/.
 */
import { cp, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch {
  /* optional */
}

const dataDir = path.resolve(process.env.DATA_DIR || "data");
const backupRoot = path.resolve(process.env.BACKUP_DIR || path.join(homedir(), "cs2-skins-portfolio-tracker-backups"));
const target = path.join(backupRoot, new Date().toISOString().replace(/[:.]/g, "-"));

await stat(dataDir).catch(() => {
  console.error(`No data directory at ${dataDir}`);
  process.exit(1);
});
// Temp files are half-written atomic writes.
await cp(dataDir, target, { recursive: true, filter: (src) => !src.endsWith(".tmp") });

const files = await readdir(target, { recursive: true });
console.log(`Backed up ${files.length} entries from ${dataDir}\n  -> ${target}`);
