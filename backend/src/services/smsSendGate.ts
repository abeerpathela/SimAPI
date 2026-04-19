/**
 * Phase 2: per-user serialized sends + minimum 3s gap after each SMS attempt finishes.
 * Prevents concurrent requests from racing the throttle and spamming carriers.
 */

const MIN_GAP_MS = 3000;

/** Earliest time (epoch ms) the next send for this user may *start*. */
const nextSlotStart = new Map<string, number>();

/** Promise chain tail per user for FIFO ordering. */
const chains = new Map<string, Promise<unknown>>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function awaitNextSlot(userId: string): Promise<void> {
  const now = Date.now();
  const earliest = nextSlotStart.get(userId) ?? now;
  const wait = Math.max(0, earliest - now);
  if (wait > 0) {
    await sleep(wait);
  }
}

function scheduleFollowingSlot(userId: string): void {
  nextSlotStart.set(userId, Date.now() + MIN_GAP_MS);
}

/**
 * Runs `fn` in sequence per `userId` and enforces at least 3 seconds between the end of one
 * attempt and the start of the next.
 */
export function runExclusiveSms<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(userId) ?? Promise.resolve();
  const done = prev
    .catch(() => {
      /* keep chain alive */
    })
    .then(async () => {
      await awaitNextSlot(userId);
      try {
        return await fn();
      } finally {
        scheduleFollowingSlot(userId);
      }
    });
  chains.set(userId, done.catch(() => undefined));
  return done;
}
