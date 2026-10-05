import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Bell,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
  X,
  CheckCircle,
} from 'lucide-react';

interface HeaderProps {
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLoginModal }) => {
  const { user, logout, switchRoleDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-gray-900 dark:text-white tracking-tight">
                ILMHUB
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
              “Bilim sari birgalikda!”
            </p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak indicator if user is student */}
          {user && (
            <div
              title="Ketma-ket 5 kunlik faollik streak! Uzilib qolmaslik uchun har kuni faol bo‘ling."
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-xs cursor-help"
            >
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
              <span>{user.streak || 5} kun</span>
            </div>
          )}

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotification(!showNotification)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              title="Bildirishnomalar"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-gray-900" />
            </button>

            {/* Notification Dropdown */}
            {showNotification && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 shadow-2xl z-50 text-xs space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bildirishnomalar</span>
                  </span>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold mb-0.5">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>Streak Saqlash Eslatmasi!</span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      Siz 5 kun ketma-ket faolsiz. Bugungi 6-kunlik challenge testini yechib streakni saqlang!
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                    <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold mb-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Yangi Test Qo‘shildi</span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      “Umumiy Intellekt va Mantiq” 20 savolli yangi test sinovi tayyor.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3-Role Fast Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">Rol:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">
                {user?.role === 'admin'
                  ? 'Admin'
                  : user?.role === 'teacher'
                  ? 'O‘qituvchi'
                  : 'O‘quvchi'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Demo Rolni Tanlash
                </div>

                <button
                  onClick={() => {
                    switchRoleDemo('student');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    user?.role === 'student'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold">O‘quvchi Kabineti</div>
                    <div className="text-[10px] text-gray-400">Ahathanov Muhammadyusuf</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchRoleDemo('teacher');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    user?.role === 'teacher'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-semibold">O‘qituvchi Kabineti</div>
                    <div className="text-[10px] text-gray-400">Sardor Rahimov</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchRoleDemo('admin');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                    user?.role === 'admin'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-semibold">Admin Panel</div>
                    <div className="text-[10px] text-gray-400">Super Administrator</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Rang rejimini almashtirish"
            title={theme === 'dark' ? "Yorug‘ rejim" : "Qorong‘u rejim"}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Logout or Login */}
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          ) : (
            onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/25"
              >
                Kirish
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
