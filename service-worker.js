// ============================================================
// 📱 귀염뽀짝 타이머 - Service Worker v2.0
// ============================================================
// 🏗️ 아키텍처 원칙:
//   백그라운드 진동/알림 = 전적으로 이 SW가 담당
//   포그라운드 사운드   = app.js AudioContext가 담당
//   포그라운드 진동     = app.js navigator.vibrate가 보조
//
// 📲 OS별 동작 차이:
//   Android: showNotification vibrate 패턴을 OS가 직접 실행 → 백그라운드 OK
//   iOS:     PWA에서 showNotification 미지원 (Safari 16.4+ 부분 지원)
//            → iOS는 SW 알림 대신 인앱 알림에 의존 (한계 있음)
// ============================================================

const SW_VERSION = '2.0.0';

// ── 진동 패턴 프리셋 ──
// Android에서 showNotification의 vibrate는 OS 레벨에서 실행되므로
// 앱이 백그라운드여도 잠금화면에서도 정상 작동합니다.
// 패턴: [진동ms, 쉬는ms, 진동ms, ...] — 가능한 길고 강하게 설정
const VIBRATE_STRONG = [
  500, 110, 500, 110, 450, 110,  // 1차: 강한 3연타
  500, 200,                       // 짧은 휴식
  300, 100, 300, 100, 300,        // 2차: 빠른 3연타
];
// ※ Android 기준 총 약 3.6초 진동 — 사용자가 인지하기 충분한 길이

// ── 설치: 즉시 활성화 (대기 없이 바로 제어권 확보) ──
self.addEventListener('install', (event) => {
  console.log(`[SW v${SW_VERSION}] 설치됨`);
  self.skipWaiting(); // 이전 SW가 있어도 즉시 교체
});

// ── 활성화: 모든 클라이언트 즉시 제어 ──
self.addEventListener('activate', (event) => {
  console.log(`[SW v${SW_VERSION}] 활성화됨`);
  event.waitUntil(self.clients.claim()); // 새로고침 없이 바로 제어
});

// ══════════════════════════════════════════════
// 📨 앱 → SW 메시지 수신
// ══════════════════════════════════════════════
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  // ── 1) 시스템 알림 발행 (타이머 완료 시) ──
  if (data.type === 'SHOW_NOTIFICATION') {
    const {
      title = '⏰ 타이머 완료!',
      body  = '타이머가 종료되었습니다.',
      tag   = 'timer-default',
      icon,
      badge,
      data: notifData,
    } = data.payload || {};

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        tag,
        // ── 진동: OS가 직접 실행하므로 백그라운드에서도 작동 ──
        vibrate: VIBRATE_STRONG,
        // ── 알림 유지: 사용자가 직접 닫을 때까지 상단바에 남음 ──
        requireInteraction: true,
        // ── 재알림: 같은 tag라도 다시 진동+소리 발생 ──
        // 앱이 포그라운드 복귀 시 re-fire하면 다시 진동 울림
        renotify: true,
        // ── silent: false → OS의 '알림 볼륨' 채널 사용 ──
        // AudioContext의 '미디어 볼륨'과 완전히 분리됨
        // 기기가 진동모드면 진동만, 무음모드면 둘 다 안 울림 (OS 정책 준수)
        silent: false,
        icon:  icon  || '/logo192.png',
        badge: badge || '/logo192.png',
        data: notifData || { url: '/' },
        actions: [
          { action: 'dismiss', title: '🔕 알림 끄기' },
          { action: 'open',    title: '📱 앱 열기' },
        ],
      })
    );
    return;
  }

  // ── 2) 알림 재발행 (포그라운드 복귀 시 진동 재실행용) ──
  // 앱이 백그라운드→포그라운드로 돌아왔을 때, 알람이 아직 활성 상태면
  // 같은 tag로 다시 알림을 보내 renotify:true에 의해 진동이 재실행됩니다.
  if (data.type === 'REVIBRATE_NOTIFICATION') {
    const { tag = 'timer-default', title, body } = data.payload || {};
    event.waitUntil(
      self.registration.showNotification(
        title || '⏰ 아직 확인하지 않은 타이머!',
        {
          body: body || '알림을 확인해주세요.',
          tag,
          vibrate: VIBRATE_STRONG,
          requireInteraction: true,
          renotify: true,  // 핵심: 같은 tag라도 진동 재실행
          silent: false,
          icon:  '/logo192.png',
          badge: '/logo192.png',
          data: { url: '/' },
        }
      )
    );
    return;
  }

  // ── 3) 특정 tag 알림 닫기 ──
  if (data.type === 'CLOSE_NOTIFICATION') {
    const tag = data.tag || 'timer-default';
    event.waitUntil(
      self.registration.getNotifications({ tag }).then((notifications) => {
        notifications.forEach((n) => n.close());
      })
    );
    return;
  }

  // ── 4) 모든 타이머 알림 일괄 닫기 ──
  if (data.type === 'CLOSE_ALL_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then((notifications) => {
        notifications.forEach((n) => n.close());
      })
    );
    return;
  }
});

// ══════════════════════════════════════════════
// 🖱️ 알림 인터랙션 핸들러
// ══════════════════════════════════════════════

// ── 알림 클릭 / 액션 버튼 ──
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const tag = event.notification.tag;
  event.notification.close();

  // [A] "알림 끄기" 버튼 → 앱에 DISMISS_ALARM 전송
  if (action === 'dismiss') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'DISMISS_ALARM', tag });
        });
      })
    );
    return;
  }

  // [B] "앱 열기" 또는 알림 본문 클릭 → 앱 포커스 + 알람 해제
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'DISMISS_ALARM', tag });
          return client.focus();
        }
      }
      // 앱 창이 닫혀있으면 새로 열기
      return self.clients.openWindow('/');
    })
  );
});

// ── 알림 스와이프 닫기 ──
self.addEventListener('notificationclose', (event) => {
  const tag = event.notification.tag;
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'DISMISS_ALARM', tag });
    });
  });
});