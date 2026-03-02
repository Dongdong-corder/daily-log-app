import { useState, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Plus, Trash2, User, LogOut } from 'lucide-react';

export default function App() {
  /* ---------------- 닉네임 시스템 ---------------- */
  const [currentUser, setCurrentUser] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  /* ---------------- DAY 번호 ---------------- */
  const [dayNumber, setDayNumber] = useState(1);

  /* ---------------- 색상 테마 ---------------- */
  const pastelColors = [
    '#F9A8D4', // 핑크
    '#A5B4FC', // 라벤더
    '#86EFAC', // 민트
    '#FCD34D', // 옐로우
    '#FDBA74', // 피치
  ];
  const [themeColor, setThemeColor] = useState(pastelColors[0]);

  /* ---------------- 날짜 ---------------- */
  const [customDate, setCustomDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  /* ---------------- 공부 시간 ---------------- */
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(30);

  /* ---------------- 할 일 ---------------- */
  const [tasks, setTasks] = useState([
    { id: 1, text: 'React 복습', checked: false },
  ]);

  /* ---------------- 초기 로드: 닉네임 확인 ---------------- */
  useEffect(() => {
    const savedUser = localStorage.getItem('dailylog_current_user');
    if (savedUser) {
      setCurrentUser(savedUser);
      loadUserData(savedUser);
    } else {
      setShowNicknameModal(true);
    }
  }, []);

  /* ---------------- 사용자 데이터 저장 ---------------- */
  const saveUserData = (username) => {
    const userData = {
      dayNumber,
      themeColor,
      customDate,
      hours,
      minutes,
      tasks,
    };
    localStorage.setItem(`dailylog_data_${username}`, JSON.stringify(userData));
  };

  /* ---------------- 사용자 데이터 로드 ---------------- */
  const loadUserData = (username) => {
    const saved = localStorage.getItem(`dailylog_data_${username}`);
    if (saved) {
      const data = JSON.parse(saved);
      setDayNumber(data.dayNumber || 1);
      setThemeColor(data.themeColor || pastelColors[0]);
      setCustomDate(data.customDate || new Date().toISOString().split('T')[0]);
      setHours(data.hours || 2);
      setMinutes(data.minutes || 30);
      setTasks(data.tasks || [{ id: 1, text: 'React 복습', checked: false }]);
    }
  };

  /* ---------------- 데이터 변경 시 자동 저장 ---------------- */
  useEffect(() => {
    if (currentUser) {
      saveUserData(currentUser);
    }
  }, [dayNumber, themeColor, customDate, hours, minutes, tasks, currentUser]);

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
  };

  /* ---------------- 닉네임 변경 (로그아웃) ---------------- */
  const handleLogout = () => {
    if (confirm('다른 닉네임으로 변경하시겠습니까?\n(현재 데이터는 저장됩니다)')) {
      setShowNicknameModal(true);
    }
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

  /* ---------------- 누적 공부시간 계산 ---------------- */
  const totalMinutes = useMemo(() => {
    return Number(hours) * 60 + Number(minutes);
  }, [hours, minutes]);

  const totalHoursFormatted = `${Math.floor(totalMinutes / 60)}H ${
    totalMinutes % 60
  }M`;

  /* ---------------- 다운로드 ---------------- */
  const downloadSlide = async () => {
    const element = document.getElementById('capture-area');

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `DAY${dayNumber}_${currentUser}_1080.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut size={16} />
          닉네임 변경
        </button>
      </div>

      {/* ================= 입력 패널 ================= */}
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-xl font-bold mb-4">📘 DAILY LOG 설정</h1>

        {/* DAY 번호 */}
        <label className="block text-sm font-semibold mb-2">DAY 번호</label>
        <input
          type="number"
          min="1"
          value={dayNumber}
          onChange={(e) => setDayNumber(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

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

        {/* 날짜 선택 */}
        <label className="block text-sm font-semibold mb-2">날짜 선택</label>
        <input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        {/* 공부 시간 */}
        <label className="block text-sm font-semibold mb-2">
          공부 시간 설정
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

        <div className="text-center font-semibold mb-4">📅 {customDate}</div>

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