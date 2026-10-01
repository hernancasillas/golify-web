// Country of the visitor from Vercel's edge header; the consent banner uses it
// to know whether LGPD (BR) applies. Per-visitor, so never cached.
export function GET(req: Request) {
  const country = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2) || null;
  return Response.json({ country }, { headers: { 'Cache-Control': 'private, no-store' } });
}
