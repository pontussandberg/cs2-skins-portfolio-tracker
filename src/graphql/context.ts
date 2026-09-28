import type { ListingSnap } from "@/core/types";
import type { Runtime } from "@/server/runtime";

export interface GqlContext {
  rt: Runtime;
  /** Per-request cache of each watch's latest listings (watch id -> listings). */
  listings: Map<string, Promise<ListingSnap[]>>;
}
