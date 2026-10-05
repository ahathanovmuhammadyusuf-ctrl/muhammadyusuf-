import React, { useState, useEffect } from 'react';
import { Question, QuestionType, QuestionOption } from '../../types';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface QuestionEditorModalProps {
  testId: string;
  testTitle: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  testId,
  testTitle,
  onClose,
  onUpdated,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form states for new question
  const [qType, setQType] = useState<QuestionType>('SINGLE_CHOICE');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState(1);
  const [qExplanation, setQExplanation] = useState('');
  const [options, setOptions] = useState<
    { option_letter: string; option_text: string; is_correct: boolean }[]
  >([
    { option_letter: 'A', option_text: '', is_correct: true },
    { option_letter: 'B', option_text: '', is_correct: false },
    { option_letter: 'C', option_text: '', is_correct: false },
    { option_letter: 'D', option_text: '', is_correct: false },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = () => {
    setLoading(true);
    fetch(`/api/tests/${testId}/questions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setQuestions(data);
      })
      .catch((err) => console.warn('Questions fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  // Adjust options template when switching type
  const handleTypeChange = (type: QuestionType) => {
    setQType(type);
    if (type === 'TRUE_FALSE') {
      setOptions([
        { option_letter: 'A', option_text: "To'g'ri", is_correct: true },
        { option_letter: 'B', option_text: "Noto'g'ri", is_correct: false },
      ]);
    } else {
      setOptions([
        { option_letter: 'A', option_text: '', is_correct: true },
        { option_letter: 'B', option_text: '', is_correct: false },
        { option_letter: 'C', option_text: '', is_correct: false },
        { option_letter: 'D', option_text: '', is_correct: false },
      ]);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!qText.trim()) {
      setError('Savol matnini kiriting.');
      return;
    }

    if (options.some((o) => !o.option_text.trim())) {
      setError("Barcha variantlar matnini to'ldiring.");
      return;
    }

    if (!options.some((o) => o.is_correct)) {
      setError("Kamida bitta to'g'ri variantni belgilang.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: qType,
          question_text: qText.trim(),
          points: qPoints,
          explanation: qExplanation.trim(),
          options,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Savolni yaratishda xatolik');
      }

      // Reset form
      setQText('');
      setQExplanation('');
      setIsCreating(false);
      fetchQuestions();
      onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Haqiqatan ham bu savolni o'chirmoqchimisiz?")) return;

    try {
      await fetch(`/api/tests/${testId}/questions/${questionId}`, {
        method: 'DELETE',
      });
      fetchQuestions();
      onUpdated();
    } catch (err) {
      console.warn("O'chirishda xatolik:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>Savollar Boshqaruvi</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Test: <strong className="text-gray-900 dark:text-white">{testTitle}</strong> ({questions.length} ta savol)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Mavjud savollar ro'yxati:</span>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi savol qo'shish</span>
              </button>
            )}
          </div>

          {/* New Question Form */}
          {isCreating && (
            <form
              onSubmit={handleCreateQuestion}
              className="p-5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/40 pb-2">
                <span className="font-bold text-xs text-blue-900 dark:text-blue-100">
                  Yangi savol yaratish
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Bekor qilish
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Savol turi
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  >
                    <option value="SINGLE_CHOICE">Yagona tanlov (A, B, C, D)</option>
                    <option value="TRUE_FALSE">To'g'ri / Noto'g'ri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ball
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Savol matni
                </label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Savolni kiriting..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Variantlar va to'g'ri javobni belgilash:
                </label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((prev) =>
                          prev.map((o, i) => ({ ...o, is_correct: i === idx }))
                        )
                      }
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-all ${
                        opt.is_correct
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300'
                      }`}
                      title={opt.is_correct ? "To'g'ri javob" : "To'g'ri javob sifatida belgilash"}
                    >
                      {opt.option_letter}
                    </button>
                    <input
                      type="text"
                      required
                      value={opt.option_text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOptions((prev) =>
                          prev.map((o, i) => (i === idx ? { ...o, option_text: val } : o))
                        );
                      }}
                      placeholder={`Variant ${opt.option_letter}...`}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                    {opt.is_correct && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>To'g'ri</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Izoh / Tushuntirish (testdan keyin ko'rsatiladi)
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Savol bo'yicha tushuntirish..."
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          )}

          {/* Questions List */}
          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">Yuklanmoqda...</div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              Bu testda hozircha savollar yo'q. "Yangi savol qo'shish" yoki Word (.docx) importidan foydalaning.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        {idx + 1}. {q.question_text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {q.points} ball
                      </span>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`text-xs p-2 rounded-lg flex items-center justify-between border ${
                          opt.is_correct
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-semibold'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>
                          <strong>{opt.option_letter})</strong> {opt.option_text}
                        </span>
                        {opt.is_correct && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                      <strong>Izoh:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-semibold"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
