export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#f4f4f5', fontFamily: 'system-ui', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#047857', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📶</div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>You&apos;re offline</h1>
        <p style={{ color: '#a1a1aa', marginTop: 8, maxWidth: 360 }}>
          CampusFlow can&apos;t reach the network right now. Pages you&apos;ve already opened are
          still available. We&apos;ll reconnect automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
