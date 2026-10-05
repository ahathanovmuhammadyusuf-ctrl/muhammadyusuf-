import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TestItem } from '../../types';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
  HelpCircle,
  Award,
  Zap,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Users,
  Play,
  User,
  Phone,
  BookOpen,
} from 'lucide-react';

interface LandingHeroProps {
  onStartSpecificTest?: (testId: string) => void;
  onOpenTeacherLogin?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartSpecificTest,
  onOpenTeacherLogin,
}) => {
  const { user, directStudentLogin } = useAuth();

  const [tests, setTests] = useState<TestItem[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Quick start modal
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [targetTestId, setTargetTestId] = useState<string>('test-1');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tests')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTests(data);
          setTargetTestId(data[0].id);
        }
      })
      .catch((e) => console.warn('Tests load error:', e))
      .finally(() => setLoadingTests(false));
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998' + val.replace(/\D/g, '');
    }
    const cleaned = '+998' + val.substring(4).replace(/\D/g, '').slice(0, 9);
    setPhone(cleaned);
  };

  const handleStartClicked = (testId?: string) => {
    if (testId) setTargetTestId(testId);
    if (user) {
      if (onStartSpecificTest) onStartSpecificTest(testId || targetTestId);
    } else {
      setShowEntryModal(true);
    }
  };

  const handleQuickEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setEntryError('Iltimos, ism va familiyangizni to‘liq kiriting.');
      return;
    }

    if (phone.length < 13) {
      setEntryError('Telefon raqamingizni to‘liq kiriting (+998XXXXXXXXX).');
      return;
    }

    setEntryLoading(true);
    const res = await directStudentLogin({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    });
    setEntryLoading(false);

    if (!res.success) {
      setEntryError(res.error || 'Kirishda xatolik yuz berdi');
      return;
    }

    setShowEntryModal(false);
    if (onStartSpecificTest) {
      onStartSpecificTest(targetTestId);
    }
  };

  return (
    <div className="relative overflow-hidden pt-4 pb-16">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-500/10 via-indigo-500/5 to-transparent pointer-events-none rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. HERO SECTION */}
        <div className="text-center py-10 sm:py-16 space-y-6">
          {/* Top Brand kicker (No pill slop, clean typography) */}
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>ONLINE TEST PLATFORMASI</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Bilimingizni sinab ko‘ring!
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            20 ta saralangan savol, 20 daqiqa aniq vaqt nazorati va bir zumda to‘liq tahliliy natija.
            Ortiqcha ro‘yxatdan o‘tishsiz, bir bosishda testni boshlang!
          </p>

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStartClicked(targetTestId)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-base font-bold shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <span>TESTNI BOSHLASH</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {!user && (
              <button
                onClick={onOpenTeacherLogin}
                className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-2 px-3 transition-colors"
              >
                O‘qituvchi Kabinetiga Kirish →
              </button>
            )}
          </div>

          {/* 4 Feature Spec Cards (As explicitly requested by user) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-10 max-w-4xl mx-auto text-left">
            {/* 1. Savollar soni */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                20 ta savol
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Saralangan va qiziqarli test savollari
              </p>
            </div>

            {/* 2. Test vaqti */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                20 daqiqa vaqt
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Aniq sticky timer va avtomatik yakunlash
              </p>
            </div>

            {/* 3. Natija darhol chiqishi */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Darhol natija
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ball, foiz va to‘liq savollar tahlili
              </p>
            </div>

            {/* 4. Telefon va kompyuterda ishlashi */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Mobil moslashuv
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Telefon va kompyuterda maksimal qulaylik
              </p>
            </div>
          </div>
        </div>

        {/* 2. AVAILABLE TESTS SHOWCASE */}
        <div className="py-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Mavjud Test Sinovlari</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                O‘zingizga mos yo‘nalishni tanlang va bilimingizni sinab ko‘ring
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tests.map((test, idx) => (
              <div
                key={test.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col justify-between space-y-4 hover:border-blue-500/60 shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {idx === 0 ? '⭐️ Tavsiya etiladi' : `Test #${idx + 1}`}
                    </span>
                    <span>{test.duration_minutes} daqiqa</span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2">
                    {test.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                    {test.description || 'Umumiy bilimlar va intellektual salohiyatni baholash testi'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span>📝 {test.question_count || 20} ta savol</span>
                    <span>·</span>
                    <span>🎯 {test.passing_percentage}% o‘tish</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartClicked(test.id)}
                  className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Ushbu testni boshlash</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. STUDENT QUICK ENTRY MODAL (Section 2: Ism, Familiya, Telefon) */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-2">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Testni Boshlash
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ism va telefoningizni kiriting va darhol testga o‘ting
              </p>
            </div>

            {entryError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 text-center">
                {entryError}
              </div>
            )}

            <form onSubmit={handleQuickEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ismingiz
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Masalan: Sardor"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Familiyangiz
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Masalan: Karimov"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Telefon raqami
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+998901234567"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={entryLoading}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {entryLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>DAVOM ETISH</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
