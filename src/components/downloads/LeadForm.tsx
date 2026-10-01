'use client';

// "Recíbela cada jornada" (optional) and the kit gate (required). After a
// successful submit the gated links appear; if saving fails the reader sees
// it, keeps the address in the field, and (for the kit) still gets the files:
// the failure is ours, not theirs.

import { useActionState, useEffect, type ReactNode } from 'react';
import { track } from '@/lib/analytics';
import type { RouteLocale } from '@/lib/routes';
import { subscribeLead, type LeadState } from './actions';

const STR = {
  es: { email: 'Tu correo', consent: 'Acepto recibir correos de Golify. Puedo darme de baja cuando quiera.', send: 'Enviar', sending: 'Enviando…', ok: '¡Listo! Te escribiremos a {e}.', invalid: 'Revisa el correo y marca la casilla de aceptación.', error: 'No pudimos guardar tu correo ({e}). Intenta de nuevo en un momento.', errorKit: 'No pudimos guardar tu correo ({e}), pero aquí tienes el kit igual.' },
  pt: { email: 'Seu e-mail', consent: 'Aceito receber e-mails do Golify. Posso cancelar quando quiser.', send: 'Enviar', sending: 'Enviando…', ok: 'Pronto! Vamos escrever para {e}.', invalid: 'Confira o e-mail e marque a caixa de aceite.', error: 'Não conseguimos salvar seu e-mail ({e}). Tente de novo em instantes.', errorKit: 'Não conseguimos salvar seu e-mail ({e}), mas o kit está aqui mesmo assim.' },
  en: { email: 'Your email', consent: 'I agree to receive emails from Golify. I can unsubscribe at any time.', send: 'Send', sending: 'Sending…', ok: 'Done! We will write to {e}.', invalid: 'Check the address and tick the consent box.', error: 'We could not save your email ({e}). Please try again in a moment.', errorKit: 'We could not save your email ({e}), but here is the kit anyway.' },
} as const;

export function LeadForm({
  locale,
  source,
  title,
  lead,
  unlocked,
}: {
  locale: RouteLocale;
  source: string;
  title: string;
  lead: string;
  /** Gated content shown after submit (kit). Absent = optional capture. */
  unlocked?: ReactNode;
}) {
  const t = STR[locale];
  const [state, action, pending] = useActionState<LeadState, FormData>(subscribeLead, { status: 'idle', email: '' });
  useEffect(() => {
    if (state.status === 'ok') track('email_signup', { source, locale });
  }, [state.status, source, locale]);

  const open = !!unlocked && (state.status === 'ok' || state.status === 'error');
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6" aria-labelledby={`lead-${source}`}>
      <h2 id={`lead-${source}`} className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
      {state.status === 'ok' && !unlocked ? (
        <p role="status" className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{t.ok.replace('{e}', state.email)}</p>
      ) : !open ? (
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="locale" value={locale} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor={`email-${source}`}>{t.email}</label>
            <input
              id={`email-${source}`}
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.email}
              key={state.email}
              placeholder={t.email}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button type="submit" disabled={pending} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
              {pending ? t.sending : t.send}
            </button>
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="consent" required className="mt-0.5 accent-primary" />
            <span>{t.consent}</span>
          </label>
          {state.status === 'invalid' || state.status === 'error' ? (
            <p role="alert" className="text-sm text-destructive">{(state.status === 'error' ? t.error : t.invalid).replace('{e}', state.email)}</p>
          ) : null}
        </form>
      ) : null}
      {open ? (
        <div className="mt-4 space-y-3">
          <p role="status" className={state.status === 'ok' ? 'text-sm text-primary' : 'text-sm text-destructive'}>
            {(state.status === 'ok' ? t.ok : t.errorKit).replace('{e}', state.email)}
          </p>
          {unlocked}
        </div>
      ) : null}
    </section>
  );
}
