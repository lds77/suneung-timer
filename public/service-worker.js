// ============================================================
// 📱 수능타이머 Service Worker v4.0.0 (강력 진동 모드)
// ============================================================
const SW_VERSION = '4.0.0';

// ── 🔔 핵심 수정: 1초 진동, 0.2초 휴식의 강력한 패턴 ──
const VIBRATE_PATTERN = [1000, 200, 1000, 200, 1000, 200, 1000];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 메시지 수신 로직
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'SHOW_NOTIFICATION' || data.type === 'REVIBRATE_NOTIFICATION') {
    const p = data.payload || {};
    
    event.waitUntil(
      self.registration.showNotification(p.title || '⏰ 타이머 완료!', {
        body: p.body || '타이머가 종료되었습니다.',
        tag: p.tag || 'timer-default',
        vibrate: VIBRATE_PATTERN, // 정의한 강력 패턴 적용
        requireInteraction: true,  // 사용자가 닫기 전까지 알림 유지
        renotify: true,            // 같은 태그여도 다시 진동
        silent: false,             // OS의 소리/진동 설정을 따름
        icon: '/suneung-timer/logo192.png',
        badge: '/suneung-timer/logo192.png',
        data: { url: '/suneung-timer/' },
        actions: [
          { action: 'dismiss', title: '🔕 알람 끄기' },
          { action: 'open', title: '📱 앱 열기' },
        ],
      })
    );
  }

  // 나머지 CLOSE_NOTIFICATION, PING 로직은 기존과 동일하게 유지
  if (data.type === 'CLOSE_ALL_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then(ns => ns.forEach(n => n.close()))
    );
  }
});

// 알림 클릭 및 닫기 핸들러 (기존 로직 유지)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tag = event.notification.tag;
  if (event.action === 'dismiss') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'DISMISS_ALARM', tag }));
    });
  } else {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'DISMISS_ALARM', tag });
          return client.focus();
        }
      }
      return self.clients.openWindow('/suneung-timer/');
    });
  }
});