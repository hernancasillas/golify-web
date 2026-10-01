'use server';

// Email capture of the downloads (plan B3 block 6 and the kit gate). Writes to
// public.web_leads with the anon key (RLS: insert-only). The table ships in a
// migration that may not be applied yet: any failure is reported back to the
// form with the address kept in the field, never swallowed.

import { ROUTE_LOCALES } from '@/lib/routes';
import { supabase } from '@/lib/supabase-server';

export interface LeadState {
  status: 'idle' | 'ok' | 'invalid' | 'error';
  email: string;
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function subscribeLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 320);
  const source = String(form.get('source') ?? '');
  const locale = String(form.get('locale') ?? '');
  const consent = form.get('consent') === 'on';
  if (!EMAIL_RE.test(email) || !consent || !/^[a-z0-9-]{1,120}$/.test(source) || !(ROUTE_LOCALES as readonly string[]).includes(locale)) {
    return { status: 'invalid', email };
  }
  try {
    const { error } = await supabase.from('web_leads').insert({ email, source: `downloads:${source}`, locale, consent: true });
    // 23505 = already subscribed to this source: same outcome for the reader.
    if (error && error.code !== '23505') {
      console.error('[downloads] web_leads insert failed', error.code, error.message);
      return { status: 'error', email };
    }
  } catch (e) {
    console.error('[downloads] web_leads insert threw', e);
    return { status: 'error', email };
  }
  return { status: 'ok', email };
}
