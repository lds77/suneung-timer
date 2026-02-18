// 📱 수능타이머 Service Worker v4.0.0 (강력 진동 모드)
const SW_VERSION = '4.0.0';

// 🔔 1초 진동, 0.2초 휴식 패턴
const VIBRATE_PATTERN = [1000, 200, 1000, 200, 1000, 200, 1000];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'SHOW_NOTIFICATION') {
    const p = data.payload || {};
    event.waitUntil(
      self.registration.showNotification(p.title || '⏰ 타이머 완료!', {
        body: p.body || '타이머가 종료되었습니다.',
        tag: p.tag || 'timer-default',
        vibrate: VIBRATE_PATTERN,
        requireInteraction: true,
        renotify: true,
        icon: '/suneung-timer/logo192.png',
        badge: '/suneung-timer/logo192.png',
        data: { url: '/suneung-timer/' }
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
});