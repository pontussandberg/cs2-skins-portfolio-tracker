// Runs once when the Next.js server starts. Boots the store, queue and cron scheduler
// inside the same long-running process (self-hosted `next start`, e.g. on the Raspberry Pi).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureRuntime } = await import("./server/runtime");
  await ensureRuntime();
}
