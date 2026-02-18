// ============================================================
// 📱 수능타이머 Service Worker v4.0 — 자체 알람 스케줄러 내장
// ============================================================
// 핵심 변경: 메인 스레드가 백그라운드에서 suspend되어도
// SW가 독립적으로 알림을 발행합니다.
//
// 동작 원리:
//   1. App.js가 타이머 시작 시 SW에 SCHEDULE_ALARM 메시지 전송
//      (종료 시각 + 라벨 + tag)
//   2. SW가 내부 setTimeout으로 해당 시각에 showNotification 실행
//   3. 메인 스레드가 살아있으면 동시에 인앱 알람도 작동 (이중 보험)
//   4. 메인 스레드가 죽어있어도 SW 알림은 독립 실행됨
// ============================================================

const SW_VERSION = '4.0.0';
const VIBRATE_PATTERN = [500, 110, 500, 110, 450, 110, 500, 200, 300, 100, 300, 100, 300];

// ── 예약된 알람 저장소 ──
const scheduledAlarms = new Map(); // tag → timeoutId

// ── 설치/활성화 ──
self.addEventListener('install', () => {
  console.log(`[SW v${SW_VERSION}] install`);
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] activate`);
  event.waitUntil(self.clients.claim());
});

// ── 알림 표시 헬퍼 ──
function fireNotification(title, body, tag) {
  return self.registration.showNotification(title, {
    body,
    tag,
    vibrate: VIBRATE_PATTERN,
    requireInteraction: true,
    renotify: true,
    silent: false,
    icon: '/suneung-timer/logo192.png',
    badge: '/suneung-timer/logo192.png',
    data: { url: '/suneung-timer/' },
    actions: [
      { action: 'dismiss', title: '알림 끄기' },
      { action: 'open', title: '앱 열기' },
    ],
  }).then(() => {
    console.log(`[SW] 알림 발행: ${title}`);
    // 앱에도 알림 완료를 알려줌 (포그라운드면 인앱 알람 트리거)
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'SW_ALARM_FIRED', tag }));
    });
  }).catch(err => {
    console.error(`[SW] 알림 실패:`, err);
  });
}

// ══════════════════════════════════════════════
// 📨 메시지 수신
// ══════════════════════════════════════════════
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  console.log(`[SW] msg: ${data.type}`, data.payload || '');

  // ── 1) 알람 예약 (타이머 시작 시 호출) ──
  // App.js가 타이머를 시작할 때 종료 시각을 SW에 등록
  // SW 내부 setTimeout이 해당 시각에 독립적으로 알림 발행
  if (data.type === 'SCHEDULE_ALARM') {
    const { endTime, title, body, tag } = data.payload || {};
    if (!endTime || !tag) return;

    // 기존 같은 tag 예약이 있으면 취소
    if (scheduledAlarms.has(tag)) {
      clearTimeout(scheduledAlarms.get(tag));
      scheduledAlarms.delete(tag);
    }

    const delay = Math.max(0, endTime - Date.now());
    console.log(`[SW] 알람 예약: ${tag}, ${Math.round(delay/1000)}초 후`);

    const timeoutId = setTimeout(() => {
      scheduledAlarms.delete(tag);
      fireNotification(
        title || '⏰ 타이머 완료!',
        body || '설정한 시간이 종료되었습니다.',
        tag
      );
    }, delay);

    scheduledAlarms.set(tag, timeoutId);
    return;
  }

  // ── 2) 알람 취소 (타이머 중지/리셋 시) ──
  if (data.type === 'CANCEL_ALARM') {
    const tag = data.tag || 'timer-default';
    if (scheduledAlarms.has(tag)) {
      clearTimeout(scheduledAlarms.get(tag));
      scheduledAlarms.delete(tag);
      console.log(`[SW] 알람 취소: ${tag}`);
    }
    return;
  }

  // ── 3) 즉시 알림 (기존 호환 + 테스트용) ──
  if (data.type === 'SHOW_NOTIFICATION') {
    const p = data.payload || {};
    event.waitUntil(fireNotification(
      p.title || '⏰ 타이머 완료!',
      p.body || '타이머가 종료되었습니다.',
      p.tag || 'timer-default'
    ));
    return;
  }

  // ── 4) 재진동 ──
  if (data.type === 'REVIBRATE_NOTIFICATION') {
    const p = data.payload || {};
    event.waitUntil(fireNotification(
      p.title || '⏰ 확인하지 않은 타이머!',
      p.body || '알림을 확인해주세요.',
      p.tag || 'timer-default'
    ));
    return;
  }

  // ── 5) 특정 알림 닫기 ──
  if (data.type === 'CLOSE_NOTIFICATION') {
    const tag = data.tag || 'timer-default';
    // 예약도 취소
    if (scheduledAlarms.has(tag)) {
      clearTimeout(scheduledAlarms.get(tag));
      scheduledAlarms.delete(tag);
    }
    event.waitUntil(
      self.registration.getNotifications({ tag }).then(ns => ns.forEach(n => n.close()))
    );
    return;
  }

  // ── 6) 전체 닫기 ──
  if (data.type === 'CLOSE_ALL_NOTIFICATIONS') {
    // 모든 예약 취소
    scheduledAlarms.forEach((tid) => clearTimeout(tid));
    scheduledAlarms.clear();
    event.waitUntil(
      self.registration.getNotifications().then(ns => ns.forEach(n => n.close()))
    );
    return;
  }

  // ── 7) 핑 ──
  if (data.type === 'PING') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(c => c.postMessage({
          type: 'PONG',
          version: SW_VERSION,
          scheduledCount: scheduledAlarms.size
        }));
      })
    );
    return;
  }
});

// ══════════════════════════════════════════════
// 🖱️ 알림 인터랙션
// ══════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  const tag = event.notification.tag;
  event.notification.close();

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

self.addEventListener('notificationclose', (event) => {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(c => c.postMessage({ type: 'DISMISS_ALARM', tag: event.notification.tag }));
  });
});