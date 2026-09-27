import type { ListingSnap } from "./types";

export interface Page {
  items: ListingSnap[];
  cursor: string | null;
}

export interface PaginateOptions {
  maxPages: number;
  pageSize: number;
  /** Ids already known for this query; enables early stop. Null on first run. */
  knownIds: Set<string> | null;
}

export interface PaginateResult {
  items: ListingSnap[];
  pages: number;
  /** True when we reached the end of the results (so "gone" detection is safe). */
  coveredFully: boolean;
  stoppedBecause: "end" | "known" | "maxPages";
}

/**
 * Follow CSFloat cursors, newest first (sort_by=most_recent).
 * Stops when: the result set ends, a full page holds nothing unseen (older pages cannot hold new
 * listings), or maxPages is hit.
 */
export async function paginate(
  fetchPage: (cursor: string | null) => Promise<Page>,
  { maxPages, pageSize, knownIds }: PaginateOptions,
): Promise<PaginateResult> {
  const items: ListingSnap[] = [];
  let cursor: string | null = null;
  let pages = 0;

  while (true) {
    const page = await fetchPage(cursor);
    pages += 1;
    items.push(...page.items);

    const ended = !page.cursor || page.items.length === 0 || page.items.length < pageSize;
    if (ended) return { items, pages, coveredFully: true, stoppedBecause: "end" };

    if (knownIds && page.items.every((l) => knownIds.has(l.id))) {
      return { items, pages, coveredFully: false, stoppedBecause: "known" };
    }
    if (pages >= maxPages) return { items, pages, coveredFully: false, stoppedBecause: "maxPages" };
    cursor = page.cursor;
  }
}
