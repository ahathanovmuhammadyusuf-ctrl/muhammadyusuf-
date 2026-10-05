import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Question, QuestionOption, TestItem, TestResult } from '../../types';
import {
  saveAnswerLocally,
  getStoredAnswersForAttempt,
  clearStoredAnswers,
  saveActiveAttemptState,
  clearActiveAttemptState,
} from '../../lib/offlineDb';
import {
  Clock,
  WifiOff,
  Wifi,
  Eye,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Bookmark,
} from 'lucide-react';

interface StudentTestRunnerProps {
  testId: string;
  onFinish: (result: TestResult) => void;
  onCancel: () => void;
}

export const StudentTestRunner: React.FC<StudentTestRunnerProps> = ({
  testId,
  onFinish,
  onCancel,
}) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test data
  const [attemptId, setAttemptId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { [questionId]: optionId }

  // Timer states (calculated from server end time)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [serverEndTime, setServerEndTime] = useState<number>(0);

  // Monitoring & Offline
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tabSwitchNotice, setTabSwitchNotice] = useState(false);
  const [flagged, setFlagged] = useState<Record<string, boolean>>({}); // 🔖 Keyinroq ko'rish

  // 1. Initialize and start test with server
  useEffect(() => {
    let isMounted = true;

    async function initTest() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/student/tests/${testId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: user?.id }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Testni boshlashda xatolik yuz berdi');
        }

        if (!isMounted) return;

        setAttemptId(data.attempt.id);
        setQuestions(data.questions);

        // Calculate accurate remaining time from server_end_time vs server_current_time
        const serverEnd = new Date(data.attempt.server_end_time).getTime();
        const serverNow = data.attempt.server_current_time
          ? new Date(data.attempt.server_current_time).getTime()
          : Date.now();
        const remaining = Math.max(0, Math.floor((serverEnd - serverNow) / 1000));

        setServerEndTime(serverEnd);
        setRemainingSeconds(remaining);

        // Load offline cached answers & merge with server saved answers
        const cachedAnswers = await getStoredAnswersForAttempt(data.attempt.id);
        const mergedAnswers = { ...(data.savedAnswers || {}), ...cachedAnswers };
        if (Object.keys(mergedAnswers).length > 0) {
          setAnswers(mergedAnswers);
        }

        // Cache active attempt state
        saveActiveAttemptState({
          testId,
          attemptId: data.attempt.id,
          studentId: user?.id,
          serverEndTime: serverEnd,
        });
      } catch (err: any) {
        if (isMounted) setError(err?.message || "Testni yuklab bo'lmadi");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initTest();

    return () => {
      isMounted = false;
    };
  }, [testId, user?.id]);

  // 2. Timer Countdown
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, remainingSeconds]);

  // 3. Online / Offline listeners & Auto-sync on reconnection
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      if (attemptId) {
        const cached = await getStoredAnswersForAttempt(attemptId);
        if (Object.keys(cached).length > 0) {
          fetch(`/api/student/tests/${testId}/sync-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attemptId, answers: cached }),
          }).catch((e) => console.warn('Online sync error', e));
        }
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId, testId]);

  // 4. Tab Switch Detection (Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && attemptId && !submitting) {
        setTabSwitchCount((c) => c + 1);
        setTabSwitchNotice(true);
        setTimeout(() => setTabSwitchNotice(false), 5000);

        // Register event to server
        fetch(`/api/student/tests/${testId}/tab-switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            studentId: user?.id,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => console.warn('Tab switch log error:', err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, testId, user?.id, submitting]);

  // 5. Select Option handler with offline persistence & immediate server sync
  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      // Save locally to IndexedDB/localStorage immediately
      if (attemptId) {
        saveAnswerLocally(attemptId, questionId, optionId);
        // Background sync to server so server always has latest answers
        fetch(`/api/student/tests/${testId}/sync-answers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, answers: { [questionId]: optionId } }),
        }).catch((e) => console.warn('Background answer sync error', e));
      }
      return updated;
    });
  };

  // 6. Submit Test (Server-Side Grading)
  const handleSubmit = async () => {
    if (submitting || !attemptId) return;

    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch(`/api/student/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          studentId: user?.id,
          answers,
        }),
      });

      const resultData = await res.json();
      if (!res.ok) {
        throw new Error(resultData.error || 'Natijani qabul qilishda xatolik');
      }

      // Cleanup offline caches
      await clearStoredAnswers(attemptId);
      clearActiveAttemptState();

      // Trigger finish
      onFinish(resultData);
    } catch (err: any) {
      setError(err?.message || 'Testni topshirishda xatolik yuz berdi.');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Test savollari yuklanmoqda...
        </p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 text-center space-y-4 shadow-lg">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Xatolik yuz berdi</h2>
        <p className="text-xs text-gray-600 dark:text-gray-300">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isTimeCritical = remainingSeconds < 180; // less than 3 minutes
  const isOneMinuteLeft = remainingSeconds > 0 && remainingSeconds <= 60;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      {/* 1. STICKY TOP STATUS BAR */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Question progress */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Savol:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold">
              {currentIdx + 1} / {questions.length}
            </span>
            <span className="hidden sm:inline text-xs text-gray-400">
              (Javob berildi: {answeredCount}/{questions.length})
            </span>
          </div>

          {/* Sticky Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border transition-all ${
              isOneMinuteLeft
                ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-md shadow-red-500/30'
                : isTimeCritical
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${isOneMinuteLeft ? 'text-white' : isTimeCritical ? 'text-amber-600' : 'text-blue-600'}`} />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Finish button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TESTNI YAKUNLASH</span>
            <span className="sm:hidden">YAKUNLASH</span>
          </button>
        </div>

        {/* PROGRESS BAR (Visual: ████████░░░░) */}
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 1 Minute Warning Banner */}
        {isOneMinuteLeft && (
          <div className="max-w-4xl mx-auto px-4 py-1.5 bg-red-600 text-white text-xs text-center font-bold flex items-center justify-center gap-2 animate-pulse">
            <Clock className="w-4 h-4" />
            <span>Diqqat! Test vaqti tugashiga 1 daqiqadan kam vaqt qoldi. Vaqt tugagach test avtomatik topshiriladi!</span>
          </div>
        )}

        {/* Offline indicator banner */}
        {isOffline && (
          <div className="max-w-4xl mx-auto p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2 m-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>
              Internet aloqasi uzildi. Javoblaringiz vaqtincha qurilmada (IndexedDB) saqlanmoqda.
            </span>
          </div>
        )}

        {/* Tab switch notification banner */}
        {tabSwitchNotice && (
          <div className="max-w-4xl mx-auto p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 m-2 animate-bounce">
            <Eye className="w-4 h-4 flex-shrink-0" />
            <span>
              Diqqat! Test oynasidan chiqish qayd etildi (Oynadan chiqishlar: {tabSwitchCount} marta).
            </span>
          </div>
        )}
      </div>

      {/* 2. SAVOLLAR NAVIGATORI (Section 5: 1..20 Grid with Legend) */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-bold text-gray-900 dark:text-white">
              Savollar Navigatori ({answeredCount} / {questions.length} javoblandi)
            </span>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300" />
                <span>Hozirgi</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Javob berilgan</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Belgilangan 🔖</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span>Belgilanmagan</span>
              </span>
            </div>
          </div>

          {/* 1..20 Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-20 gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentIdx;
              const isFlagged = Boolean(flagged[q.id]);

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                    isCurrent
                      ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                      : isFlagged
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 hover:bg-amber-200'
                      : isAnswered
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={`${idx + 1}-savol${isFlagged ? ' (Belgilangan)' : ''}`}
                >
                  {idx + 1}
                  {isFlagged && !isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MAIN QUESTION CARD (Section 4: Katta card ko'rinishida) */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {currentQuestion && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-3">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {currentQuestion.type === 'TRUE_FALSE' ? "To‘g‘ri / Noto‘g‘ri savoli" : "Yagona to‘g‘ri javobli savol"}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFlagged((prev) => ({
                      ...prev,
                      [currentQuestion.id]: !prev[currentQuestion.id],
                    }))
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    flagged[currentQuestion.id]
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${flagged[currentQuestion.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{flagged[currentQuestion.id] ? 'Belgilangan 🔖' : 'Keyinroq ko‘rish'}</span>
                </button>

                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Qiymati: {currentQuestion.points} ball
                </span>
              </div>
            </div>

            {/* Question Text (Large, ultra-legible) */}
            <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
              {currentQuestion.question_text}
            </div>

            {/* Options list: Katta CARD ko'rinishida */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                    className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-50 shadow-md shadow-blue-500/10 scale-[1.01]'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    {/* Letter badge (A, B, C, D) */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 text-sm font-black transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option.option_letter}
                    </div>

                    {/* Option Text */}
                    <span className="text-base sm:text-lg font-medium leading-snug flex-1">
                      {option.option_text}
                    </span>

                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Nav inside Question Card */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ORQAGA</span>
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  <span>KEYINGI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>TESTNI YAKUNLASH</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION SUBMIT MODAL (Section 7 Exact Requirements) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-sm w-full p-6 sm:p-7 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
                answeredCount < questions.length
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
              }`}
            >
              {answeredCount < questions.length ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <CheckCircle className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {answeredCount < questions.length
                ? `Siz hali ${questions.length - answeredCount} ta savolga javob bermadingiz.`
                : 'Testni yakunlaysizmi?'}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {answeredCount < questions.length
                ? `Jami ${questions.length} ta savoldan ${answeredCount} tasiga javob berildi. Belgilanmagan savollar 0 ball hisoblanadi.`
                : 'Barcha savollarga javob berildi. Test yakunlangach darhol natijangiz chiqariladi.'}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                BEKOR QILISH
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? 'YUKLANMOQDA...' : 'YAKUNLASH'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
