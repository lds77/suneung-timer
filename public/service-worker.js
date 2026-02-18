// 📱 수능타이머 Service Worker v4.0.0 (강력 진동 모드)
const SW_VERSION = '4.0.0';

// 🔔 1초 진동, 0.2초 휴식의 강력한 패턴
const VIBRATE_PATTERN = [1000, 200, 1000, 200, 1000, 200, 1000];

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(data.payload.title || '⏰ 타이머 완료!', {
        body: data.payload.body || '타이머가 종료되었습니다.',
        vibrate: VIBRATE_PATTERN, // 여기서 진짜 진동이 일어납니다!
        requireInteraction: true,
        tag: data.payload.tag || 'timer-default'
      })
    );
  }
});

// 알림 클릭 시 앱으로 이동하는 로직 (생략 가능하나 권장)
self.addEventListener('notificationclick', (e) => { e.notification.close(); });
