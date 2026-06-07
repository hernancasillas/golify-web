'use client';

import { useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { OpeningScreen } from '@/components/OpeningScreen';

export default function WorldCupPage() {
  const { t } = useI18n();

  useEffect(() => {
    // Intentar abrir la app con el deeplink correcto (sin /app/)
    const deeplink = 'golify://world-cup';
    
    // Intentar abrir en móvil
    const startTime = Date.now();
    window.location.href = deeplink;
    
    // Si no abre la app, redirigir después de un timeout
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        // La app no abrió, el usuario está en navegador
        // Redirigir a la tienda correspondiente
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/app/id6772339872';
        } else if (isAndroid) {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.goligulias.fuchibol';
        }
      }
    }, 2000);
  }, []);

  return <OpeningScreen />;
}
