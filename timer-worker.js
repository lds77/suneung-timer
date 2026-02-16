// timer-worker.js — Web Worker for background-safe timer
// 메인 타이머 + 보조 타이머(최대 2개) 모두 관리

// ── 메인 타이머 ──
let endTime = null;
let intervalId = null;
let isPaused = false;

// ── 보조 타이머 ──
let subTimers = {}; // { id: { mode, endTime, startedAt, elapsed, remaining, running, paused } }
let subIntervalId = null;

// ════════════════════
// 메인 타이머
// ════════════════════
function tick() {
  if (isPaused || endTime === null) return;
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
  self.postMessage({ type: 'tick', timeLeft: remaining });
  if (remaining <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    endTime = null;
    self.postMessage({ type: 'complete' });
  }
}

// ════════════════════
// 보조 타이머
// ════════════════════
function subTick() {
  const now = Date.now();
  const results = [];
  let anyActive = false;

  Object.keys(subTimers).forEach(id => {
    const t = subTimers[id];
    if (!t.running || t.paused) {
      results.push({ id: Number(id), ...t });
      return;
    }
    anyActive = true;

    if (t.mode === 'stopwatch') {
      const elapsed = Math.floor((now - t.startedAt) / 1000);
      subTimers[id] = { ...t, elapsed };
      results.push({ id: Number(id), ...subTimers[id] });
    } else if (t.mode === 'countdown') {
      if (!t.endTime) {
        results.push({ id: Number(id), ...t });
        return;
      }
      const remaining = Math.max(0, Math.ceil((t.endTime - now) / 1000));
      if (remaining <= 0) {
        subTimers[id] = { ...t, remaining: 0, running: false, endTime: null };
        results.push({ id: Number(id), ...subTimers[id] });
        self.postMessage({ type: 'sub_complete', subId: Number(id) });
      } else {
        subTimers[id] = { ...t, remaining };
        results.push({ id: Number(id), ...subTimers[id] });
      }
    }
  });

  self.postMessage({ type: 'sub_tick', subTimers: results });

  // 활성 보조 타이머 없으면 인터벌 정리
  if (!anyActive && subIntervalId) {
    clearInterval(subIntervalId);
    subIntervalId = null;
  }
}

function ensureSubInterval() {
  const hasActive = Object.values(subTimers).some(t => t.running && !t.paused);
  if (hasActive && !subIntervalId) {
    subIntervalId = setInterval(subTick, 1000);
    subTick(); // 즉시 한 번
  }
}

// ════════════════════
// 메시지 핸들러
// ════════════════════
self.onmessage = function(e) {
  const { command, totalSeconds, subId, subData } = e.data;

  switch (command) {
    // ── 메인 타이머 ──
    case 'start':
      endTime = Date.now() + totalSeconds * 1000;
      isPaused = false;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, 1000);
      tick();
      break;

    case 'pause':
      isPaused = true;
      break;

    case 'stop':
      isPaused = false;
      endTime = null;
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      break;

    case 'sync':
      // 화면 복귀 — 메인 타이머
      if (isPaused) {
        // pause 상태면 현재 저장된 remaining 전달
      } else if (endTime) {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        self.postMessage({ type: 'tick', timeLeft: remaining });
        if (remaining <= 0) self.postMessage({ type: 'complete' });
      }
      // 보조 타이머도 동기화
      subTick();
      break;

    // ── 보조 타이머 ──
    case 'sub_add': {
      const now = Date.now();
      if (subData.mode === 'stopwatch') {
        subTimers[subData.id] = {
          mode: 'stopwatch', running: true, paused: false,
          elapsed: 0, startedAt: now,
          remaining: 0, endTime: null, label: subData.label || '스톱워치'
        };
      } else {
        subTimers[subData.id] = {
          mode: 'countdown', running: false, paused: false,
          remaining: subData.remaining || 25 * 60, endTime: null,
          elapsed: 0, startedAt: null, label: subData.label || '카운트다운',
          setMinutes: subData.setMinutes || 25
        };
      }
      ensureSubInterval();
      break;
    }

    case 'sub_toggle': {
      const t = subTimers[subId];
      if (!t) break;
      const now = Date.now();

      if (!t.running) {
        // 최초 시작
        if (t.mode === 'countdown') {
          subTimers[subId] = { ...t, running: true, paused: false, endTime: now + t.remaining * 1000 };
        } else {
          subTimers[subId] = { ...t, running: true, paused: false, startedAt: now };
        }
      } else if (t.paused) {
        // 재개
        if (t.mode === 'countdown') {
          subTimers[subId] = { ...t, paused: false, endTime: now + t.remaining * 1000 };
        } else {
          subTimers[subId] = { ...t, paused: false, startedAt: now - t.elapsed * 1000 };
        }
      } else {
        // 일시정지
        if (t.mode === 'countdown' && t.endTime) {
          const remaining = Math.max(0, Math.ceil((t.endTime - now) / 1000));
          subTimers[subId] = { ...t, paused: true, remaining, endTime: null };
        } else if (t.mode === 'stopwatch' && t.startedAt) {
          const elapsed = Math.floor((now - t.startedAt) / 1000);
          subTimers[subId] = { ...t, paused: true, elapsed, startedAt: null };
        }
      }
      ensureSubInterval();
      break;
    }

    case 'sub_reset': {
      const t = subTimers[subId];
      if (!t) break;
      if (t.mode === 'stopwatch') {
        subTimers[subId] = { ...t, elapsed: 0, running: false, paused: false, startedAt: null };
      } else {
        subTimers[subId] = { ...t, remaining: t.setMinutes * 60, running: false, paused: false, endTime: null };
      }
      break;
    }

    case 'sub_remove':
      delete subTimers[subId];
      if (Object.keys(subTimers).length === 0 && subIntervalId) {
        clearInterval(subIntervalId);
        subIntervalId = null;
      }
      break;

    case 'sub_update_minutes': {
      const t = subTimers[subId];
      if (t && !t.running) {
        subTimers[subId] = { ...t, setMinutes: subData.minutes, remaining: subData.minutes * 60, endTime: null };
      }
      break;
    }

    case 'sub_update_label': {
      const t = subTimers[subId];
      if (t) subTimers[subId] = { ...t, label: subData.label };
      break;
    }
  }
};