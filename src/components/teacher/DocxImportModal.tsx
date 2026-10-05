import React, { useState } from 'react';
import { parseDocxFile, parseQuestionsFromRawText, ParsedQuestion } from '../../lib/docxParser';
import {
  Upload,
  FileCode,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Check,
  Plus,
  X,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface DocxImportModalProps {
  testId: string;
  testTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocxImportModal: React.FC<DocxImportModalProps> = ({
  testId,
  testTitle,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'upload' | 'paste' | 'preview'>('upload');
  const [pasteText, setPasteText] = useState<string>(
    `1. Kompyuter xotirasining eng tezkor turi qaysi?
A) HDD
B) SSD
*C) Kesh xotira (Cache)
D) Flesh xotira

2. Python dasturlash tili kompilyatsiya qilinmaydi, faqat interpretatsiya qilinadi.
A) To'g'ri
*B) Noto'g'ri
Izoh: Python avval bayt-kodga (.pyc) kompilyatsiya qilinadi, so'ngra Python Virtual Machine da interpretatsiya qilinadi.

3. Tarmoq xavfsizligida DDoS hujumi nima?
*A) Serverni ortiqcha so'rovlar bilan to'ldirib ishdan chiqarish
B) Parollarni o'g'irlash
C) Fayllarni shifrlab to'lov talab qilish
D) Foydalanuvchi nomidan soxta xat yuborish`
  );

  const [parsing, setParsing] = useState(false);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // File drop/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setGeneralErrors([]);
    try {
      const result = await parseDocxFile(file);
      setQuestions(result.questions);
      setGeneralErrors(result.generalErrors);
      setTab('preview');
    } catch (err: any) {
      setGeneralErrors([err?.message || "Faylni o'qishda xatolik"]);
    } finally {
      setParsing(false);
    }
  };

  const handleParseText = () => {
    setParsing(true);
    setGeneralErrors([]);
    try {
      const result = parseQuestionsFromRawText(pasteText);
      setQuestions(result.questions);
      setGeneralErrors(result.generalErrors);
      setTab('preview');
    } catch (err: any) {
      setGeneralErrors([err?.message || 'Matnni qayta ishlashda xatolik']);
    } finally {
      setParsing(false);
    }
  };

  // Preview modifications
  const handleDeleteQuestion = (tempId: string) => {
    setQuestions((prev) => prev.filter((q) => q.tempId !== tempId));
  };

  const handleSetCorrectOption = (questionTempId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.tempId !== questionTempId) return q;

        const updatedOptions = q.options.map((opt, idx) => ({
          ...opt,
          isCorrect: idx === optIndex,
        }));

        // Re-evaluate errors
        const errors = q.errors.filter(
          (err) => !err.includes("to'g'ri javob") && !err.includes("bir nechta")
        );

        return {
          ...q,
          options: updatedOptions,
          errors,
        };
      })
    );
  };

  const handlePointsChange = (questionTempId: string, points: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === questionTempId ? { ...q, points } : q))
    );
  };

  const handleExplanationChange = (questionTempId: string, explanation: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.tempId === questionTempId ? { ...q, explanation } : q))
    );
  };

  // Commit valid questions to database
  const handleSaveToDatabase = async () => {
    const validQuestions = questions.filter((q) => q.errors.length === 0);
    if (validQuestions.length === 0) {
      alert("Testga qo'shish uchun kamida bitta xatosiz savol bo'lishi kerak.");
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/tests/${testId}/import-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: validQuestions }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Savollarni saqlashda xatolik yuz berdi");
      }

      setStatusMessage(data.message || 'Muvaffaqiyatli saqlandi!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setGeneralErrors([err?.message || "Saqlashda xatolik"]);
    } finally {
      setSaving(false);
    }
  };

  const hasAnyErrors = questions.some((q) => q.errors.length > 0) || generalErrors.length > 0;
  const validCount = questions.filter((q) => q.errors.length === 0).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-600" />
              <span>Word (.docx) orqali savollarni import qilish</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Test: <strong className="text-gray-900 dark:text-white">{testTitle}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mt-4">
          <button
            onClick={() => setTab('upload')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
              tab === 'upload'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            DOCX fayl yuklash
          </button>
          <button
            onClick={() => setTab('paste')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all ${
              tab === 'paste'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Matn nusxasini qo'yish (Format)
          </button>
          {questions.length > 0 && (
            <button
              onClick={() => setTab('preview')}
              className={`py-2 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                tab === 'preview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Savollar Ko'rinishi (Preview)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                {questions.length}
              </span>
            </button>
          )}
        </div>

        {/* Errors display */}
        {generalErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 space-y-1">
            {generalErrors.map((err, idx) => (
              <p key={idx} className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{err}</span>
              </p>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* TAB 1: FILE UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Word (.docx) faylini tanlang yoki shu yerga tashlang
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Fayl ichidagi savollar 1., 2. tartibida va to'g'ri variant * bilan belgilangan bo'lishi lozim.
                </p>

                <label className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-md shadow-blue-500/20 transition-colors">
                  <span>Faylni tanlash</span>
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Format Example Box */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 space-y-2">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Kutilayotgan .docx formati:
                </p>
                <pre className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  {`1. Savol matni?
A) Variant
*B) To'g'ri variant (yulduzcha bilan)
C) Variant
D) Variant

2. Keyingi savol?
*A) To'g'ri variant
B) Variant
Izoh: Ixtiyoriy izoh`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT PASTE */}
          {tab === 'paste' && (
            <div className="space-y-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Savollar matnini shu yerga qo'ying:
              </label>
              <textarea
                rows={10}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleParseText}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Formatni tekshirish va Preview qilish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 3: PREVIEW & EDIT BEFORE DATABASE COMMIT */}
          {tab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between text-blue-900 dark:text-blue-100">
                <span>
                  Jami topilgan savollar: <strong>{questions.length} ta</strong> (Yaroqli:{' '}
                  <strong>{validCount} ta</strong>)
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Kerak bo'lsa to'g'ri javobni bosib o'zgartiring
                </span>
              </div>

              {questions.map((q, qIdx) => {
                const hasErrors = q.errors.length > 0;

                return (
                  <div
                    key={q.tempId}
                    className={`p-4 rounded-xl border transition-all ${
                      hasErrors
                        ? 'border-red-300 dark:border-red-800 bg-red-50/20 dark:bg-red-950/10'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        Savol {qIdx + 1} ({q.type === 'TRUE_FALSE' ? "To'g'ri/Noto'g'ri" : 'A/B/C/D'})
                      </span>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-gray-500 flex items-center gap-1">
                          <span>Ball:</span>
                          <input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) => handlePointsChange(q.tempId, Number(e.target.value))}
                            className="w-12 px-1.5 py-0.5 text-center text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.tempId)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Savolni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question text */}
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-2">
                      {q.questionText}
                    </p>

                    {/* Options Preview */}
                    <div className="mt-3 space-y-1.5">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          onClick={() => handleSetCorrectOption(q.tempId, optIdx)}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-colors ${
                            opt.isCorrect
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-semibold'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>
                            <strong>{opt.letter})</strong> {opt.text}
                          </span>
                          {opt.isCorrect && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              <span>To'g'ri javob</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleExplanationChange(q.tempId, e.target.value)}
                        placeholder="Izoh / Tushuntirish (ixtiyoriy)..."
                        className="w-full px-2.5 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Errors if any */}
                    {q.errors.length > 0 && (
                      <div className="mt-2 text-[11px] text-red-600 dark:text-red-400 space-y-0.5 font-medium">
                        {q.errors.map((err, eIdx) => (
                          <p key={eIdx}>❌ {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {tab === 'preview' && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {validCount} ta savol tayyor
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={saving || validCount === 0}
                onClick={handleSaveToDatabase}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {saving ? (
                  <span>Saqlanmoqda...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Testga qo'shish ({validCount} ta)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
