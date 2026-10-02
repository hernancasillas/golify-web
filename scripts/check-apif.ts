// Run: node --env-file=.env.local --no-warnings --import ./scripts/ts-resolve.mjs scripts/check-apif.ts
import { webMayCall, writeCache, readCache, WEB_RESERVE } from '../src/lib/apif-store';
const may = await webMayCall();
console.log('reserve', WEB_RESERVE, 'webMayCall', may);
await writeCache('/__selftest', { rows: [1], paging: null }, 60);
console.log('read', JSON.stringify(await readCache('/__selftest')));
