import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [showMockExam, setShowMockExam] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // 모의고사 모드
  const [mockExamMode, setMockExamMode] = useState(false);
  const [mockExamStep, setMockExamStep] = useState(0);
  const [mockExamSchedule] = useState([
    { name: '국어', time: 80, emoji: '📖', color: '#667eea', break: 20 },
    { name: '수학', time: 100, emoji: '🔢', color: '#f093fb', break: 30 },
    { name: '영어', time: 70, emoji: '🌍', color: '#4facfe', break: 30 },
    { name: '한국사', time: 30, emoji: '🏛️', color: '#43e97b', break: 5 },
    { name: '탐구1', time: 30, emoji: '🔬', color: '#fa709a', break: 5 },
    { name: '탐구2', time: 30, emoji: '🧪', color: '#fee140', break: 0 },
  ]);
  const [isBreakTime, setIsBreakTime] = useState(false);
  
  // 휴식 타이머
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(5);
  
  // 체크리스트용 Hook
  const [newItem, setNewItem] = useState('');
  
  // 노트용 Hook
  const [selectedNoteSubject, setSelectedNoteSubject] = useState('국어');
  const [noteContent, setNoteContent] = useState('');
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [dDay, setDDay] = useState(() => {
    const saved = localStorage.getItem('dDay');
    return saved || '2025-11-13';
  });
  const [studyStats, setStudyStats] = useState(() => {
    const saved = localStorage.getItem('studyStats');
    return saved ? JSON.parse(saved) : {};
  });
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem('checklist');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('notes');
    return saved ? JSON.parse(saved) : {};
  });
  
  // 주간 목표
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem('weeklyGoal');
    return saved ? parseInt(saved) : 2400; // 기본 40시간
  });
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [pauseTip, setPauseTip] = useState('');

  const subjects = [
    { name: '국어', time: 80, emoji: '📖', color: '#667eea' },
    { name: '수학', time: 100, emoji: '🔢', color: '#f093fb' },
    { name: '영어', time: 70, emoji: '🌍', color: '#4facfe' },
    { name: '한국사', time: 30, emoji: '🏛️', color: '#43e97b' },
    { name: '탐구1', time: 30, emoji: '🔬', color: '#fa709a' },
    { name: '탐구2', time: 30, emoji: '🧪', color: '#fee140' },
    { name: '뽀모도로', time: 25, emoji: '🍅', color: '#ff6b6b' },
  ];

  const studyTips = {
    '국어': [
      "지문 읽기 전 발문을 먼저 보고 무엇을 찾을지 목표를 정하세요.",
      "비문학은 문단 간의 연결 고리(접속어)를 체크하며 구조를 파악하세요.",
      "문학은 주관적 감상보다 객관적인 근거를 지문 안에서 찾으세요.",
      "글이 안 읽힐 땐 심호흡 한 번! 한 문장에 매몰되지 말고 넘어가세요.",
    ],
    '수학': [
      "무작정 풀지 말고 '이 문제가 요구하는 개념'이 무엇인지 먼저 생각하세요.",
      "풀이 과정은 나중에 검토할 수 있도록 줄을 맞춰 깔끔하게 적으세요.",
      "킬러 문항에 시간을 다 쓰기보다 풀 수 있는 문제부터 확실히 맞히세요.",
      "계산 실수 방지를 위해 단위와 부호를 마지막에 한 번 더 확인하세요.",
    ],
    '영어': [
      "듣기 안내 방송이 나올 때 뒷장의 독해 지문을 미리 훑으세요.",
      "모르는 단어가 나와도 당황하지 말고 앞뒤 문맥으로 추론하세요.",
      "주제 찾기 문제는 첫 3문장과 끝 2문장에 핵심이 집중되어 있습니다.",
      "빈칸 추론은 글의 필자가 하고 싶은 말(요지)과 반드시 연결됩니다.",
    ],
    '한국사': [
      "사건의 나열보다 '왜 이 일이 일어났는가'의 인과관계를 떠올리세요.",
      "각 시대의 특징적인 키워드와 유물을 이미지로 연상하며 공부하세요.",
      "점수가 정체된다면 자주 틀리는 특정 시대만 집중 공략하세요.",
    ],
    '탐구1': [
      "도표와 그래프는 가로축과 세로축의 의미를 먼저 파악하는 게 우선입니다.",
      "함정 선지(오답)는 보통 개념을 교묘하게 뒤섞어 만드니 주의하세요.",
      "탐구는 시간 싸움입니다. 정형화된 문제는 기계적으로 풀 수 있게 반복하세요.",
      "실험 지문은 '변수'와 '결과'만 정확히 찾아도 절반은 풀립니다.",
    ],
    '탐구2': [
      "도표와 그래프는 가로축과 세로축의 의미를 먼저 파악하는 게 우선입니다.",
      "함정 선지(오답)는 보통 개념을 교묘하게 뒤섞어 만드니 주의하세요.",
      "탐구는 시간 싸움입니다. 정형화된 문제는 기계적으로 풀 수 있게 반복하세요.",
      "실험 지문은 '변수'와 '결과'만 정확히 찾아도 절반은 풀립니다.",
    ],
    '뽀모도로': [
      "25분은 오직 공부만! 잡생각이 나면 옆에 메모하고 바로 복귀하세요.",
      "스마트폰은 아예 다른 방에 두거나 가방 깊숙이 넣으세요.",
      "5분 휴식 때는 화면을 보지 말고 눈을 감거나 스트레칭을 하세요.",
      "집중이 너무 잘 된다면 뽀모도로 사이클을 50분 집중/10분 휴식으로 조정해 보세요.",
    ],
  };

  const pauseTips = [
    "잠깐 쉬어가는 것도 전략입니다. 심호흡하고 다시 시작하세요!",
    "집중력이 흐트러질 땐 물 한 모금이 도움이 됩니다.",
    "5분만 더 집중하면 한 세트 완성! 포기하지 마세요.",
    "지금 멈추면 다시 시작하기 더 어렵습니다. 조금만 더!",
    "완벽한 집중은 없어요. 70%만 집중해도 충분합니다.",
  ];

  const encouragements = [
    "🎉 완료! 정말 잘했어요!",
    "👏 대단해요! 꾸준함이 실력입니다!",
    "💪 멋져요! 한 걸음 더 가까워졌어요!",
    "⭐ 훌륭해요! 이 페이스 유지하세요!",
    "🔥 최고예요! 노력은 배신하지 않아요!",
  ];

  // 스트릭 계산
  const getStudyStreak = () => {
    const dates = Object.keys(studyStats).sort().reverse();
    if (dates.length === 0) return 0;
    
    let streak = 0;
    const today = new Date().toLocaleDateString('ko-KR');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('ko-KR');
    
    // 오늘 공부했는지 확인
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 86400000).toLocaleDateString('ko-KR');
      if (dates[i] === expectedDate) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // 주간 통계
  const getWeeklyMinutes = () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    let total = 0;
    
    Object.keys(studyStats).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date >= weekAgo) {
        Object.values(studyStats[dateStr]).forEach(mins => {
          total += mins;
        });
      }
    });
    
    return total;
  };

  // 노트 과목 변경 시 내용 업데이트
  useEffect(() => {
    if (showNotes) {
      setNoteContent(notes[selectedNoteSubject] || '');
    }
  }, [selectedNoteSubject, showNotes, notes]);

  // 설정 저장
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
    localStorage.setItem('dDay', dDay);
    localStorage.setItem('weeklyGoal', weeklyGoal.toString());
  }, [darkMode, soundEnabled, dDay, weeklyGoal]);

  // 통계 저장
  useEffect(() => {
    localStorage.setItem('studyStats', JSON.stringify(studyStats));
  }, [studyStats]);

  // 체크리스트 저장
  useEffect(() => {
    localStorage.setItem('checklist', JSON.stringify(checklist));
  }, [checklist]);

  // 노트 저장
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  // 준비 카운트다운
  useEffect(() => {
    if (showReady && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showReady && countdown === 0) {
      setShowReady(false);
      setIsRunning(true);
    }
  }, [showReady, countdown]);

  // 타이머 로직
  useEffect(() => {
    if (!isRunning || isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (soundEnabled) playSound();
          recordStudyTime();
          
          // 모의고사 모드 처리
          if (mockExamMode && mockExamStep < mockExamSchedule.length - 1) {
            const currentSubject = mockExamSchedule[mockExamStep];
            if (currentSubject.break > 0) {
              setIsBreakTime(true);
              setBreakMinutes(currentSubject.break);
              setCurrentTip(`${currentSubject.break}분 쉬는 시간입니다. 다음은 ${mockExamSchedule[mockExamStep + 1].emoji} ${mockExamSchedule[mockExamStep + 1].name}!`);
            }
          } else if (!mockExamMode && !isBreakTime) {
            // 일반 모드에서 휴식 제안
            setShowBreakPrompt(true);
          }
          
          const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
          if (!mockExamMode) setCurrentTip(randomEncouragement);
          setShowCompletion(true);
          setTimeout(() => {
            setShowCompletion(false);
            if (mockExamMode && !isBreakTime) {
              startNextMockExamSubject();
            }
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft, soundEnabled, mockExamMode, mockExamStep]);

  const startNextMockExamSubject = () => {
    if (mockExamStep < mockExamSchedule.length - 1) {
      const nextSubject = mockExamSchedule[mockExamStep + 1];
      setMockExamStep(mockExamStep + 1);
      startTimer(nextSubject);
    } else {
      // 모의고사 완료
      setMockExamMode(false);
      setMockExamStep(0);
      setCurrentTip("🎉 모의고사 완료! 정말 수고하셨어요!");
      setShowCompletion(true);
      setTimeout(() => setShowCompletion(false), 3000);
    }
  };

  const startBreakTimer = () => {
    setShowBreakPrompt(false);
    setIsBreakTime(true);
    setSelectedSubject({ name: '휴식', emoji: '☕', color: '#4ecca3', time: breakMinutes });
    setTimeLeft(breakMinutes * 60);
    setCountdown(3);
    setCurrentTip("휴식 시간입니다. 잠깐 쉬어가세요!");
    setShowReady(true);
  };

  const skipBreak = () => {
    setShowBreakPrompt(false);
    setIsBreakTime(false);
    if (mockExamMode) {
      startNextMockExamSubject();
    }
  };

  const startMockExam = () => {
    setShowMockExam(false);
    setMockExamMode(true);
    setMockExamStep(0);
    startTimer(mockExamSchedule[0]);
  };

  const recordStudyTime = () => {
    if (!selectedSubject || isBreakTime) return;
    
    const today = new Date().toLocaleDateString('ko-KR');
    const studiedMinutes = Math.floor((selectedSubject.time * 60 - timeLeft) / 60);
    
    if (studiedMinutes < 1) return;
    
    setStudyStats(prev => {
      const newStats = { ...prev };
      if (!newStats[today]) {
        newStats[today] = {};
      }
      if (!newStats[today][selectedSubject.name]) {
        newStats[today][selectedSubject.name] = 0;
      }
      newStats[today][selectedSubject.name] += studiedMinutes;
      return newStats;
    });
  };

  const startTimer = (subject) => {
    const tips = studyTips[subject.name] || studyTips['뽀모도로'];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setCurrentTip(randomTip);
    setSelectedSubject(subject);
    setTimeLeft(subject.time * 60);
    setCountdown(3);
    setShowReady(true);
  };

  const pauseTimer = () => {
    if (!isPaused) {
      const randomPauseTip = pauseTips[Math.floor(Math.random() * pauseTips.length)];
      setPauseTip(randomPauseTip);
    }
    setIsPaused(!isPaused);
  };

  const stopTimer = () => {
    if (isRunning && !isPaused && timeLeft < selectedSubject.time * 60) {
      recordStudyTime();
    }
    setIsRunning(false);
    setSelectedSubject(null);
    setTimeLeft(0);
    setIsPaused(false);
    setMockExamMode(false);
    setMockExamStep(0);
    setIsBreakTime(false);
  };

  const playSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LljHAU2jdXuzn0xBilzxe3aizsKElyx6OqnWBQKQ5zd8sFuJAUuhM/z3I4+CRxrvO/mnlEMDU+k4PC6ZBwFNo3V7s59MQYpc8Xt2os7ChJcsejtqVkUCUKb3PK+ayIFK4TO8tyJNggbaLvt559NEAxPpODvuWMcBTaM1e7OfTIHKHLG7tmKOwsRW6/n6qZYFApBmtzyvm0kBSuDzvLaijUIGmi77OecTg0OT6Tg77pkHQU1i9XuzXs0BShyx+7ZizsLEVuu5+ulVxQKQJnc8r5tJAUrgs/y2oo2CBlou+znm08NDU6k3++5ZB0DNYvV7cx8MwcobMfu2Yo7CxBarvDqpVkUCT+Y3PG9ciYGLYHP8dmJNggaaLzs55xPDQxOpeDvumQdAzSL1e3MezQHJ2zH79qLOwsQWa/v6aVZFAk+mNzyvXImBi2Bz/HYiTcIGmi87OecTg0MTqXg7rpkHAM0i9Xtyns0Bydsx+7aijsLD1mu7+mlWRQJPpjc8r1yJgYtgc/x2Ik3CBpovOznnE4NDEyl4O+6ZRwDM4rU7sl8NQcnbMju24o8ChBYru7opVkUCT2Y3PK9ciYGLIHP8diIOAgaaLzs5pxODQxMpeDvumQcBDSK1O3Je');
    audio.play().catch(() => {});
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedSubject) return 0;
    const total = selectedSubject.time * 60;
    return ((total - timeLeft) / total) * 100;
  };

  const isWarningTime = () => {
    return timeLeft <= 600 && timeLeft > 300;
  };

  const isCriticalTime = () => {
    return timeLeft <= 300;
  };

  const getTodayStats = () => {
    const today = new Date().toLocaleDateString('ko-KR');
    return studyStats[today] || {};
  };

  const getTotalMinutesToday = () => {
    const todayStats = getTodayStats();
    return Object.values(todayStats).reduce((sum, mins) => sum + mins, 0);
  };

  const getDaysUntilExam = () => {
    const today = new Date();
    const examDate = new Date(dDay);
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const clearStats = () => {
    if (window.confirm('모든 통계를 삭제하시겠습니까?')) {
      setStudyStats({});
      localStorage.removeItem('studyStats');
    }
  };

  // 체크리스트 관리
  const addChecklistItem = (text) => {
    if (text.trim()) {
      setChecklist([...checklist, { id: Date.now(), text, completed: false }]);
    }
  };

  const toggleChecklistItem = (id) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteChecklistItem = (id) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  // 노트 관리
  const saveNote = (subjectName, content) => {
    setNotes({ ...notes, [subjectName]: content });
  };

  // 휴식 제안 모달
  if (showBreakPrompt) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>☕ 휴식 시간</h2>
          <p>수고하셨어요! 잠깐 쉬어가실래요?</p>
          <div className="break-options">
            <button onClick={() => { setBreakMinutes(5); startBreakTimer(); }}>
              5분 휴식
            </button>
            <button onClick={() => { setBreakMinutes(10); startBreakTimer(); }}>
              10분 휴식
            </button>
            <button onClick={() => { setBreakMinutes(15); startBreakTimer(); }}>
              15분 휴식
            </button>
          </div>
          <button className="skip-btn" onClick={skipBreak}>
            건너뛰기
          </button>
        </div>
      </div>
    );
  }

  // 모의고사 시작 모달
  if (showMockExam) {
    return (
      <div className="modal-overlay">
        <div className="modal-content mock-exam-modal">
          <h2>📝 실전 모의고사 모드</h2>
          <p className="modal-desc">실제 수능 시간표대로 진행됩니다</p>
          
          <div className="mock-exam-schedule">
            {mockExamSchedule.map((subject, idx) => (
              <div key={idx} className="schedule-item">
                <span className="schedule-subject">
                  {subject.emoji} {subject.name}
                </span>
                <span className="schedule-time">{subject.time}분</span>
                {subject.break > 0 && (
                  <span className="schedule-break">→ 쉬는시간 {subject.break}분</span>
                )}
              </div>
            ))}
          </div>
          
          <p className="total-time">
            총 소요 시간: 약 6시간 15분
          </p>
          
          <div className="modal-buttons">
            <button className="start-mock-btn" onClick={startMockExam}>
              시작하기
            </button>
            <button className="cancel-btn" onClick={() => setShowMockExam(false)}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 준비 화면
  if (showReady) {
    return (
      <div className={`App timer-active ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="ready-container">
          <div className="ready-subject">
            {selectedSubject.emoji} {selectedSubject.name}
          </div>
          {!isBreakTime && (
            <div className="ready-tip">
              💡 {currentTip}
            </div>
          )}
          <div className="ready-countdown">
            {countdown > 0 ? countdown : 'START!'}
          </div>
          <div className="ready-message">
            준비되셨나요?
          </div>
        </div>
      </div>
    );
  }

  // 체크리스트 화면
  if (showChecklist) {
    const completedCount = checklist.filter(item => item.completed).length;

    return (
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="container">
          <div className="checklist-header">
            <button className="back-btn" onClick={() => setShowChecklist(false)}>
              ← 돌아가기
            </button>
            <h1>✅ 오늘의 체크리스트</h1>
            <p className="checklist-progress">
              완료: {completedCount} / {checklist.length}
            </p>
          </div>

          <div className="checklist-input-box">
            <input
              type="text"
              placeholder="오늘의 목표를 입력하세요 (예: 수학 20문제 풀기)"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addChecklistItem(newItem);
                  setNewItem('');
                }
              }}
            />
            <button onClick={() => {
              addChecklistItem(newItem);
              setNewItem('');
            }}>
              추가
            </button>
          </div>

          <div className="checklist-list">
            {checklist.length === 0 ? (
              <div className="empty-message">
                오늘의 목표를 추가해보세요! 💪
              </div>
            ) : (
              checklist.map(item => (
                <div key={item.id} className="checklist-item">
                  <div
                    className="checklist-content"
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    <div className={`checkbox ${item.completed ? 'checked' : ''}`}>
                      {item.completed && '✓'}
                    </div>
                    <span className={item.completed ? 'completed' : ''}>
                      {item.text}
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteChecklistItem(item.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 노트 화면
  if (showNotes) {
    return (
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="container">
          <div className="notes-header">
            <button className="back-btn" onClick={() => setShowNotes(false)}>
              ← 돌아가기
            </button>
            <h1>📝 과목별 메모장</h1>
          </div>

          <div className="notes-tabs">
            {subjects.filter(s => s.name !== '뽀모도로').map(subject => (
              <button
                key={subject.name}
                className={`note-tab ${selectedNoteSubject === subject.name ? 'active' : ''}`}
                style={{
                  borderColor: selectedNoteSubject === subject.name ? subject.color : 'transparent'
                }}
                onClick={() => {
                  saveNote(selectedNoteSubject, noteContent);
                  setSelectedNoteSubject(subject.name);
                }}
              >
                {subject.emoji} {subject.name}
              </button>
            ))}
          </div>

          <div className="notes-editor">
            <textarea
              placeholder={`${selectedNoteSubject} 공부 메모를 남겨보세요...
              
예시:
- 오늘 틀린 문제 유형
- 약점 정리
- 암기할 내용
- 시험 전 체크사항`}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <button
              className="save-note-btn"
              onClick={() => {
                saveNote(selectedNoteSubject, noteContent);
                alert('저장되었습니다!');
              }}
            >
              💾 저장
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 설정 화면
  if (showSettings) {
    return (
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="container">
          <div className="settings-header">
            <button className="back-btn" onClick={() => setShowSettings(false)}>
              ← 돌아가기
            </button>
            <h1>⚙️ 설정</h1>
          </div>

          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">다크 모드</div>
                <div className="setting-desc">어두운 배경 사용</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">알림 소리</div>
                <div className="setting-desc">타이머 종료 시 소리</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">수능 날짜</div>
                <div className="setting-desc">D-Day 계산용</div>
              </div>
              <input
                type="date"
                className="date-input"
                value={dDay}
                onChange={(e) => setDDay(e.target.value)}
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-title">주간 목표</div>
                <div className="setting-desc">주당 목표 공부 시간 (분)</div>
              </div>
              <input
                type="number"
                className="number-input"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseInt(e.target.value) || 0)}
                min="0"
                step="60"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 통계 화면
  if (showStats) {
    const todayStats = getTodayStats();
    const totalMinutes = getTotalMinutesToday();
    const weeklyMinutes = getWeeklyMinutes();
    const weeklyProgress = (weeklyMinutes / weeklyGoal) * 100;

    return (
      <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="container">
          <div className="stats-header">
            <button className="back-btn" onClick={() => setShowStats(false)}>
              ← 돌아가기
            </button>
            <h1>📊 공부 통계</h1>
          </div>

          <div className="stats-summary">
            <div className="total-time">
              <div className="label">오늘 총 공부시간</div>
              <div className="value">
                {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분
              </div>
            </div>
          </div>

          <div className="weekly-stats">
            <h2>📅 주간 통계</h2>
            <div className="weekly-info">
              <div className="weekly-item">
                <span>이번 주 공부:</span>
                <strong>{Math.floor(weeklyMinutes / 60)}시간 {weeklyMinutes % 60}분</strong>
              </div>
              <div className="weekly-item">
                <span>주간 목표:</span>
                <strong>{Math.floor(weeklyGoal / 60)}시간</strong>
              </div>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                />
              </div>
              <span className="progress-text">
                {Math.round(weeklyProgress)}% 달성
              </span>
            </div>
          </div>

          <div className="stats-list">
            <h2>과목별 공부시간 (오늘)</h2>
            {subjects.filter(s => s.name !== '뽀모도로').map(subject => {
              const minutes = todayStats[subject.name] || 0;
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;

              return (
                <div key={subject.name} className="stat-item">
                  <div className="stat-header">
                    <span className="stat-subject">
                      {subject.emoji} {subject.name}
                    </span>
                    <span className="stat-time">
                      {hours > 0 && `${hours}시간 `}{mins}분
                    </span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button className="clear-stats-btn" onClick={clearStats}>
            통계 초기화
          </button>
        </div>
      </div>
    );
  }

  // 타이머 실행 중
  if (isRunning) {
    return (
      <div className={`App timer-active ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <div className="timer-container">
          {mockExamMode && (
            <div className="mock-exam-progress">
              📝 모의고사 진행 중: {mockExamStep + 1} / {mockExamSchedule.length}
            </div>
          )}
          
          <div className="timer-header">
            <h2>
              {selectedSubject.emoji} {selectedSubject.name}
            </h2>
          </div>

          <div
            className={`timer-display ${isWarningTime() && !isBreakTime ? 'warning' : ''} ${
              isCriticalTime() && !isBreakTime ? 'critical' : ''
            } ${isBreakTime ? 'break-mode' : ''}`}
          >
            <div className="time">{formatTime(timeLeft)}</div>
            {!isBreakTime && isWarningTime() && !isCriticalTime() && (
              <div className="alert-text">⚠️ 10분 전! OMR 준비!</div>
            )}
            {!isBreakTime && isCriticalTime() && (
              <div className="alert-text critical-alert">🚨 5분 남음! 마킹 확인!</div>
            )}
            {isBreakTime && (
              <div className="break-text">☕ 휴식 시간</div>
            )}
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${getProgress()}%`,
                backgroundColor: selectedSubject.color,
              }}
            />
          </div>

          <div className="timer-controls">
            <button className="btn btn-pause" onClick={pauseTimer}>
              {isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
            </button>
            <button className="btn btn-stop" onClick={stopTimer}>
              ⏹️ 종료
            </button>
          </div>

          {isPaused && (
            <div className="paused-overlay">
              <div className="pause-main">일시정지됨</div>
              <div className="pause-tip">💡 {pauseTip}</div>
            </div>
          )}
          {showCompletion && (
            <div className="completion-overlay">
              <div className="completion-message">
                {currentTip}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 메인 화면
  const daysLeft = getDaysUntilExam();
  const completedChecklistCount = checklist.filter(item => item.completed).length;
  const streak = getStudyStreak();
  const weeklyMinutes = getWeeklyMinutes();
  
  return (
    <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="container">
        <div className="header">
          <h1>⏰ 수능 마스터 타이머</h1>
          <p className="subtitle">실전처럼 연습하세요!</p>
          <div className="header-buttons">
            <button className="icon-btn" onClick={() => setShowChecklist(true)} title="체크리스트">
              ✅
            </button>
            <button className="icon-btn" onClick={() => setShowNotes(true)} title="메모장">
              📝
            </button>
            <button className="icon-btn" onClick={() => setShowStats(true)} title="통계">
              📊
            </button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="설정">
              ⚙️
            </button>
          </div>
        </div>

        {daysLeft > 0 && (
          <div className="dday-banner">
            🎯 수능까지 <strong>D-{daysLeft}</strong>
          </div>
        )}

        {streak > 0 && (
          <div className="streak-banner">
            🔥 <strong>{streak}일</strong> 연속 공부 중!
          </div>
        )}

        <div className="quick-info">
          <div className="quick-info-item">
            <span>오늘:</span>
            <strong>{Math.floor(getTotalMinutesToday() / 60)}h {getTotalMinutesToday() % 60}m</strong>
          </div>
          <div className="quick-info-item">
            <span>이번 주:</span>
            <strong>{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m</strong>
          </div>
          <div className="quick-info-item">
            <span>체크리스트:</span>
            <strong>{completedChecklistCount} / {checklist.length}</strong>
          </div>
        </div>

        <button className="mock-exam-btn" onClick={() => setShowMockExam(true)}>
          📝 실전 모의고사 모드
        </button>

        <div className="subject-grid">
          {subjects.map((subject) => (
            <div
              key={subject.name}
              className="subject-card"
              style={{ borderColor: subject.color }}
              onClick={() => startTimer(subject)}
            >
              <div className="subject-emoji">{subject.emoji}</div>
              <div className="subject-name">{subject.name}</div>
              <div className="subject-time">{subject.time}분</div>
            </div>
          ))}
        </div>

        <div className="info-box">
          <p>💡 과목을 선택하면 타이머가 시작됩니다</p>
          <p>⚠️ 10분 전부터 노란색으로 경고합니다</p>
          <p>🚨 5분 전부터 빨간색으로 표시됩니다</p>
          <p>🍅 뽀모도로: 25분 집중 공부 모드</p>
        </div>
      </div>
    </div>
  );
}

export default App;