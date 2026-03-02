import { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { Plus, Trash2 } from 'lucide-react';

export default function App() {
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
      scale: 3, // 🔥 고해상도
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `DAY${dayNumber}_1080.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6 gap-10">
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
