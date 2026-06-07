'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { OpeningScreen } from '@/components/OpeningScreen';

export default function PlayerPage() {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const deeplink = `golify://player/${id}`;
    const startTime = Date.now();
    window.location.href = deeplink;
    
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/app/id6772339872';
        } else if (isAndroid) {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.goligulias.fuchibol';
        }
      }
    }, 2000);
  }, [id]);

  return <OpeningScreen />;
}
