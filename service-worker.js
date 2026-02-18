// ============================================================
// 📱 귀염뽀짝 타이머 - Service Worker (시스템 알림 전용)
// ============================================================
// 역할:
//  1. 앱에서 postMessage를 받아 OS 레벨 시스템 알림(showNotification) 실행
//  2. 타이머 종류별 고유 tag로 알림 중복 방지
//  3. 백그라운드/잠금화면에서도 강력한 진동 패턴 적용
//  4. 알림 클릭 시 앱으로 포커스 복귀
// ============================================================

const SW_VERSION = '1.0.0';

// ── 설치 & 활성화: 즉시 제어권 확보 ──
self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] installed`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] activated`);
  event.waitUntil(self.clients.claim());
});

// ── 앱에서 보낸 메시지 수신 → 시스템 알림 발행 ──
self.addEventListener('message', (event) => {
  const data = event.data;

  if (data && data.type === 'SHOW_NOTIFICATION') {
    const {
      title = '⏰ 타이머 완료!',
      body = '타이머가 종료되었습니다.',
      tag = 'timer-default',
      icon,
      badge,
      data: notifData,
    } = data.payload || {};

    // 강력한 진동 패턴 (OS가 지원하는 경우 적용)
    const vibrate = [500, 110, 500, 110, 450, 110, 500];

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag, // 같은 tag의 알림은 덮어쓰기 (중복 방지)
        icon: icon || '/logo192.png',
        badge: badge || '/logo192.png',
        vibrate,
        requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
        renotify: true, // 같은 tag라도 다시 진동/소리 발생
        silent: false, // 시스템 기본 알림음 사용 (미디어 볼륨이 아닌 알림 볼륨)
        data: notifData || { url: '/' },
        actions: [
          { action: 'dismiss', title: '🔕 알림 끄기' },
          { action: 'open', title: '📱 앱 열기' },
        ],
      })
    );
  }

  // 알림 닫기 요청
  if (data && data.type === 'CLOSE_NOTIFICATION') {
    const tag = data.tag || 'timer-default';
    event.waitUntil(
      self.registration.getNotifications({ tag }).then((notifications) => {
        notifications.forEach((n) => n.close());
      })
    );
  }
});

// ── 알림 클릭 핸들러: 앱으로 포커스 복귀 ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  if (action === 'dismiss') {
    // 알림만 닫기 — 앱으로 메시지를 보내 알람 반복 중단
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'DISMISS_ALARM', tag: event.notification.tag });
        });
      })
    );
    return;
  }

  // 'open' 액션 또는 알림 본문 클릭: 앱 창으로 포커스
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 이미 열린 앱 창이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // 앱에 알람 해제 메시지도 전송
          client.postMessage({ type: 'DISMISS_ALARM', tag: event.notification.tag });
          return client.focus();
        }
      }
      // 열린 창이 없으면 새로 열기
      const url = (event.notification.data && event.notification.data.url) || '/';
      return self.clients.openWindow(url);
    })
  );
});

// ── 알림 닫기(스와이프 등) 핸들러 ──
self.addEventListener('notificationclose', (event) => {
  // 사용자가 알림을 스와이프로 닫은 경우에도 앱에 알림
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'DISMISS_ALARM', tag: event.notification.tag });
    });
  });
});
