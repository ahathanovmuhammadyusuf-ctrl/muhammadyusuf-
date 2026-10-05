import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TestResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Percent,
  Check,
  X,
  HelpCircle,
  RotateCcw,
  Home,
  BarChart3,
  FileText,
  Share2,
  Download,
  Trophy,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StudentResultModalProps {
  result: TestResult;
  onClose: () => void;
  onRetake?: () => void;
}

export const StudentResultModal: React.FC<StudentResultModalProps> = ({
  result,
  onClose,
  onRetake,
}) => {
  const { user } = useAuth();

  const [activeView, setActiveView] = useState<'summary' | 'reviews' | 'history' | 'certificate'>('summary');
  const [filterReview, setFilterReview] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [historyResults, setHistoryResults] = useState<TestResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Calculate question metrics
  const correctCount = result.reviews ? result.reviews.filter((r) => r.is_correct).length : Math.round((result.earned_points / (result.max_points || 1)) * 20);
  const totalQuestions = result.reviews ? result.reviews.length : (result.max_points || 20);
  const incorrectCount = Math.max(0, totalQuestions - correctCount);

  const minutes = Math.floor(result.duration_seconds / 60);
  const seconds = result.duration_seconds % 60;
  const durationText = `${minutes} daqiqa ${seconds} soniya`;
  const durationShort = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Confetti on mount if passed
  useEffect(() => {
    if (result.passed) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch (e) {
        // ignore
      }
    }

    // Fetch student history
    if (user?.phone) {
      setLoadingHistory(true);
      fetch(`/api/teacher/results?search=${encodeURIComponent(user.phone)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setHistoryResults(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [result.passed, user?.phone]);

  // Circular gauge math (radius = 64, circumference ≈ 402)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, result.percentage)) / 100) * circumference;

  // History stats
  const allPercentages = historyResults.map((h) => h.percentage);
  const bestScore = allPercentages.length > 0 ? Math.max(...allPercentages, result.percentage) : result.percentage;
  const avgScore = allPercentages.length > 0
    ? Math.round(([...allPercentages, result.percentage].reduce((a, b) => a + b, 0) / (allPercentages.length + 1)) * 10) / 10
    : result.percentage;

  const chartData = [
    ...historyResults.map((r, i) => ({
      name: `Test ${i + 1}`,
      foiz: r.percentage,
      ball: r.earned_points,
    })),
    {
      name: 'Hozirgi',
      foiz: result.percentage,
      ball: result.earned_points,
    },
  ];

  const filteredReviews = (result.reviews || []).filter((r) => {
    if (filterReview === 'correct') return r.is_correct;
    if (filterReview === 'incorrect') return !r.is_correct;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Top Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>Natijalar Markazi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            🎉 TEST YAKUNLANDI!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {user ? `${user.first_name} ${user.last_name}` : "O'quvchi"} · {result.test_title || 'Online Test'}
          </p>
        </div>

        {/* View Switcher Tabs (Summary / Reviews / History / Certificate) */}
        <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold">
          <button
            onClick={() => setActiveView('summary')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeView === 'summary'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Umumiy Natija
          </button>
          {result.reviews && result.reviews.length > 0 && (
            <button
              onClick={() => setActiveView('reviews')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                activeView === 'reviews'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Javoblar Tahlili ({result.reviews.length})
            </button>
          )}
          <button
            onClick={() => setActiveView('history')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeView === 'history'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Statistika & Tarix
          </button>
          <button
            onClick={() => setActiveView('certificate')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer ${
              activeView === 'certificate'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Sertifikat
          </button>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: SUMMARY & CIRCULAR GAUGE (Section 8) */}
        {/* ======================================================== */}
        {activeView === 'summary' && (
          <div className="space-y-6">
            {/* Circular Progress Gauge */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* SVG Circle */}
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-gray-100 dark:text-gray-800"
                    fill="transparent"
                  />
                  {/* Foreground Progress */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${
                      result.passed
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }`}
                    fill="transparent"
                  />
                </svg>

                {/* Content Inside Circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {result.percentage}%
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                    {result.earned_points} / {result.max_points} ball
                  </span>
                  <span
                    className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      result.passed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {result.passed ? "✅ O‘TDINGIZ" : "❌ O‘TMADINGIZ"}
                  </span>
                </div>
              </div>

              {/* Time taken */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Sarflangan vaqt: <strong>{durationText}</strong></span>
              </div>
            </div>

            {/* Detailed Metric Cards (Section 8 Specifications) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              {/* To'g'ri javoblar */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">
                  To‘g‘ri javoblar
                </span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {correctCount} ta
                </p>
              </div>

              {/* Noto'g'ri javoblar */}
              <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50">
                <span className="text-[11px] font-semibold text-red-700 dark:text-red-300 block">
                  Noto‘g‘ri javoblar
                </span>
                <p className="text-xl font-black text-red-700 dark:text-red-300 mt-1">
                  {incorrectCount} ta
                </p>
              </div>

              {/* Foiz */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block">
                  Umumiy foiz
                </span>
                <p className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
                  {result.percentage}%
                </p>
              </div>

              {/* Ball */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                  To‘plangan ball
                </span>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  {result.earned_points} / {result.max_points}
                </p>
              </div>

              {/* Vaqt */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                  Sarflangan vaqt
                </span>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-1 font-mono">
                  {durationShort}
                </p>
              </div>

              {/* Tab switch */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                  Oynadan chiqish
                </span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {result.tab_switch_count} marta
                </p>
              </div>
            </div>

            {/* Quick Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {result.reviews && result.reviews.length > 0 && (
                <button
                  onClick={() => setActiveView('reviews')}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>JAVOBLARNI KO‘RISH</span>
                </button>
              )}

              {onRetake && (
                <button
                  onClick={onRetake}
                  className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Qayta topshirish</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Bosh sahifa</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: JAVOBLARNI TAHLIL QILISH (Section 9) */}
        {/* ======================================================== */}
        {activeView === 'reviews' && (
          <div className="space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Barcha Savollar Tahlili ({filteredReviews.length} ta)
              </span>

              <div className="flex gap-1">
                <button
                  onClick={() => setFilterReview('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    filterReview === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Hammasi
                </button>
                <button
                  onClick={() => setFilterReview('correct')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    filterReview === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  To‘g‘ri ({correctCount})
                </button>
                <button
                  onClick={() => setFilterReview('incorrect')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                    filterReview === 'incorrect'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Xato ({incorrectCount})
                </button>
              </div>
            </div>

            {/* Questions review list */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredReviews.map((rev, idx) => {
                const studentChosenOpt = rev.options.find((o) => o.id === rev.selected_option_id);
                const correctOpt = rev.options.find((o) => o.is_correct);

                return (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      rev.is_correct
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-red-200 dark:border-red-800/60 bg-red-50/20 dark:bg-red-950/20'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {rev.is_correct ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            ✓
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            ✕
                          </span>
                        )}
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          Savol {idx + 1}
                        </h4>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          rev.is_correct
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {rev.points_earned} / {rev.points} ball
                      </span>
                    </div>

                    {/* Question text */}
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 mt-2 leading-relaxed">
                      {rev.question_text}
                    </p>

                    {/* Student answer vs Correct answer (Section 9 exact display) */}
                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 font-semibold w-28 flex-shrink-0">
                          Sizning javobingiz:
                        </span>
                        <span
                          className={`font-bold ${
                            rev.is_correct
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400 line-through'
                          }`}
                        >
                          {studentChosenOpt ? `${studentChosenOpt.option_letter}) ${studentChosenOpt.option_text}` : "Javob berilmagan"}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 font-semibold w-28 flex-shrink-0">
                          To‘g‘ri javob:
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {correctOpt ? `${correctOpt.option_letter}) ${correctOpt.option_text}` : "Noma'lum"}
                        </span>
                      </div>
                    </div>

                    {/* Explanation if provided */}
                    {rev.explanation && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <span className="text-sm">💡</span>
                        <div>
                          <strong>Izoh:</strong> {rev.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: NATIJALAR TARIXI & QIZIQARLI STATISTIKA (Sections 10 & 11) */}
        {/* ======================================================== */}
        {activeView === 'history' && (
          <div className="space-y-6">
            {/* Interesting Stats (Section 11) */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                <span className="text-amber-600 text-lg">🏆</span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mt-1">
                  Eng yaxshi natija
                </span>
                <p className="text-lg font-black text-amber-700 dark:text-amber-300">
                  {bestScore}%
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
                <span className="text-blue-600 text-lg">🎯</span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mt-1">
                  O‘rtacha natija
                </span>
                <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                  {avgScore}%
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50">
                <span className="text-purple-600 text-lg">⏱</span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block mt-1">
                  O‘rtacha vaqt
                </span>
                <p className="text-lg font-black text-purple-700 dark:text-purple-300">
                  {durationShort}
                </p>
              </div>
            </div>

            {/* Bilim O'sishi Grafigi (Section 10) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>📈 Bilim O‘sishi Dinamikasi</span>
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Natija']}
                    />
                    <Line
                      type="monotone"
                      dataKey="foiz"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#2563eb' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List of past results */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                📊 Barcha Sinovlar Tarixi ({chartData.length} ta)
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {item.name === 'Hozirgi' ? 'Joriy topshirilgan test' : `Sinov #${idx + 1}`}
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {item.foiz}% ({item.ball} ball)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: SERTIFIKAT (Section 11) */}
        {/* ======================================================== */}
        {activeView === 'certificate' && (
          <div className="space-y-4">
            {/* Certificate Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-amber-950/20 border-4 border-amber-300 dark:border-amber-600/60 shadow-xl text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-6xl opacity-10">🎓</div>

              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  MUVAFFAQIYAT SERTIFIKATI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {user ? `${user.first_name} ${user.last_name}` : "O'quvchi"}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  TestPlatform Pro tizimida <strong>{result.test_title || 'Online Test'}</strong> sinovidan
                  muvaffaqiyatli o‘tib, quyidagi ko‘rsatkichni qayd etdi:
                </p>
              </div>

              {/* Certificate metrics */}
              <div className="inline-flex items-center gap-6 px-6 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 shadow-sm text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Natija</span>
                  <strong className="text-base text-emerald-600 dark:text-emerald-400 font-bold">
                    {result.percentage}%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Ball</span>
                  <strong className="text-base text-gray-900 dark:text-white font-bold">
                    {result.earned_points}/{result.max_points}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Sana</span>
                  <strong className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                    {new Date(result.created_at).toLocaleDateString('uz-UZ')}
                  </strong>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 pt-2">
                Sertifikat raqami: TP-{result.id.slice(-8).toUpperCase()} · TestPlatform Pro Verified
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Sertifikatni Chop Etish / Saqlash</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
