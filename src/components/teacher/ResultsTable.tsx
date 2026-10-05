import React, { useState, useEffect } from 'react';
import { TestResult, Group, TestItem } from '../../types';
import {
  FileSpreadsheet,
  Search,
  Filter,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';

export const ResultsTable: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Retake modal state
  const [retakeResult, setRetakeResult] = useState<TestResult | null>(null);
  const [retakeLoading, setRetakeLoading] = useState(false);

  const fetchResults = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedGroupId) params.append('groupId', selectedGroupId);
    if (selectedTestId) params.append('testId', selectedTestId);
    if (searchQuery) params.append('search', searchQuery);
    if (selectedDate) params.append('date', selectedDate);

    fetch(`/api/teacher/results?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
      })
      .catch((err) => console.warn('Results fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load metadata
    Promise.all([
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/tests').then((r) => r.json()),
    ]).then(([groupsData, testsData]) => {
      if (Array.isArray(groupsData)) setGroups(groupsData);
      if (Array.isArray(testsData)) setTests(testsData);
    });
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedGroupId, selectedTestId, searchQuery, selectedDate]);

  // Handle Excel Download
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (selectedGroupId) params.append('groupId', selectedGroupId);
    if (selectedTestId) params.append('testId', selectedTestId);
    if (searchQuery) params.append('search', searchQuery);
    if (selectedDate) params.append('date', selectedDate);

    const downloadUrl = `/api/teacher/export-excel?${params.toString()}`;
    window.location.href = downloadUrl;
  };

  // Handle Retake Confirmation
  const handleConfirmRetake = async () => {
    if (!retakeResult) return;
    setRetakeLoading(true);

    try {
      const res = await fetch(`/api/teacher/results/${retakeResult.id}/retake`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Qayta topshirishga ruxsat berishda xatolik');

      setRetakeResult(null);
      fetchResults();
    } catch (err: any) {
      alert(err?.message || 'Xatolik yuz berdi');
    } finally {
      setRetakeLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Excel Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            O'quvchilar Natijalari Jadvali
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Filtrlar bo'yicha saralash, natijalarni Excelga (.xlsx) yuklash va qayta topshirishga ruxsat berish
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excelga yuklash (.xlsx)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="O'quvchi yoki telefon..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Group filter */}
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Barcha guruhlar</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Test filter */}
        <select
          value={selectedTestId}
          onChange={(e) => setSelectedTestId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Barcha testlar</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        {/* Date filter */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-500">Yuklanmoqda...</div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500">
            Tanlangan parametrlar bo'yicha hech qanday natija topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">O'quvchi</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Guruh</th>
                  <th className="py-3 px-4">Test</th>
                  <th className="py-3 px-4">Ball</th>
                  <th className="py-3 px-4">Foiz</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Vaqt</th>
                  <th className="py-3 px-4">Tab switch</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {results.map((r) => {
                  const minutes = Math.floor(r.duration_seconds / 60);
                  const seconds = r.duration_seconds % 60;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {r.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {r.student_phone}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                        {r.group_name}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                        {r.test_title}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                        {r.earned_points} / {r.max_points}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                        {r.percentage}%
                      </td>
                      <td className="py-3.5 px-4">
                        {r.passed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            O'tdi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                            <XCircle className="w-3 h-3" />
                            O'tmadi
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {minutes}m {seconds}s
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        {r.tab_switch_count} marta
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setRetakeResult(r)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors"
                          title="Natijani o'chirish va qayta topshirishga ruxsat berish"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Qayta topshirish</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RETAKE CONFIRMATION MODAL */}
      {retakeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Qayta topshirishga ruxsat berilsinmi?
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Bu amal o'quvchi (<strong>{retakeResult.student_name}</strong>) ning{' '}
              <strong>"{retakeResult.test_title}"</strong> testi bo'yicha oldingi natijasini o'chiradi
              va unga yangi urinish beradi. Davom etilsinmi?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRetakeResult(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={retakeLoading}
                onClick={handleConfirmRetake}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {retakeLoading ? "O'chirilmoqda..." : "Ha, ruxsat berish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
