  // --- 📲 알림 시작: SW 시스템 알림(최우선) + 인앱 반복 ---
  const startAlarmRepeat = useCallback((source, timerLabel) => {
    // 1. [청소] 혹시 이미 실행 중인 알람 인터벌이 있다면 즉시 제거 (중복 방지)
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
    }

    // 2. [★ 0순위] 서비스 워커 시스템 알림 발송
    // 화면이 꺼져 있어도 OS가 즉시 진동을 울리게 하는 가장 중요한 단계입니다.
    const tag = source === 'main' ? 'timer-main' : `timer-sub-${Date.now()}`;
    const label = timerLabel || (source === 'main' ? '메인 타이머' : '보조 타이머');
    
    activeAlarmTagRef.current = tag; // 나중에 알람을 끌 때 사용

    sendNotificationViaSW(
      `⏰ ${label} 완료!`,
      `${label} 시간이 종료되었습니다. 탭하여 확인하세요.`,
      tag
    );

    // 3. [반복 설정] 앱이 켜져 있을 때 소리와 보조 진동을 2.5초마다 반복 실행
    alarmIntervalRef.current = setInterval(() => {
      playAlarmLoop(source, label);
    }, 2500);

    // 4. [즉시 실행] 인터벌을 기다리지 않고 즉시 한 번 실행
    playAlarmLoop(source, label);
    
  }, [sendNotificationViaSW, playAlarmLoop]);
