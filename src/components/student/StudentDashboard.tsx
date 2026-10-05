import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TestItem, TestResult, Course, ChallengeDay } from '../../types';
import { CourseViewerModal } from './CourseViewerModal';
import {
  FileText,
  Clock,
  Award,
  CheckCircle,
  Play,
  RotateCcw,
  BarChart3,
  User,
  Phone,
  Users,
  Calendar,
  Flame,
  Zap,
  BookOpen,
  Sparkles,
  Trophy,
  Filter,
  Check,
  ChevronRight,
  Target,
  GraduationCap,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface StudentDashboardProps {
  onStartTest: (testId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartTest }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'tests' | 'courses' | 'challenge' | 'results' | 'profile'>('tests');
  const [testCategory, setTestCategory] = useState<'all' | 'new' | 'popular' | 'hard' | 'course'>('all');

  const [tests, setTests] = useState<TestItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [testForRules, setTestForRules] = useState<TestItem | null>(null);
  const [selectedCourseForView, setSelectedCourseForView] = useState<Course | null>(null);
  const [showChallengeCelebration, setShowChallengeCelebration] = useState(false);

  const fetchStudentData = () => {
    if (!user?.id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/student/tests?studentId=${user.id}`).then((res) => res.json()),
      fetch(`/api/teacher/results?search=${encodeURIComponent(user.phone || '')}`).then((res) =>
        res.json()
      ),
      fetch('/api/courses').then((res) => res.json()),
      fetch('/api/challenge/status').then((res) => res.json()),
    ])
      .then(([testsData, resultsData, coursesData, challengeData]) => {
        if (Array.isArray(testsData)) setTests(testsData);
        if (Array.isArray(resultsData)) setResults(resultsData);
        if (Array.isArray(coursesData)) setCourses(coursesData);
        if (challengeData?.challenges) setChallenges(challengeData.challenges);
      })
      .catch((err) => console.warn('Student data fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudentData();
  }, [user?.id]);

  const handleCompleteChallengeDay = async (dayNum: number) => {
    try {
      const res = await fetch('/api/challenge/complete-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_num: dayNum }),
      });
      const data = await res.json();
      if (data.success) {
        setChallenges((prev) =>
          prev.map((c) => (c.day_num === dayNum ? { ...c, is_completed: true, is_current: false } : c))
        );
        if (data.isAllCompleted) {
          setShowChallengeCelebration(true);
        }
      }
    } catch (e) {
      console.warn('Challenge complete err', e);
    }
  };

  // Weekly score chart: Dushanba 65%, Seshanba 72%, Chorshanba 80%, Payshanba 76%, Juma 88%
  const weeklyChartData = [
    { kun: 'Dushanba', foiz: 65, test: 'Python Asoslari' },
    { kun: 'Seshanba', foiz: 72, test: 'Web Layout' },
    { kun: 'Chorshanba', foiz: 80, test: 'Algoritmlar' },
    { kun: 'Payshanba', foiz: 76, test: 'Kiberxavfsizlik' },
    { kun: 'Juma', foiz: 88, test: 'Umumiy Intellekt' },
    { kun: 'Bugun', foiz: 90, test: 'Final Test' },
  ];

  // Filter tests by category
  const filteredTests = tests.filter((t) => {
    if (testCategory === 'all') return true;
    if (testCategory === 'new') return t.id === 'test-1';
    if (testCategory === 'popular') return t.id === 'test-1' || t.id === 'test-2';
    if (testCategory === 'hard') return t.passing_percentage >= 70;
    if (testCategory === 'course') return true;
    return true;
  });

  const levelList = ['Beginner', 'Starter', 'Junior', 'Intermediate', 'Advanced', 'Expert', 'Master'];
  const userLevel = user?.level || 'Advanced';
  const userXp = user?.xp || 740;
  const nextLevelXp = user?.next_level_xp || 1000;
  const xpPercent = Math.min(100, Math.round((userXp / nextLevelXp) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP STUDENT DASHBOARD BANNER */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wider uppercase text-blue-100 border border-white/20">
              <GraduationCap className="w-4 h-4" />
              <span>ILMHUB O‘QUVCHI KABINETI</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xush kelibsiz, {user?.last_name || 'Ahathanov'} {user?.first_name || 'Muhammadyusuf'}!
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold">
                <Users className="w-4 h-4 text-blue-200" />
                <span>Guruh: {user?.group_name || 'IT-01'}</span>
              </span>
              <span>·</span>
              <span>O‘qituvchi: {user?.teacher_name || 'Sardor Rahimov'}</span>
            </p>
          </div>

          {/* Level & XP Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 min-w-[260px] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Daraja: {userLevel}</span>
              </span>
              <span className="font-bold text-amber-300">{userXp} / {nextLevelXp} XP</span>
            </div>

            <div className="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${xpPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-blue-200">
              <span>Keyingi daraja: Expert</span>
              <span>{nextLevelXp - userXp} XP qoldi</span>
            </div>
          </div>
        </div>

        {/* 6 Key Stats Grid inside banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-6 mt-6 border-t border-white/15">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
            <span className="text-[11px] text-blue-200 block">📚 Kurslar</span>
            <strong className="text-base sm:text-lg font-black">{courses.length || 5} ta</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
            <span className="text-[11px] text-blue-200 block">📝 Testlar</span>
            <strong className="text-base sm:text-lg font-black">{results.length || 12} ta</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
            <span className="text-[11px] text-blue-200 block">🎯 O‘rtacha ball</span>
            <strong className="text-base sm:text-lg font-black">{user?.average_score || 87}%</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
            <span className="text-[11px] text-blue-200 block">🏆 Daraja</span>
            <strong className="text-base sm:text-lg font-black">{userLevel}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
            <span className="text-[11px] text-blue-200 block">🔥 Streak</span>
            <strong className="text-base sm:text-lg font-black text-amber-300">{user?.streak || 5} kun</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
            <span className="text-[11px] text-blue-200 block">⏱ O‘qilgan vaqt</span>
            <strong className="text-base sm:text-lg font-black">{user?.study_hours || 18.5} soat</strong>
          </div>
        </div>
      </div>

      {/* 2. STREAK RETENTION NOTICE (Streak uzilib qolmaslik bildirishnomasi) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Sizning 5 kunlik faollik streakingiz faol!</span>
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
              Streak uzilib qolmasligi uchun bugun kamida 1 ta test topshiring yoki dars ko‘ring.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('challenge')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer"
        >
          Bugungi vazifaga o‘tish →
        </button>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('tests')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Testlar Bo‘limi ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('challenge')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'challenge'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>7 Kunlik Challenge</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'courses'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kurslar ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'results'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Natijalar & Grafik ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Achievementlar</span>
        </button>
      </div>

      {/* TAB 1: TESTLAR BO'LIMI */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {/* Test Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Barcha testlar' },
              { id: 'new', label: 'Yangi testlar' },
              { id: 'popular', label: 'Ommabop testlar' },
              { id: 'hard', label: 'Qiyin testlar' },
              { id: 'course', label: 'Kurs testlari' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTestCategory(cat.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  testCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test, idx) => {
              const hasActive = Boolean(test.active_attempt_id);
              const difficulty = idx === 0 ? "O'rtacha" : idx === 1 ? 'Qiyin' : 'Oson';
              const attemptsCount = 142 + idx * 37;

              return (
                <div
                  key={test.id}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/50 hover:shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        O‘qituvchi: {test.teacher_name || 'Sardor Rahimov'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          difficulty === 'Qiyin'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : difficulty === "O'rtacha"
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
                      {test.title}
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {test.description || 'Umumiy bilim va intellektual salohiyatni baholash testi'}
                    </p>

                    {/* Specs Card */}
                    <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-center">
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
                        <span>{test.duration_minutes} daqiqa</span>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-center">
                        <FileText className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-500" />
                        <span>{test.question_count || 20} savol</span>
                      </div>
                      <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-center">
                        <Award className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                        <span>O‘tish: {test.passing_percentage}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span>Ishlangan: {attemptsCount} marta</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">+100 XP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setTestForRules(test)}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Testni Boshlash</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 7 KUNLIK BILIM CHALLENGE */}
      {activeTab === 'challenge' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4 fill-current" />
              <span>MARAFON VA MUTAXASSISLIK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              🔥 7 Kunlik Bilim Challenge
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Har kuni berilgan vazifani bajaring, qo‘shimcha XP to‘plang va 7 kun yakunida maxsus sertifikat va achievementga ega bo‘ling!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {challenges.map((c) => (
              <div
                key={c.day_num}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                  c.is_completed
                    ? 'border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/30'
                    : c.is_current
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/30 shadow-lg scale-102'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] ${
                        c.is_completed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : c.is_current
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {c.day_name}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">+{c.xp_reward} XP</span>
                  </div>

                  <h3 className="font-black text-sm text-gray-900 dark:text-white mt-1">
                    {c.task_title}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    {c.day_num === 1
                      ? 'Dastlabki bilim testi'
                      : c.day_num === 2
                      ? 'Video ma’ruza ko‘rish'
                      : c.day_num === 3
                      ? '10 ta tezkor savol'
                      : c.day_num === 4
                      ? 'Mini oraliq test'
                      : c.day_num === 5
                      ? 'Dars va amaliyot'
                      : c.day_num === 6
                      ? 'Yuqori darajali test'
                      : 'Katta yakuniy final test'}
                  </p>
                </div>

                <div>
                  {c.is_completed ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Bajarildi ✓</span>
                    </div>
                  ) : c.is_current ? (
                    <button
                      onClick={() => handleCompleteChallengeDay(c.day_num)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/25 cursor-pointer"
                    >
                      Bajarish →
                    </button>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs font-semibold text-center">
                      Kutilmoqda
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KURSLAR BO'LIMI */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-500/50 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                      {course.category}
                    </span>
                    <span className="text-gray-400 text-xs">{course.level}</span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500">
                    <span>📖 {course.lessons?.length || course.lessons_count} dars</span>
                    <span>⏱ {course.duration_hours} soat</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCourseForView(course)}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Darslarni Ko‘rish</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NATIJALAR & GRAFIK */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Haftalik va oylik grafiklar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly progression chart */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Haftalik O‘zlashtirish Grafigi</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Dushanba (65%) dan Juma (88%) gacha o‘sish ko‘rsatkichi
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="kun" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Ball foizi']} />
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

            {/* Streak & XP growth bar chart */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Kunlik To‘plangan XP & Faollik</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Kunlar bo‘yicha tajriba ballari dinamikasi
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { kun: 'Dush', xp: 90 },
                      { kun: 'Sesh', xp: 120 },
                      { kun: 'Chor', xp: 150 },
                      { kun: 'Pay', xp: 130 },
                      { kun: 'Juma', xp: 180 },
                      { kun: 'Bugun', xp: 210 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="kun" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v} XP`, 'Tajriba bali']} />
                    <Bar dataKey="xp" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Results table */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Mening Test Natijalarim Tarixi ({results.length} ta test)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Test</th>
                    <th className="py-3 px-4">Sana</th>
                    <th className="py-3 px-4">Ball</th>
                    <th className="py-3 px-4">Foiz</th>
                    <th className="py-3 px-4">Holat</th>
                    <th className="py-3 px-4">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                        {r.test_title || 'Umumiy Intellekt Testi'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                        {r.earned_points} / {r.max_points}
                      </td>
                      <td className="py-3.5 px-4 font-black">
                        {r.percentage}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            r.passed
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {r.passed ? "O'tdingiz" : "O'tmadingiz"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {Math.floor(r.duration_seconds / 60)}m {r.duration_seconds % 60}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROFIL VA ACHIEVEMENTLAR */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                {user?.first_name?.[0] || 'M'}
                {user?.last_name?.[0] || 'A'}
              </div>

              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {user?.last_name || 'Ahathanov'} {user?.first_name || 'Muhammadyusuf'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-3">
                  <span>📱 {user?.phone || '+998901234567'}</span>
                  <span>·</span>
                  <span>🏢 Guruh: {user?.group_name || 'IT-01'}</span>
                  <span>·</span>
                  <span>👨‍🏫 O‘qituvchi: {user?.teacher_name || 'Sardor Rahimov'}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-gray-400 block text-[11px]">Daraja</span>
                <strong className="text-sm font-bold text-gray-900 dark:text-white">{userLevel}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-gray-400 block text-[11px]">Tajriba (XP)</span>
                <strong className="text-sm font-bold text-amber-500">{userXp} XP</strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-gray-400 block text-[11px]">Ketma-ket streak</span>
                <strong className="text-sm font-bold text-rose-500">🔥 {user?.streak || 5} kun</strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-gray-400 block text-[11px]">Topshirilgan testlar</span>
                <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {results.length || 12} ta
                </strong>
              </div>
            </div>
          </div>

          {/* Achievementlar Bo'limi */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Mening Achievementlarim</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Faoliyatingiz davomida ochilgan va kutilayotgan maxsus unvonlar
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {[
                { title: '🏆 Birinchi Test', desc: 'Birinchi testni muvaffaqiyatli topshirdi', unlocked: true },
                { title: '🔥 7 Kun Streak', desc: 'Ketma-ket 7 kun ta’lim oldi', unlocked: true },
                { title: '💯 100% Natija', desc: 'Barcha savollarga 100% to‘g‘ri javob berdi', unlocked: true },
                { title: '📚 10 ta Test', desc: 'Kamida 10 ta online testni yakunladi', unlocked: true },
                { title: '⚡ Tezkor O‘quvchi', desc: 'Vaqtdan 2 barobar tez topshirdi', unlocked: true },
                { title: '🎯 90%+ Natija', desc: 'A’lo darajadagi bilim ko‘rsatkichi', unlocked: true },
                { title: '👑 Master', desc: '1500 XP to‘plab Master darajasiga erishish', unlocked: false },
              ].map((ach, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all space-y-1.5 ${
                    ach.unlocked
                      ? 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 opacity-50'
                  }`}
                >
                  <span className="text-base font-bold text-gray-900 dark:text-white block">
                    {ach.title}
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    {ach.desc}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded-md ${
                      ach.unlocked
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {ach.unlocked ? 'Ochilgan ✓' : 'Qulflangan 🔒'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PRE-TEST INSTRUCTIONS MODAL (Section 3: Oynacha) */}
      {testForRules && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 my-auto">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                {testForRules.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Testni boshlashdan oldin shartlar bilan tanishing
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-[10px] text-gray-400 block">Savollar</span>
                <strong className="text-sm font-bold text-gray-900 dark:text-white">
                  {testForRules.question_count || 20} ta
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-[10px] text-gray-400 block">Vaqt</span>
                <strong className="text-sm font-bold text-gray-900 dark:text-white">
                  {testForRules.duration_minutes} daqiqa
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-[10px] text-gray-400 block">O‘tish bali</span>
                <strong className="text-sm font-bold text-gray-900 dark:text-white">
                  {testForRules.passing_percentage}%
                </strong>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-[10px] text-gray-400 block">Maks. ball</span>
                <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {testForRules.question_count || 20}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs space-y-2 text-gray-700 dark:text-gray-300">
              <span className="font-bold text-blue-700 dark:text-blue-300 block">
                Muhim ko‘rsatmalar:
              </span>
              <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                <li>Vaqt tugaganda test avtomatik ravishda yakunlanadi.</li>
                <li>Savollar navigatori orqali istalgan savolga qaytishingiz mumkin.</li>
                <li>Keyinroq ko‘rish uchun savolni 🔖 belgilab qo‘yishingiz mumkin.</li>
                <li>Natija darhol circular chart va to‘liq savollar tahlili bilan chiqadi.</li>
              </ul>
            </div>

            <div className="text-center font-bold text-xs text-gray-800 dark:text-gray-200">
              “Testni boshlashga tayyormisiz?”
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTestForRules(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = testForRules.id;
                  setTestForRules(null);
                  onStartTest(id);
                }}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                BOSHLASH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COURSE VIEWER MODAL */}
      {selectedCourseForView && (
        <CourseViewerModal
          course={selectedCourseForView}
          onClose={() => setSelectedCourseForView(null)}
          onStartCourseTest={(testId) => onStartTest(testId)}
        />
      )}

      {/* 7 KUNLIK CHALLENGE CELEBRATION MODAL */}
      {showChallengeCelebration && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-gray-900 border border-amber-500 rounded-3xl max-w-md w-full p-8 text-center space-y-4 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              🏆 7 KUNLIK CHALLENGE BAJARILDI!
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Tabriklaymiz! Siz 7 kunlik uzluksiz bilim marafonini muvaffaqiyatli yakunladingiz va maxsus “Master Challenger” achievementi hamda +500 bonus XP ga ega bo‘ldingiz!
            </p>
            <button
              onClick={() => setShowChallengeCelebration(false)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              Rahmat, davom etamiz!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
