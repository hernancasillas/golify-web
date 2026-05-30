'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function MatchPage() {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const deeplink = `golify://match/${id}`;
    const startTime = Date.now();
    window.location.href = deeplink;
    
    setTimeout(() => {
      if (Date.now() - startTime < 2000) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        if (isIOS) {
          window.location.href = 'https://apps.apple.com/app/golify';
        } else if (isAndroid) {
          window.location.href = 'https://play.google.com/store/apps/details?id=com.goligulias.fuchibol';
        }
      }
    }, 2000);
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Opening Golify...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          If the app doesn't open, <a href="https://apps.apple.com/app/golify" className="text-green-600 dark:text-green-400 underline">download it here</a>.
        </p>
      </div>
    </div>
  );
}
