// Child sitemaps: /sitemaps/{name}.xml and /sitemaps/{name}-{page}.xml.
//
// ISR: generateStaticParams returns [] so nothing is fetched at build time;
// each file is generated on first request and regenerated at most hourly.
// The real refresh cost is set by the fetch TTLs underneath (season info and
// teams daily, season fixtures 6 h, /players weekly), so an hourly
// regeneration of a past month or a player file is served from the data
// cache, not the API. Generators use strict fetchers: a failed call throws,
// and Next keeps serving the previous good file.

import { resolveChild } from '@/lib/sitemaps/catalog';
import { urlsetXml, xmlResponse } from '@/lib/sitemaps/xml';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ file: string }[]> {
  return [];
}

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }): Promise<Response> {
  const { file } = await ctx.params;
  const m = /^([a-z0-9-]+)\.xml$/.exec(file);
  if (!m) return new Response('Not found', { status: 404 });
  const entries = await resolveChild(m[1]);
  if (!entries) return new Response('Not found', { status: 404 });
  return xmlResponse(urlsetXml(entries));
}
