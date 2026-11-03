// Garmin's developer portal only accepts http(s) OAuth redirect URLs, but Golify Run
// listens on its own scheme (golifyrun://) through ASWebAuthenticationSession.
// Garmin redirects here and this bounces the browser to the app with the same
// result. Only code, state and error pass through; the target is fixed, so this
// is not an open redirect. The code is useless without the PKCE verifier (kept
// on the phone) and the client secret (kept in Supabase).
const APP_CALLBACK = 'golifyrun://localhost/garmin';
const FORWARDED = ['code', 'state', 'error', 'error_description'];

export function GET(req: Request) {
  const incoming = new URL(req.url).searchParams;
  const outgoing = new URLSearchParams();
  for (const name of FORWARDED) {
    const value = incoming.get(name);
    if (value) outgoing.set(name, value);
  }
  const query = outgoing.toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: query ? `${APP_CALLBACK}?${query}` : APP_CALLBACK,
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
