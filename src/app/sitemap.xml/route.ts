// Sitemap index (plan A2). Search Console already knows /sitemap.xml, so the
// index lives here; /sitemap-index.xml serves the same document under the
// plan's name. No API calls: the list of children comes from the calendar
// and the competition registry.

import { childFiles } from '@/lib/sitemaps/catalog';
import { indexXml, xmlResponse } from '@/lib/sitemaps/xml';

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  return xmlResponse(indexXml(await childFiles()));
}
