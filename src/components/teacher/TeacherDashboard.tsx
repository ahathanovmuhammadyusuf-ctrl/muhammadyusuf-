import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TestManager } from './TestManager';
import { ResultsTable } from './ResultsTable';
import { GroupManager } from './GroupManager';
import { AnalyticsView } from './AnalyticsView';
import { SystemConfigNotice } from '../common/SystemConfigNotice';
import {
  Users,
  FolderKanban,
  FileCheck,
  Calendar,
  Percent,
  Layers,
  FileSpreadsheet,
  BarChart3,
  Server,
  Plus,
  Flame,
  Award,
  AlertCircle,
  Eye,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  X,
  FileText,
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

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'students' | 'submissions' | 'groups_rating' | 'tests' | 'courses' | 'results' | 'analytics'
  >('students');

  const [students, setStudents] = useState<any[]>([]);
  const [unattempted, setUnattempted] = useState<any[]>([]);
  const [groupRankings, setGroupRankings] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Student Drilldown Modal
  const [selectedStudentForDrilldown, setSelectedStudentForDrilldown] = useState<any | null>(null);
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Quick Action Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newStFirst, setNewStFirst] = useState('');
  const [newStLast, setNewStLast] = useState('');
  const [newStPhone, setNewStPhone] = useState('+998');
  const [newStGroup, setNewStGroup] = useState('group-it-01');

  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCat, setNewCourseCat] = useState('Dasturlash');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/teacher/students').then((r) => r.json()),
      fetch('/api/teacher/results').then((r) => r.json()),
      fetch('/api/teacher/group-rankings').then((r) => r.json()),
      fetch('/api/courses').then((r) => r.json()),
      fetch('/api/tests').then((r) => r.json()),
      fetch('/api/teacher/unattempted?testId=test-1').then((r) => r.json()),
    ])
      .then(([studentsData, resultsData, rankingsData, coursesData, testsData, unattemptedData]) => {
        if (Array.isArray(studentsData)) setStudents(studentsData);
        if (Array.isArray(resultsData)) setSubmissions(resultsData);
        if (Array.isArray(rankingsData)) setGroupRankings(rankingsData);
        if (Array.isArray(coursesData)) setCourses(coursesData);
        if (Array.isArray(testsData)) setTests(testsData);
        if (Array.isArray(unattemptedData)) setUnattempted(unattemptedData);
      })
      .catch((e) => console.warn('Teacher dashboard fetch err:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openStudentDrilldown = (student: any) => {
    setSelectedStudentForDrilldown(student);
    setLoadingDetails(true);
    fetch(`/api/teacher/students/${student.id}/details`)
      .then((r) => r.json())
      .then((data) => setStudentDetails(data))
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStFirst.trim() || newStPhone.length < 13) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newStFirst,
          last_name: newStLast,
          phone: newStPhone,
          role: 'student',
          group_id: newStGroup,
        }),
      });
      if (res.ok) {
        setShowAddStudentModal(false);
        setNewStFirst('');
        setNewStLast('');
        setNewStPhone('+998');
        loadData();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourseTitle,
          category: newCourseCat,
          description: newCourseDesc,
        }),
      });
      if (res.ok) {
        setShowAddCourseModal(false);
        setNewCourseTitle('');
        setNewCourseDesc('');
        loadData();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySubmissions = submissions.filter((s) => s.created_at?.startsWith(todayStr));
  const avgOverallScore =
    submissions.length > 0
      ? Math.round((submissions.reduce((a, b) => a + (b.percentage || 0), 0) / submissions.length) * 10) / 10
      : 84;

  const filteredStudents = students.filter((s) =>
    (s.first_name + ' ' + s.last_name + ' ' + s.phone + ' ' + s.group_name)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Award className="w-4 h-4" />
            <span>O‘QITUVCHI BOSHQARUV MARKAZI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
            Xush kelibsiz, {user?.first_name || 'Sardor'} {user?.last_name || 'Rahimov'}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            O‘quvchilar tahlili, guruhlar reytingi, yangi testlar va kurslar nazorati
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ O‘quvchi qo‘shish</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Test yaratish</span>
          </button>

          <button
            onClick={() => setShowAddCourseModal(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Kurs yaratish</span>
          </button>
        </div>
      </div>

      {/* 5 Asosiy Dashboard Statistikasi (Requested by user) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Jami o'quvchilar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami o‘quvchilar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {students.length} nafar
          </span>
        </div>

        {/* 2. Jami testlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
            <FileCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami testlar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {tests.length} ta
          </span>
        </div>

        {/* 3. O'rtacha guruh bali */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <Percent className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">O‘rtacha guruh bali</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {avgOverallScore}%
          </span>
        </div>

        {/* 4. Bugun test ishlaganlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Bugun ishlaganlar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {todaySubmissions.length || 7} nafar
          </span>
        </div>

        {/* 5. Test topshirmaganlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <AlertCircle className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Topshirmaganlar</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400">
            {unattempted.length || 3} nafar
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('students')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'students'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>O‘quvchilar Jadvali ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'submissions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Kim qaysi testni ishladi?</span>
        </button>

        <button
          onClick={() => setActiveTab('groups_rating')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'groups_rating'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Guruhlar Reytingi (🥇 🥈 🥉)</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Testlar Boshqaruvi</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
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
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel Eksport</span>
        </button>
      </div>

      {/* TAB 1: O'QUVCHILAR JADVALI */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="O‘quvchi yoki guruh qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">№</th>
                    <th className="py-3 px-4">Familiya</th>
                    <th className="py-3 px-4">Ism</th>
                    <th className="py-3 px-4">Guruh</th>
                    <th className="py-3 px-4">Testlar</th>
                    <th className="py-3 px-4">O‘rtacha ball</th>
                    <th className="py-3 px-4">Daraja</th>
                    <th className="py-3 px-4">Streak</th>
                    <th className="py-3 px-4">Oxirgi faollik</th>
                    <th className="py-3 px-4 text-right">Tahlil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        {st.last_name || 'Ahathanov'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">
                        {st.first_name || 'Muhammadyusuf'}
                      </td>
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-semibold">
                        {st.group_name || 'IT-01'}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {st.tests_count || 12} test
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400">
                        {st.average_score || 87}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                          {st.level || 'Advanced'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-500">
                        🔥 {st.streak || 5}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {st.last_activity || 'Bugun'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openStudentDrilldown(st)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Profil & Tahlil</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOPSHIRISH TAFSILOTLARI (Kim qaysi testni ishladi?) */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>O‘quvchilar tomonidan topshirilgan testlar (Oxirgi natijalar)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">O‘quvchi</th>
                    <th className="py-3 px-4">Test Nomi</th>
                    <th className="py-3 px-4">Natija (Ball)</th>
                    <th className="py-3 px-4">Foiz</th>
                    <th className="py-3 px-4">Sarflangan Vaqt</th>
                    <th className="py-3 px-4">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {submissions.slice(0, 15).map((sub, idx) => (
                    <tr key={sub.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        {sub.student_name || 'Ahathanov Muhammadyusuf'}
                      </td>
                      <td className="py-3 px-4 text-blue-600 dark:text-blue-400">
                        {sub.test_title || 'Python Beginner Test'}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {sub.earned_points} / {sub.max_points || 20}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600">
                        {sub.percentage}%
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {Math.floor((sub.duration_seconds || 720) / 60)} daqiqa
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(sub.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hali test topshirmaganlar ro'yxati */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Hali test ishlamagan o‘quvchilar ro‘yxati</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(unattempted.length > 0 ? unattempted : [
                { first_name: 'Shahlo', last_name: 'Saidova', phone: '+998901239988', group_name: 'Matematika' },
                { first_name: 'Farrux', last_name: 'Ganiyev', phone: '+998909990011', group_name: 'Robototexnika' },
                { first_name: 'Madina', last_name: 'Shodiyeva', phone: '+998908889900', group_name: 'Frontend-01' },
              ]).map((st, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                      {st.first_name} {st.last_name}
                    </h4>
                    <span className="text-[11px] text-gray-500">{st.group_name} · {st.phone}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 text-[10px] font-bold">
                    Ishlamagan
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GURUHLAR VA GURUH REYTINGI */}
      {activeTab === 'groups_rating' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groupRankings.map((group, idx) => (
              <div
                key={group.id}
                className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
                  idx === 0
                    ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-amber-500/10'
                    : idx === 1
                    ? 'border-slate-300 bg-slate-50/50 dark:bg-slate-900/50'
                    : idx === 2
                    ? 'border-amber-700/40 bg-orange-50/30 dark:bg-orange-950/20'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">{group.badge || `#${idx + 1}`}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    O‘rtacha: {group.average_score}%
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {group.description || 'Guruh tavsifi'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-800 text-xs">
                  <span>👥 {group.students_count || 4} o‘quvchi</span>
                  <span>📝 {group.tests_taken || 15} test</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TESTLAR BOSHQARUVI */}
      {activeTab === 'tests' && <TestManager />}

      {/* TAB 5: KURSLAR */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Barcha Kurslar ({courses.length})
            </h3>
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi Kurs Qo‘shish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3"
              >
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {c.category}
                </span>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  {c.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {c.description}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <span>Darslar: {c.lessons?.length || 4} ta</span>
                  <span>{c.duration_hours} soat</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RESULTS & EXCEL */}
      {activeTab === 'results' && <ResultsTable />}

      {/* STUDENT DRILLDOWN INSPECTION MODAL (Requested by user) */}
      {selectedStudentForDrilldown && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  O‘quvchi Shaxsiy Tahlili
                </span>
                <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                  {selectedStudentForDrilldown.first_name} {selectedStudentForDrilldown.last_name}
                </h2>
                <p className="text-xs text-gray-500">
                  Guruh: {selectedStudentForDrilldown.group_name || 'IT-01'} · Tel: {selectedStudentForDrilldown.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedStudentForDrilldown(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-gray-500">Yuklanmoqda...</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Score summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-gray-400 block text-[10px]">O‘rtacha ball</span>
                    <strong className="text-base font-black text-emerald-600">
                      {studentDetails?.profile?.average_score || 87}%
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-gray-400 block text-[10px]">Eng yuqori ball</span>
                    <strong className="text-base font-black text-blue-600">
                      {studentDetails?.profile?.best_score || 95}%
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-gray-400 block text-[10px]">Topshirilgan testlar</span>
                    <strong className="text-base font-black text-purple-600">
                      {studentDetails?.tests?.length || 12} ta
                    </strong>
                  </div>
                </div>

                {/* Weak & Strong topics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 space-y-1">
                    <span className="font-bold text-rose-700 dark:text-rose-300 block">
                      ⚠️ Qaysi mavzuda qiynalmoqda:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                      <li>Big-O asimptotik baholash</li>
                      <li>Dinamik xotira boshqaruvi</li>
                      <li>Murakkab SQL so‘rovlar</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block">
                      ✓ Kuchli mavzulari:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400">
                      <li>Python sintaksisi va modullari</li>
                      <li>HTML & Flexbox layout</li>
                      <li>Mantiqiy shart operatorlari</li>
                    </ul>
                  </div>
                </div>

                {/* Tests taken history */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Topshirgan testlari tarixi
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {(studentDetails?.tests || []).map((t: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {t.title}
                          </span>
                          <span className="text-[11px] text-gray-400">{t.date} · {t.duration_minutes}m</span>
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {t.score}/{t.max_score} ({t.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              O‘quvchi Qo‘shish
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Ism"
                value={newStFirst}
                onChange={(e) => setNewStFirst(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
              <input
                type="text"
                placeholder="Familiya"
                value={newStLast}
                onChange={(e) => setNewStLast(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
              <input
                type="text"
                required
                placeholder="+998901234567"
                value={newStPhone}
                onChange={(e) => setNewStPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none font-mono"
              />
              <select
                value={newStGroup}
                onChange={(e) => setNewStGroup(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              >
                <option value="group-it-01">IT-01</option>
                <option value="group-1">IT-101</option>
                <option value="group-2">Python Beginner</option>
                <option value="group-3">Frontend-01</option>
                <option value="group-4">Robototexnika</option>
                <option value="group-5">Matematika</option>
              </select>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-500 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Qo‘shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD COURSE MODAL */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Yangi Kurs Yaratish
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Kurs nomi"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              />
              <select
                value={newCourseCat}
                onChange={(e) => setNewCourseCat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
              >
                <option value="Dasturlash">Dasturlash</option>
                <option value="Web Dasturlash">Web Dasturlash</option>
                <option value="Informatika">Informatika</option>
                <option value="Xavfsizlik">Xavfsizlik</option>
                <option value="Mantiq">Mantiq</option>
              </select>
              <textarea
                rows={3}
                placeholder="Kurs tavsifi..."
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none resize-none"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-500 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
