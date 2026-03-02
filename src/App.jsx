import { useState, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Plus, Trash2, User, LogOut, Calendar, ChevronLeft, ChevronRight, Cloud, CloudOff, Download, Upload } from 'lucide-react';

// ⚠️ AWS API 엔드포인트 (여러분의 URL로 변경하세요!)
const AWS_API_URL = 'https://9z2081l90b.execute-api.us-east-1.amazonaws.com/prod';

export default function App() {
  /* ---------------- 닉네임 시스템 ---------------- */
  const [currentUser, setCurrentUser] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  /* ---------------- 클라우드 동기화 상태 ---------------- */
  const [cloudStatus, setCloudStatus] = useState('idle'); // idle, syncing, success, error
  const [lastCloudSync, setLastCloudSync] = useState(null);
  const [cloudMessage, setCloudMessage] = useState('');

  /* ---------------- 색상 테마 ---------------- */
  const pastelColors = [
    '#F9A8D4', // 핑크
    '#A5B4FC', // 라벤더
    '#86EFAC', // 민트
    '#FCD34D', // 옐로우
    '#FDBA74', // 피치
  ];
  const [themeColor, setThemeColor] = useState(pastelColors[0]);

  /* ---------------- 날짜 (자동으로 오늘 날짜) ---------------- */
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  /* ---------------- 공부 시간 (선택된 날짜) ---------------- */
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  /* ---------------- 날짜별 공부 기록 (히스토리) ---------------- */
  const [studyHistory, setStudyHistory] = useState({});

  /* ---------------- 할 일 ---------------- */
  const [tasks, setTasks] = useState([
    { id: 1, text: 'React 복습', checked: false },
  ]);

  /* ---------------- 히스토리 뷰 토글 ---------------- */
  const [showHistory, setShowHistory] = useState(false);

  /* ---------------- DAY 번호 자동 계산 ---------------- */
  const dayNumber = useMemo(() => {
    const studyDays = Object.entries(studyHistory).filter(([date, data]) => {
      const totalMinutes = (data.hours || 0) * 60 + (data.minutes || 0);
      return totalMinutes > 0 && date <= selectedDate;
    });
    return studyDays.length;
  }, [studyHistory, selectedDate]);

  /* ---------------- AWS 클라우드 함수들 ---------------- */
  
  // 클라우드에 저장
  const saveToCloud = async () => {
    if (!currentUser) return;
    
    setCloudStatus('syncing');
    setCloudMessage('클라우드에 백업 중...');
    
    try {
      const response = await fetch(`${AWS_API_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: currentUser,
          data: {
            themeColor,
            studyHistory,
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCloudStatus('success');
        setLastCloudSync(new Date().toISOString());
        setCloudMessage('클라우드 백업 완료! ✅');
        
        // 로컬에도 마지막 동기화 시간 저장
        localStorage.setItem(`dailylog_last_sync_${currentUser}`, new Date().toISOString());
        
        setTimeout(() => {
          setCloudStatus('idle');
          setCloudMessage('');
        }, 3000);
      } else {
        throw new Error(result.message || '백업 실패');
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      setCloudStatus('error');
      setCloudMessage('백업 실패: ' + error.message);
      
      setTimeout(() => {
        setCloudStatus('idle');
        setCloudMessage('');
      }, 5000);
    }
  };
  
  // 클라우드에서 불러오기
  const loadFromCloud = async () => {
    if (!currentUser) return;
    
    const confirmLoad = confirm(
      '클라우드에서 데이터를 불러오면 현재 로컬 데이터가 덮어씌워집니다.\n계속하시겠습니까?'
    );
    
    if (!confirmLoad) return;
    
    setCloudStatus('syncing');
    setCloudMessage('클라우드에서 불러오는 중...');
    
    try {
      const response = await fetch(
        `${AWS_API_URL}/load?nickname=${encodeURIComponent(currentUser)}`
      );
      
      const result = await response.json();
      
      if (result.success) {
        // 데이터 복원
        setThemeColor(result.data.themeColor || pastelColors[0]);
        setStudyHistory(result.data.studyHistory || {});
        
        setCloudStatus('success');
        setLastCloudSync(result.lastUpdated);
        setCloudMessage('클라우드에서 복구 완료! ✅');
        
        // 로컬 스토리지에도 저장
        localStorage.setItem(`dailylog_data_${currentUser}`, JSON.stringify(result.data));
        localStorage.setItem(`dailylog_last_sync_${currentUser}`, result.lastUpdated);
        
        setTimeout(() => {
          setCloudStatus('idle');
          setCloudMessage('');
        }, 3000);
      } else if (result.isNewUser) {
        setCloudStatus('error');
        setCloudMessage('클라우드에 저장된 데이터가 없습니다.');
        
        setTimeout(() => {
          setCloudStatus('idle');
          setCloudMessage('');
        }, 3000);
      } else {
        throw new Error(result.message || '불러오기 실패');
      }
    } catch (error) {
      console.error('Cloud load error:', error);
      setCloudStatus('error');
      setCloudMessage('불러오기 실패: ' + error.message);
      
      setTimeout(() => {
        setCloudStatus('idle');
        setCloudMessage('');
      }, 5000);
    }
  };

  /* ---------------- 초기 로드: 닉네임 확인 ---------------- */
  useEffect(() => {
    const savedUser = localStorage.getItem('dailylog_current_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      loadUserData(savedUser);
      
      // 마지막 클라우드 동기화 시간 불러오기
      const lastSync = localStorage.getItem(`dailylog_last_sync_${savedUser}`);
      if (lastSync) {
        setLastCloudSync(lastSync);
      }
    } else {
      setShowNicknameModal(true);
    }
  }, []);

  /* ---------------- 사용자 데이터 저장 (로컬) ---------------- */
  const saveUserData = (username) => {
    const userData = {
      themeColor,
      studyHistory,
    };
    localStorage.setItem(`dailylog_data_${username}`, JSON.stringify(userData));
  };

  /* ---------------- 사용자 데이터 로드 (로컬) ---------------- */
  const loadUserData = (username) => {
    const saved = localStorage.getItem(`dailylog_data_${username}`);
    if (saved) {
      const data = JSON.parse(saved);
      setThemeColor(data.themeColor || pastelColors[0]);
      setStudyHistory(data.studyHistory || {});
    }
  };

  /* ---------------- 선택된 날짜의 데이터 로드 ---------------- */
  useEffect(() => {
    if (studyHistory[selectedDate]) {
      const dayData = studyHistory[selectedDate];
      setHours(dayData.hours || 0);
      setMinutes(dayData.minutes || 0);
      setTasks(dayData.tasks || [{ id: 1, text: 'React 복습', checked: false }]);
    } else {
      setHours(0);
      setMinutes(0);
      setTasks([{ id: 1, text: 'React 복습', checked: false }]);
    }
  }, [selectedDate]);

  /* ---------------- 데이터 변경 시 자동 저장 (로컬 + 클라우드) ---------------- */
  useEffect(() => {
    if (!currentUser) return;

    // 로컬 저장 (디바운스)
    const timer = setTimeout(() => {
      setStudyHistory(prev => ({
        ...prev,
        [selectedDate]: {
          hours: Number(hours),
          minutes: Number(minutes),
          tasks: tasks,
        },
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [hours, minutes, tasks, selectedDate, currentUser]);

  /* ---------------- localStorage에 저장 ---------------- */
  useEffect(() => {
    if (currentUser) {
      saveUserData(currentUser);
    }
  }, [studyHistory, themeColor, currentUser]);

  /* ---------------- 자동 클라우드 백업 (5분마다) ---------------- */
  useEffect(() => {
    if (!currentUser) return;
    
    // 5분마다 자동 백업
    const autoBackup = setInterval(() => {
      saveToCloud();
    }, 5 * 60 * 1000); // 5분
    
    return () => clearInterval(autoBackup);
  }, [currentUser, themeColor, studyHistory]);

  /* ---------------- 닉네임 등록 ---------------- */
  const handleNicknameSubmit = () => {
    const trimmed = nicknameInput.trim();
    if (trimmed.length < 2) {
      alert('닉네임은 최소 2글자 이상이어야 합니다.');
      return;
    }
    localStorage.setItem('dailylog_current_user', trimmed);
    setCurrentUser(trimmed);
    loadUserData(trimmed);
    setShowNicknameModal(false);
    setNicknameInput('');
    
    // 클라우드에서 데이터 불러오기 시도
    setTimeout(() => {
      const tryLoad = confirm('클라우드에 저장된 데이터를 불러오시겠습니까?\n(없으면 새로 시작합니다)');
      if (tryLoad) {
        loadFromCloud();
      }
    }, 500);
  };

  /* ---------------- 닉네임 변경 (로그아웃) ---------------- */
  const handleLogout = () => {
    if (confirm('다른 닉네임으로 변경하시겠습니까?\n(현재 데이터는 저장됩니다)')) {
      setShowNicknameModal(true);
    }
  };

  /* ---------------- 날짜 이동 ---------------- */
  const changeDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };

  /* ---------------- 오늘로 돌아가기 ---------------- */
  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  /* ---------------- 할 일 관리 ---------------- */
  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), text: '', checked: false }]);
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const updateTask = (id, value) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text: value } : t)));
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  /* ---------------- 총 누적 시간 계산 ---------------- */
  const totalAccumulatedMinutes = useMemo(() => {
    let total = 0;
    Object.values(studyHistory).forEach((day) => {
      total += (day.hours || 0) * 60 + (day.minutes || 0);
    });
    return total;
  }, [studyHistory]);

  const totalHoursFormatted = `${Math.floor(totalAccumulatedMinutes / 60)}H ${
    totalAccumulatedMinutes % 60
  }M`;

  /* ---------------- 히스토리 목록 생성 ---------------- */
  const historyList = useMemo(() => {
    return Object.entries(studyHistory)
      .map(([date, data]) => ({
        date,
        hours: data.hours || 0,
        minutes: data.minutes || 0,
        totalMinutes: (data.hours || 0) * 60 + (data.minutes || 0),
      }))
      .filter((record) => record.totalMinutes > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [studyHistory]);

  /* ---------------- 다운로드 ---------------- */
  const downloadSlide = async () => {
    const element = document.getElementById('capture-area');

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `DAY${dayNumber}_${currentUser}_${selectedDate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  /* ---------------- 마지막 동기화 시간 포맷 ---------------- */
  const formatSyncTime = (isoString) => {
    if (!isoString) return '없음';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
    return `${Math.floor(diffMins / 1440)}일 전`;
  };

  /* ---------------- 닉네임 입력 모달 ---------------- */
  if (showNicknameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <User className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Daily Log 📚
            </h1>
            <p className="text-gray-600">사용할 닉네임을 입력해주세요</p>
          </div>

          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNicknameSubmit()}
            placeholder="닉네임 (2글자 이상)"
            className="w-full border-2 border-purple-200 p-4 rounded-xl mb-4 text-lg focus:border-purple-400 focus:outline-none"
            autoFocus
          />

          <button
            onClick={handleNicknameSubmit}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-xl transition-colors"
          >
            시작하기
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            💡 닉네임별로 독립적인 데이터가 저장됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 gap-10">
      {/* ================= 상단 사용자 정보 ================= */}
      <div className="w-full max-w-md flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-gray-700">{currentUser}</span>
          
          {/* 클라우드 상태 아이콘 */}
          {cloudStatus === 'syncing' && (
            <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
          )}
          {cloudStatus === 'success' && (
            <Cloud className="w-4 h-4 text-green-500" />
          )}
          {cloudStatus === 'error' && (
            <CloudOff className="w-4 h-4 text-red-500" />
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut size={16} />
          닉네임 변경
        </button>
      </div>

      {/* ================= 클라우드 메시지 ================= */}
      {cloudMessage && (
        <div className={`w-full max-w-md px-4 py-2 rounded-lg text-sm text-center ${
          cloudStatus === 'success' ? 'bg-green-100 text-green-700' :
          cloudStatus === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {cloudMessage}
        </div>
      )}

      {/* ================= 입력 패널 ================= */}
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">📘 DAILY LOG 설정</h1>
          
          {/* 클라우드 동기화 버튼들 */}
          <div className="flex gap-2">
            <button
              onClick={saveToCloud}
              disabled={cloudStatus === 'syncing'}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="클라우드에 백업"
            >
              <Upload size={16} />
            </button>
            <button
              onClick={loadFromCloud}
              disabled={cloudStatus === 'syncing'}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="클라우드에서 복구"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* 마지막 동기화 시간 */}
        {lastCloudSync && (
          <div className="text-xs text-gray-500 mb-4 text-center">
            ☁️ 마지막 클라우드 동기화: {formatSyncTime(lastCloudSync)}
          </div>
        )}

        {/* DAY 번호 (자동 계산 - 읽기 전용) */}
        <label className="block text-sm font-semibold mb-2">DAY 번호 (자동)</label>
        <div className="w-full border bg-gray-50 p-2 rounded mb-4 text-center font-bold text-lg text-purple-600">
          DAY {dayNumber}
        </div>
        <p className="text-xs text-gray-500 mb-4 -mt-2">
          💡 공부 기록이 있는 날짜를 자동으로 카운트합니다
        </p>

        {/* 색상 선택 */}
        <label className="block text-sm font-semibold mb-2">테마 색상</label>
        <div className="flex gap-3 mb-4">
          {pastelColors.map((color) => (
            <button
              key={color}
              onClick={() => setThemeColor(color)}
              className="w-8 h-8 rounded-full border-2"
              style={{
                backgroundColor: color,
                borderColor: themeColor === color ? '#000' : 'transparent',
              }}
            />
          ))}
        </div>

        {/* 날짜 선택 네비게이션 */}
        <label className="block text-sm font-semibold mb-2">날짜 선택</label>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 border rounded hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 border p-2 rounded text-center font-semibold"
          />
          
          <button
            onClick={() => changeDate(1)}
            className="p-2 border rounded hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg mb-4 font-semibold text-sm hover:bg-blue-200"
        >
          📅 오늘로 돌아가기
        </button>

        {/* 공부 시간 입력 */}
        <label className="block text-sm font-semibold mb-2">
          {selectedDate === getTodayDate() ? '오늘' : selectedDate} 공부 시간
        </label>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full border p-2 rounded text-center"
            />
            <div className="text-center text-xs mt-1">시간 (H)</div>
          </div>

          <div className="flex-1">
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full border p-2 rounded text-center"
            />
            <div className="text-center text-xs mt-1">분 (M)</div>
          </div>
        </div>

        {/* 총 누적 시간 표시 */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-purple-600 font-semibold mb-1">
              📊 전체 누적 공부 시간
            </div>
            <div className="text-3xl font-bold text-purple-700 mb-2">
              {totalHoursFormatted}
            </div>
            <div className="text-xs text-gray-600">
              총 {historyList.length}일 기록됨
            </div>
          </div>
        </div>

        {/* 히스토리 토글 버튼 */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg mb-4 font-semibold text-sm hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          <Calendar size={16} />
          {showHistory ? '히스토리 숨기기' : '히스토리 보기'}
        </button>

        {/* 히스토리 목록 */}
        {showHistory && (
          <div className="mb-4 max-h-64 overflow-y-auto border rounded-lg">
            {historyList.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                아직 기록된 데이터가 없습니다
              </div>
            ) : (
              historyList.map((record) => (
                <button
                  key={record.date}
                  onClick={() => setSelectedDate(record.date)}
                  className={`w-full p-3 border-b hover:bg-gray-50 text-left flex justify-between items-center ${
                    selectedDate === record.date ? 'bg-purple-50' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">
                      {record.date}
                      {record.date === getTodayDate() && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          오늘
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-purple-600 font-bold">
                    {record.hours}H {record.minutes}M
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* 할 일 */}
        <label className="block text-sm font-semibold mb-2">할 일 목록</label>

        <div className="space-y-2 mb-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={task.checked}
                onChange={() => toggleTask(task.id)}
              />
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateTask(task.id, e.target.value)}
                className="flex-1 border p-2 rounded"
                placeholder="할 일을 입력하세요"
              />
              <button
                onClick={() => removeTask(task.id)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addTask}
          className="flex items-center gap-1 text-sm bg-gray-800 text-white px-3 py-2 rounded-lg"
        >
          <Plus size={16} /> 할 일 추가
        </button>
      </div>

      {/* 다운로드 버튼 */}
      <button
        onClick={downloadSlide}
        className="bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg"
      >
        이미지 다운로드
      </button>

      {/* ================= 슬라이드 카드 ================= */}
      <div
        id="capture-area"
        className="w-[360px] aspect-square bg-white rounded-2xl shadow-xl flex flex-col p-6"
        style={{ borderTop: `12px solid ${themeColor}` }}
      >
        <h2
          className="text-2xl font-black text-center mb-4"
          style={{ color: themeColor }}
        >
          DAY {dayNumber} - DAILY LOG
        </h2>

        <div className="text-center font-semibold mb-4">📅 {selectedDate}</div>

        <div className="flex-1 space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`text-lg ${
                task.checked ? 'line-through text-gray-400' : 'text-gray-800'
              }`}
            >
              • {task.text || '할 일'}
            </div>
          ))}
        </div>

        <div
          className="mt-4 p-3 rounded-xl text-center font-bold border-2"
          style={{ borderColor: themeColor }}
        >
          📚 오늘 공부: {hours}H {minutes}M
          <br />⏱ 총 누적: {totalHoursFormatted}
        </div>
      </div>
    </div>
  );
}
