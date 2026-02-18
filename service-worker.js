// ============================================================
// 📱 수능타이머 Service Worker v3.0
// ============================================================
// 위치: public/service-worker.js
// 빌드 후: build/service-worker.js
// 등록 URL: /suneung-timer/service-worker.js
// ============================================================

const SW_VERSION = '3.0.0';

// ── 진동 패턴 ──
const VIBRATE_PATTERN = [500, 110, 500, 110, 450, 110, 500, 200, 300, 100, 300, 100, 300];

// ── 설치 ──
self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] install`);
  self.skipWaiting();
});

// ── 활성화 ──
self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] activate`);
  event.waitUntil(self.clients.claim());
});

// ── 메시지 수신 ──
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  console.log(`[SW] 메시지 수신: ${data.type}`);

  // 1) 알림 표시
  if (data.type === 'SHOW_NOTIFICATION') {
    const p = data.payload || {};
    event.waitUntil(
      self.registration.showNotification(p.title || '⏰ 타이머 완료!', {
        body: p.body || '타이머가 종료되었습니다.',
        tag: p.tag || 'timer-default',
        vibrate: VIBRATE_PATTERN,
        requireInteraction: true,
        renotify: true,
        silent: false,
        icon: '/suneung-timer/logo192.png',
        badge: '/suneung-timer/logo192.png',
        data: { url: '/suneung-timer/' },
        actions: [
          { action: 'dismiss', title: '🔕 끄기' },
          { action: 'open', title: '📱 열기' },
        ],
      }).then(() => {
        console.log('[SW] ✅ 알림 표시 성공');
      }).catch((err) => {
        console.error('[SW] ❌ 알림 표시 실패:', err);
      })
    );
    return;
  }

  // 2) 재진동
  if (data.type === 'REVIBRATE_NOTIFICATION') {
    const p = data.payload || {};
    event.waitUntil(
      self.registration.showNotification(p.title || '⏰ 확인하지 않은 타이머!', {
        body: p.body || '알림을 확인해주세요.',
        tag: p.tag || 'timer-default',
        vibrate: VIBRATE_PATTERN,
        requireInteraction: true,
        renotify: true,
        silent: false,
        icon: '/suneung-timer/logo192.png',
        badge: '/suneung-timer/logo192.png',
        data: { url: '/suneung-timer/' },
      })
    );
    return;
  }

  // 3) 특정 알림 닫기
  if (data.type === 'CLOSE_NOTIFICATION') {
    event.waitUntil(
      self.registration.getNotifications({ tag: data.tag || 'timer-default' })
        .then(ns => ns.forEach(n => n.close()))
    );
    return;
  }

  // 4) 전체 닫기
  if (data.type === 'CLOSE_ALL_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then(ns => ns.forEach(n => n.close()))
    );
    return;
  }

  // 5) 테스트 핑
  if (data.type === 'PING') {
    // 앱에 응답
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'PONG', version: SW_VERSION }));
      })
    );
    return;
  }
});

// ── 알림 클릭 ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tag = event.notification.tag;

  if (event.action === 'dismiss') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'DISMISS_ALARM', tag }));
      })
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'DISMISS_ALARM', tag });
          return client.focus();
        }
      }
      return self.clients.openWindow('/suneung-timer/');
    })
  );
});

// ── 알림 스와이프 닫기 ──
self.addEventListener('notificationclose', (event) => {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(c => c.postMessage({ type: 'DISMISS_ALARM', tag: event.notification.tag }));
  });
});