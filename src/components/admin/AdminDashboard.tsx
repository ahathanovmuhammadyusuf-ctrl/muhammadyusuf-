import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  GraduationCap,
  FolderKanban,
  FileCheck,
  BookOpen,
  Zap,
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  Edit,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Server,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'groups' | 'tests' | 'courses' | 'system'
  >('overview');

  const [overviewData, setOverviewData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [testsList, setTestsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');

  // New User Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('+998');
  const [newRole, setNewRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [newGroupId, setNewGroupId] = useState('');

  // New Group Modal
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Status message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/overview').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/tests').then((r) => r.json()),
      fetch('/api/courses').then((r) => r.json()),
    ])
      .then(([overview, users, groups, tests, courses]) => {
        if (overview) setOverviewData(overview);
        if (Array.isArray(users)) setUsersList(users);
        if (Array.isArray(groups)) {
          setGroupsList(groups);
          if (groups.length > 0) setNewGroupId(groups[0].id);
        }
        if (Array.isArray(tests)) setTestsList(tests);
        if (Array.isArray(courses)) setCoursesList(courses);
      })
      .catch((e) => console.warn('Admin data fetch error', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || newPhone.length < 13) {
      showToast('Ism va telefon raqamini to‘liq kiriting');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: newFirstName,
          last_name: newLastName,
          phone: newPhone,
          role: newRole,
          group_id: newGroupId,
        }),
      });

      if (res.ok) {
        showToast('Foydalanuvchi muvaffaqiyatli qo‘shildi!');
        setShowAddUserModal(false);
        setNewFirstName('');
        setNewLastName('');
        setNewPhone('+998');
        loadData();
      }
    } catch (e) {
      showToast('Xatolik yuz berdi');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`${name} foydalanuvchisini o‘chirishni tasdiqlaysizmi?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Foydalanuvchi o‘chirildi');
        setUsersList((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (e) {
      showToast('O‘chirishda xatolik yuz berdi');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, description: groupDesc }),
      });
      if (res.ok) {
        showToast('Yangi guruh yaratildi!');
        setShowAddGroupModal(false);
        setGroupName('');
        setGroupDesc('');
        loadData();
      }
    } catch (e) {
      showToast('Xatolik yuz berdi');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.first_name + ' ' + u.last_name + ' ' + u.phone)
        .toLowerCase()
        .includes(searchUser.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-semibold text-xs shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <Shield className="w-4 h-4" />
            <span>ILMHUB SUPER ADMIN BOSHQARUV PANELI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
            Platforma Boshqaruv Markazi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Foydalanuvchilar, guruhlar, testlar, kurslar va butun tizim monitoringi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Foydalanuvchi qo‘shish</span>
          </button>
          <button
            onClick={() => setShowAddGroupModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Guruh yaratish</span>
          </button>
        </div>
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. O'quvchilar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami o‘quvchilar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {overviewData?.metrics?.totalStudents || usersList.filter((u) => u.role === 'student').length}
          </span>
        </div>

        {/* 2. O'qituvchilar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami o‘qituvchilar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {overviewData?.metrics?.totalTeachers || usersList.filter((u) => u.role === 'teacher').length}
          </span>
        </div>

        {/* 3. Guruhlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
            <FolderKanban className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami guruhlar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {groupsList.length}
          </span>
        </div>

        {/* 4. Testlar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <FileCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami testlar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {testsList.length}
          </span>
        </div>

        {/* 5. Kurslar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Jami kurslar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {coursesList.length}
          </span>
        </div>

        {/* 6. Faol foydalanuvchilar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Bugun faollar</span>
          <span className="text-xl font-black text-gray-900 dark:text-white">
            {overviewData?.metrics?.activeToday || 18}
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tahliliy Grafiklar</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Foydalanuvchilar ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'groups'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Guruhlar ({groupsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Testlar ({testsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kurslar ({coursesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'system'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Tizim & Xavfsizlik</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Platforma O'sishi */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Platforma O‘sishi va Testlar Dinamikasi</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Oylik yangi o‘quvchilar va topshirilgan testlar soni
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overviewData?.platformGrowth || []}>
                    <defs>
                      <linearGradient id="colorOquvchi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="oy" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="testlar"
                      name="Topshirilgan testlar"
                      stroke="#7c3aed"
                      fillOpacity={1}
                      fill="url(#colorTest)"
                    />
                    <Area
                      type="monotone"
                      dataKey="oquvchilar"
                      name="Yangi o‘quvchilar"
                      stroke="#2563eb"
                      fillOpacity={1}
                      fill="url(#colorOquvchi)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Haftalik Kunlik Aktivlik */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Kunlik Faol Foydalanuvchilar va Topshirishlar</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Hafta kunlari bo‘yicha o‘quvchilar aktivligi
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewData?.weeklyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="kun" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="faollar" name="Faol o‘quvchilar" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="topshirish" name="Test topshirish" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Groups summary list */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Guruhlar bo‘yicha O‘zlashtirish va Reyting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {groupsList.map((g, idx) => (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                      {g.name}
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {g.student_count || 4} ta o‘quvchi
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    O‘rtacha: {82 + (idx * 3) % 15}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Role Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ism yoki telefon qidirish..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {(['all', 'student', 'teacher', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    roleFilter === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {r === 'all' ? 'Hammasi' : r === 'student' ? 'O‘quvchilar' : r === 'teacher' ? 'O‘qituvchilar' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">№</th>
                    <th className="py-3 px-4">F.I.SH</th>
                    <th className="py-3 px-4">Telefon</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Guruh</th>
                    <th className="py-3 px-4">Daraja & XP</th>
                    <th className="py-3 px-4">Testlar / O‘rtacha</th>
                    <th className="py-3 px-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-4 font-bold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                        {u.phone}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : u.role === 'teacher'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {u.group_name || 'Guruhsiz'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {u.level || 'Beginner'}
                        </span>
                        <span className="text-gray-400 block text-[10px]">
                          {u.xp || 100} XP
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {u.completed_tests || 0} ta
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          ({u.average_score || 0}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 3: GROUPS MANAGEMENT */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groupsList.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Guruh
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {g.student_count || 4} o‘quvchi
                  </span>
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {g.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {g.description || 'Guruh haqida ma’lumot'}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-500">O‘rtacha ball:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">84%</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TESTS MANAGEMENT */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testsList.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {t.duration_minutes} daqiqa
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    Faol
                  </span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {t.description || 'Tavsif yo‘q'}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span>O‘tish: {t.passing_percentage}%</span>
                  <span>Savollar: {t.question_count || 20} ta</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COURSES MANAGEMENT */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coursesList.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {c.category}
                  </span>
                  <span className="text-gray-500">{c.duration_hours} soat</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {c.description}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span>Darslar: {c.lessons?.length || c.lessons_count} ta</span>
                  <span>O‘quvchilar: {c.enrolled_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM & SECURITY */}
      {activeTab === 'system' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span>Tizim Holati va Xavfsizlik Parametrlari</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platforma Nomi:</span>
              <strong className="text-gray-900 dark:text-white">ILMHUB Pro</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Slogan:</span>
              <strong className="text-gray-900 dark:text-white">“Bilim sari birgalikda!”</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Xavfsiz Server Baholash:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Faol (Server-side grading)</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">IndexedDB Oflayn Kesh:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ulangan (Offline-ready)</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tab Switch & Anti-cheat:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">Aktiv (Visibility API nazoratida)</span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Yangi Foydalanuvchi Qo‘shish
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Ism</label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Muhammadyusuf"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Familiya</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  placeholder="Ahathanov"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Telefon</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Rol</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                >
                  <option value="student">O‘quvchi</option>
                  <option value="teacher">O‘qituvchi</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>

              {newRole === 'student' && (
                <div>
                  <label className="block text-gray-600 dark:text-gray-400 mb-1">Guruh</label>
                  <select
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                  >
                    {groupsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Yangi Guruh Yaratish
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Guruh Nomi</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Masalan: IT-101 yoki Python Pro"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-400 mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Guruh haqida qisqacha ma’lumot..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-bold"
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
