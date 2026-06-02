'use client';

import { useEffect } from 'react';

/** Registers the service worker (production only) to enable offline + install. */
export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* SW registration is best-effort */
      });
    }
  }, []);
  return null;
}
