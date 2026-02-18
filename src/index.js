import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

// ══════════════════════════════════════════════
// 📲 서비스 워커 등록 (유일한 등록 지점)
// ══════════════════════════════════════════════
//
// 🔑 GitHub Pages 배포 시 경로 문제:
//   homepage: "https://lds77.github.io/suneung-timer"
//   → PUBLIC_URL = "/suneung-timer"
//   → SW 파일 실제 위치: /suneung-timer/service-worker.js
//   → 절대경로 '/service-worker.js'를 쓰면 404 에러!
//
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // process.env.PUBLIC_URL은 빌드 시 package.json의 homepage에서 추출됨
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    console.log('[SW] 등록 시도:', swUrl);

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[SW] ✅ 등록 성공! scope:', registration.scope);
        console.log('[SW] active:', registration.active?.state);
        console.log('[SW] waiting:', registration.waiting?.state);
        console.log('[SW] installing:', registration.installing?.state);

        // 전역에 저장 → App.js에서 접근
        window.__swRegistration = registration;
        window.__swStatus = 'registered';

        // SW가 활성화될 때까지 대기
        if (!registration.active) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                console.log('[SW] 새 워커 상태:', newWorker.state);
                if (newWorker.state === 'activated') {
                  window.__swStatus = 'active';
                }
              });
            }
          });
        } else {
          window.__swStatus = 'active';
        }
      })
      .catch((error) => {
        console.error('[SW] ❌ 등록 실패:', error);
        window.__swStatus = 'failed: ' + error.message;
      });
  });
}