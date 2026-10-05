import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  X,
  Lock,
} from 'lucide-react';

interface LoginModalProps {
  onClose?: () => void;
  initialTab?: 'student' | 'teacher' | 'admin';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  initialTab = 'student',
}) => {
  const { loginAsTeacher, loginAsAdmin, quickDemoLogin, directStudentLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>(initialTab);

  // Student form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [studentPassword, setStudentPassword] = useState('');

  // Teacher / Admin passwords
  const [teacherPassword, setTeacherPassword] = useState('123456');
  const [adminPassword, setAdminPassword] = useState('admin123');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998' + val.replace(/\D/g, '');
    }
    const cleaned = '+998' + val.substring(4).replace(/\D/g, '').slice(0, 9);
    setPhone(cleaned);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('Iltimos, ismingizni kiriting.');
      return;
    }

    if (phone.length < 13) {
      setError('Telefon raqamingizni to‘liq kiriting (+998XXXXXXXXX).');
      return;
    }

    setLoading(true);
    const res = await directStudentLogin({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Kirishda xatolik yuz berdi');
      return;
    }

    if (onClose) onClose();
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginAsTeacher(teacherPassword.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'O‘qituvchi paroli xato (Standart: 123456)');
      return;
    }

    if (onClose) onClose();
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginAsAdmin(adminPassword.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Admin paroli xato (Standart: admin123)');
      return;
    }

    if (onClose) onClose();
  };

  const handleDemoClick = async (role: 'student' | 'teacher' | 'admin') => {
    setError(null);
    setLoading(true);
    const res = await quickDemoLogin(role);
    setLoading(false);
    if (res.success && onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 my-auto relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            ILMHUB Platformasiga Kirish
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            “Bilim sari birgalikda!”
          </p>
        </div>

        {/* 1-Click Fast Demo Logins */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Tezkor 1-Bosishda Demo Kirish:</span>
          </span>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={() => handleDemoClick('student')}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:border-blue-500 text-left font-semibold text-gray-900 dark:text-white transition-all shadow-xs cursor-pointer"
            >
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block truncate">
                🎓 O‘quvchi
              </span>
              <span className="text-[10px] text-gray-400 block truncate">Muhammadyusuf</span>
            </button>

            <button
              onClick={() => handleDemoClick('teacher')}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 text-left font-semibold text-gray-900 dark:text-white transition-all shadow-xs cursor-pointer"
            >
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                👨‍🏫 O‘qituvchi
              </span>
              <span className="text-[10px] text-gray-400 block truncate">Sardor Rahimov</span>
            </button>

            <button
              onClick={() => handleDemoClick('admin')}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-800 hover:border-rose-500 text-left font-semibold text-gray-900 dark:text-white transition-all shadow-xs cursor-pointer"
            >
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block truncate">
                👑 Admin
              </span>
              <span className="text-[10px] text-gray-400 block truncate">Super Admin</span>
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setError(null);
            }}
            className={`flex-1 py-2.5 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'student'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            O‘quvchi
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('teacher');
              setError(null);
            }}
            className={`flex-1 py-2.5 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'teacher'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            O‘qituvchi
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError(null);
            }}
            className={`flex-1 py-2.5 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'admin'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 text-center">
            {error}
          </div>
        )}

        {/* 1. STUDENT TAB */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Ismingiz
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Muhammadyusuf"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Familiyangiz
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ahathanov"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Telefon Raqamingiz (+998)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+998901234567"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Parol (Ixtiyoriy)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Parol kiriting yoki bo‘sh qoldiring"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer mt-2"
            >
              <span>{loading ? 'Kirilmoqda...' : 'Kabinetga Kirish'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* 2. TEACHER TAB */}
        {activeTab === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
              <span className="font-bold block">O‘qituvchi Kabinetiga Kirish</span>
              <span className="text-[11px] opacity-80">Standart demo parol: 123456</span>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                O‘qituvchi Paroli
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Tekshirilmoqda...' : 'O‘qituvchi sifatida kirish'}</span>
            </button>
          </form>
        )}

        {/* 3. ADMIN TAB */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300">
              <span className="font-bold block">Super Administrator Kirishi</span>
              <span className="text-[11px] opacity-80">Standart demo parol: admin123</span>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Admin Paroli
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{loading ? 'Kirilmoqda...' : 'Admin Panelga Kirish'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
