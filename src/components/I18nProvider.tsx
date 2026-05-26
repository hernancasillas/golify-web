'use client';

import { createContext, useContext, ReactNode } from 'react';
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

type Locale = 'en' | 'es';
type Messages = typeof enMessages;

type I18nContextType = {
  locale: Locale;
  messages: Messages;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ 
  children, 
  locale = 'es' 
}: { 
  children: ReactNode; 
  locale?: Locale;
}) {
  const messages = locale === 'en' ? enMessages : esMessages;

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

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
