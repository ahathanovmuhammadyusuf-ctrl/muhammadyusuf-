import React, { useState, useEffect } from 'react';
import { TestItem, Group } from '../../types';
import { DocxImportModal } from './DocxImportModal';
import { QuestionEditorModal } from './QuestionEditorModal';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  FileCode,
  Clock,
  Award,
  Users,
  Shuffle,
  CheckCircle,
  HelpCircle,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

export const TestManager: React.FC = () => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [docxTest, setDocxTest] = useState<TestItem | null>(null);
  const [questionsTest, setQuestionsTest] = useState<TestItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/tests').then((r) => r.json()),
      fetch('/api/groups').then((r) => r.json()),
    ])
      .then(([testsData, groupsData]) => {
        if (Array.isArray(testsData)) setTests(testsData);
        if (Array.isArray(groupsData)) setGroups(groupsData);
      })
      .catch((err) => console.warn('Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTest(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(30);
    setMaxAttempts(1);
    setPassingPercentage(60);
    setSelectedGroupIds(groups.length > 0 ? [groups[0].id] : []);
    setStartTime('');
    setEndTime('');
    setShuffleQuestions(true);
    setShuffleOptions(true);
    setShowCorrectAnswers(true);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (test: TestItem) => {
    setEditingTest(test);
    setTitle(test.title);
    setDescription(test.description || '');
    setDurationMinutes(test.duration_minutes);
    setMaxAttempts(test.max_attempts);
    setPassingPercentage(test.passing_percentage);
    setSelectedGroupIds(test.group_ids || []);
    setStartTime(test.start_time ? test.start_time.substring(0, 16) : '');
    setEndTime(test.end_time ? test.end_time.substring(0, 16) : '');
    setShuffleQuestions(test.shuffle_questions);
    setShuffleOptions(test.shuffle_options);
    setShowCorrectAnswers(test.show_correct_answers_after_test);
    setIsActive(test.is_active);
    setError(null);
    setIsModalOpen(true);
  };

  const toggleGroupSelection = (gid: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    );
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Test nomi kiritilishi shart.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      duration_minutes: durationMinutes,
      max_attempts: maxAttempts,
      passing_percentage: passingPercentage,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      end_time: endTime ? new Date(endTime).toISOString() : null,
      group_ids: selectedGroupIds,
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      show_correct_answers_after_test: showCorrectAnswers,
      is_active: isActive,
    };

    try {
      const url = editingTest ? `/api/tests/${editingTest.id}` : '/api/tests';
      const method = editingTest ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Testni saqlashda xatolik');

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!window.confirm("Rostdan ham bu testni barcha savollari bilan birga o'chirmoqchimisiz?")) {
      return;
    }

    try {
      await fetch(`/api/tests/${testId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.warn("Testni o'chirishda xatolik:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Testlar Boshqaruvi
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Yangi testlar yaratish, guruhlarga biriktirish va Word (.docx) import qilish
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Test Yaratish</span>
        </button>
      </div>

      {/* Test List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Yuklanmoqda...</div>
      ) : tests.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Hozircha testlar mavjud emas
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            "Yangi Test Yaratish" tugmasini bosing yoki tayyor Word fayldan import qiling.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                    {test.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      test.is_active
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {test.is_active ? 'Faol' : 'Nofaol'}
                  </span>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                  {test.description || 'Tavsif kiritilmagan'}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 text-[11px] text-gray-600 dark:text-gray-300">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span>{test.duration_minutes}m</span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>{test.passing_percentage}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>{test.question_count || 0} ta</span>
                  </div>
                </div>

                {/* Groups */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {test.groups && test.groups.length > 0 ? (
                    test.groups.map((g) => (
                      <span
                        key={g.id}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                      >
                        {g.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400">Guruh biriktirilmagan</span>
                  )}
                </div>
              </div>

              {/* Actions Grid */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1">
                <button
                  onClick={() => setQuestionsTest(test)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Savollarni ko'rish va tahrirlash"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Savollar</span>
                </button>

                <button
                  onClick={() => setDocxTest(test)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Word (.docx) fayldan import qilish"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Word</span>
                </button>

                <button
                  onClick={() => openEditModal(test)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Tahrirlash"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteTest(test.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingTest ? 'Testni Tahrirlash' : 'Yangi Test Yaratish'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveTest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: JavaScript Asoslari - 1-oraliq nazorat"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tavsif
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Test haqida qisqacha ma'lumot..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Group multi-select */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Test tayinlanadigan guruhlar (bir yoki bir nechta)
                </label>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const isSelected = selectedGroupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroupSelection(g.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{g.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number parameters */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vaqt (daqiqa)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Urinishlar soni
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    O'tish foizi (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingPercentage}
                    onChange={(e) => setPassingPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Start and End date limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Boshlanish sanasi (ixtiyoriy)
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tugash sanasi (ixtiyoriy)
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Checkboxes / Settings */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="block text-xs font-bold text-gray-900 dark:text-white">
                  Test Sozlamalari:
                </span>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Savollarni aralashtirish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Variantlarni aralashtirish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={showCorrectAnswers}
                    onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Natijadan keyin to'g'ri javoblar va izohlarni ko'rsatish</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Test faol (talabalarga ko'rinadi)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCX IMPORT MODAL */}
      {docxTest && (
        <DocxImportModal
          testId={docxTest.id}
          testTitle={docxTest.title}
          onClose={() => setDocxTest(null)}
          onSuccess={() => {
            setDocxTest(null);
            fetchData();
          }}
        />
      )}

      {/* QUESTIONS MANAGEMENT MODAL */}
      {questionsTest && (
        <QuestionEditorModal
          testId={questionsTest.id}
          testTitle={questionsTest.title}
          onClose={() => setQuestionsTest(null)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
};
