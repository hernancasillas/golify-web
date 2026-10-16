// Which budget a render spends from. The heavy families (players, head-to-head,
// referees, stadiums, EA FC cards) are tens of thousands of URLs that crawlers
// walk one cold page after another; each costs 5–13 API-Football calls. In
// oct 2026 a single scraper made the player route the top consumer of the
// whole web share (29K renders in 12 h), leaving matches and boards without
// data. Heavy renders now spend from a smaller share (API_FOOTBALL_HEAVY_SHARE,
// see apif-store.ts): past it they serve what is cached, or the fallback.
//
// The tier rides an AsyncLocalStorage set by resilientPage(…, { heavy: true }),
// so the data layer needs no new parameters.

import { AsyncLocalStorage } from 'node:async_hooks';

export type ApiTier = 'standard' | 'heavy';

const store = new AsyncLocalStorage<ApiTier>();

export function runWithTier<T>(tier: ApiTier, fn: () => Promise<T>): Promise<T> {
  return store.run(tier, fn);
}

export function currentTier(): ApiTier {
  return store.getStore() ?? 'standard';
}
