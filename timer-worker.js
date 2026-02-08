// timer-worker.js
let intervalId = null;
let endTime = null;
let isPaused = false;

self.onmessage = function(e) {
  const { command, totalSeconds } = e.data;
  
  if (command === 'start') {
    // 타이머 시작
    endTime = Date.now() + (totalSeconds * 1000);
    isPaused = false;
    
    if (intervalId) clearInterval(intervalId);
    
    intervalId = setInterval(() => {
      if (isPaused) return;
      
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      if (remaining > 0) {
        self.postMessage({ type: 'tick', timeLeft: remaining });
      } else {
        clearInterval(intervalId);
        intervalId = null;
        self.postMessage({ type: 'complete' });
      }
    }, 1000);
    
  } else if (command === 'pause') {
    isPaused = true;
    
  } else if (command === 'resume') {
    isPaused = false;
    
  } else if (command === 'stop') {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    endTime = null;
    isPaused = false;
    
  } else if (command === 'sync') {
    // 화면 복귀 시 현재 남은 시간 동기화
    if (endTime && !isPaused) {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      self.postMessage({ type: 'tick', timeLeft: remaining });
    }
  }
};