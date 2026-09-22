'use client';

import { createContext, useContext, ReactNode } from 'react';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';
import ptMessages from '@/messages/pt.json';

type Locale = 'en' | 'es' | 'pt';
type Messages = typeof esMessages;

const CATALOGS: Record<Locale, Messages> = {
  en: enMessages,
  es: esMessages,
  pt: ptMessages,
};

type I18nContextType = {
  locale: Locale;
  messages: Messages;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function lookup(messages: unknown, key: string): string | undefined {
  let value: unknown = messages;
  for (const part of key.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : undefined;
}

export function I18nProvider({
  children,
  locale = 'es',
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const messages = CATALOGS[locale] ?? esMessages;

  // Falls back to Spanish before falling back to the raw key: a catalogue that
  // is missing a string should read as the default language, not as
  // "home.live.badge" in the middle of the page.
  const t = (key: string): string =>
    lookup(messages, key) ?? lookup(esMessages, key) ?? key;

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
