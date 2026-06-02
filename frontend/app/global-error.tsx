'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui', padding: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ color: '#a1a1aa', marginTop: 8 }}>
          The error has been reported. Please refresh the page or try again later.
        </p>
      </body>
    </html>
  );
}
