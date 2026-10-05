import React, { useState, useEffect } from 'react';
import { TestItem, QuestionAnalytic, UnattemptedStudent } from '../../types';
import {
  BarChart2,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Phone,
  UserX,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [questionStats, setQuestionStats] = useState<QuestionAnalytic[]>([]);
  const [unattempted, setUnattempted] = useState<UnattemptedStudent[]>([]);
  const [loading, setLoading] = useState(false);

  // Load tests on mount
  useEffect(() => {
    fetch('/api/tests')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTests(data);
          setSelectedTestId(data[0].id);
        }
      });
  }, []);

  // Fetch analytics when test changes
  useEffect(() => {
    if (!selectedTestId) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/teacher/analytics/questions?testId=${selectedTestId}`).then((r) => r.json()),
      fetch(`/api/teacher/analytics/unattempted?testId=${selectedTestId}`).then((r) => r.json()),
    ])
      .then(([qData, uData]) => {
        if (Array.isArray(qData)) setQuestionStats(qData);
        if (Array.isArray(uData)) setUnattempted(uData);
      })
      .catch((err) => console.warn('Analytics fetch error:', err))
      .finally(() => setLoading(false));
  }, [selectedTestId]);

  const selectedTest = tests.find((t) => t.id === selectedTestId);

  // Chart data
  const chartData = questionStats.map((q, idx) => ({
    nomi: `${idx + 1}-savol`,
    "To'g'ri (%)": q.correct_percentage,
    "Noto'g'ri (%)": q.incorrect_percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Test Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Chuqur Tahlil: Savollar statistikasi va Qatnashmagan talabalar
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Qaysi savollar talabalarga qiyin bo'lganini aniqlang va qatnashmaganlarni kuzating
          </p>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-500">Tahlil yuklanmoqda...</div>
      ) : (
        <>
          {/* SECTION 1: QUESTION ANALYTICS CHART */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              <span>Savollar bo'yicha To'g'ri va Noto'g'ri Javoblar Nisbati</span>
            </h3>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="nomi" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`${value}%`]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="To'g'ri (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Noto'g'ri (%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">
                Ushbu testda hali savollar mavjud emas.
              </p>
            )}

            {/* Questions Table Breakdown */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Savol matni</th>
                    <th className="py-2.5 px-3">Turi</th>
                    <th className="py-2.5 px-3">To'g'ri (%)</th>
                    <th className="py-2.5 px-3">Noto'g'ri (%)</th>
                    <th className="py-2.5 px-3">Murakkablik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {questionStats.map((q, idx) => (
                    <tr key={q.question_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-3 font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-medium text-gray-900 dark:text-white max-w-sm truncate">
                        {q.question_text}
                      </td>
                      <td className="py-3 px-3 text-gray-500">
                        {q.type === 'TRUE_FALSE' ? "To'g'ri/Noto'g'ri" : 'A/B/C/D'}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {q.correct_percentage}% ({q.correct_answers} ta)
                      </td>
                      <td className="py-3 px-3 font-bold text-red-600 dark:text-red-400">
                        {q.incorrect_percentage}% ({q.incorrect_answers} ta)
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.difficulty === 'Qiyin'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : q.difficulty === 'Oson'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: UNATTEMPTED STUDENTS (HALI TEST ISHLAMAGAN O'QUVCHILAR) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <UserX className="w-4 h-4 text-amber-500" />
                <span>Hali Test Ishlamagan O'quvchilar Ro'yxati</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                {unattempted.length} nafar o'quvchi
              </span>
            </div>

            {unattempted.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                Ajoyib! Ushbu test tayinlangan barcha guruh talabalari testni kamida bir marta topshirishgan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {unattempted.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-start justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">
                        {st.first_name} {st.last_name}
                      </p>
                      <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{st.phone}</span>
                      </p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-medium">
                        {st.group_name}
                      </span>
                    </div>

                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      Ishlamagan
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
