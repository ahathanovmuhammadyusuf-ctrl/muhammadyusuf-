import React, { useState, useEffect } from 'react';
import { Group, Profile } from '../../types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  UserMinus,
  X,
  Phone,
  User,
  AlertCircle,
} from 'lucide-react';

export const GroupManager: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Group modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Add student modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [stFirstName, setStFirstName] = useState('');
  const [stLastName, setStLastName] = useState('');
  const [stPhone, setStPhone] = useState('+998');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = () => {
    setLoading(true);
    fetch('/api/groups')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGroups(data);
          if (data.length > 0 && !selectedGroup) {
            setSelectedGroup(data[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchMembers = (groupId: string) => {
    setMembersLoading(true);
    fetch(`/api/groups/${groupId}/members`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .finally(() => setMembersLoading(false));
  };

  useEffect(() => {
    if (selectedGroup) {
      fetchMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  // Group CRUD
  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDesc('');
    setError(null);
    setIsGroupModalOpen(true);
  };

  const openEditGroup = (g: Group) => {
    setEditingGroup(g);
    setGroupName(g.name);
    setGroupDesc(g.description || '');
    setError(null);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return setError('Guruh nomini kiriting');

    setSaving(true);
    try {
      const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName, description: groupDesc }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xatolik');

      setIsGroupModalOpen(false);
      fetchGroups();
    } catch (err: any) {
      setError(err?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm("Rostdan ham bu guruhni o'chirmoqchimisiz?")) return;

    try {
      await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      console.warn("Guruhni o'chirishda xatolik:", err);
    }
  };

  // Student in Group CRUD
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (!stFirstName.trim() || !stLastName.trim() || stPhone.length < 13) {
      setError("Ism, familiya va to'liq telefon raqamini kiriting (+998XXXXXXXXX)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: stFirstName,
          last_name: stLastName,
          phone: stPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "O'quvchini qo'shishda xatolik");

      setIsStudentModalOpen(false);
      setStFirstName('');
      setStLastName('');
      setStPhone('+998');
      fetchMembers(selectedGroup.id);
      fetchGroups();
    } catch (err: any) {
      setError(err?.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;
    if (!window.confirm("O'quvchini ushbu guruhdan chiqarmoqchimisiz?")) return;

    try {
      await fetch(`/api/groups/${selectedGroup.id}/members/${studentId}`, {
        method: 'DELETE',
      });
      fetchMembers(selectedGroup.id);
      fetchGroups();
    } catch (err) {
      console.warn('Student remove error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Guruhlar va O'quvchilar Boshqaruvi
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Akademik guruhlar tuzish, talabalarni ro'yxatga olish va biriktirish
          </p>
        </div>

        <button
          onClick={openCreateGroup}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Guruh Yaratish</span>
        </button>
      </div>

      {/* Grid: Left Groups, Right Students */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GROUPS LIST */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            Guruhlar ro'yxati ({groups.length})
          </span>

          {loading ? (
            <div className="py-8 text-center text-xs text-gray-500">Yuklanmoqda...</div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => {
                const isSelected = selectedGroup?.id === g.id;

                return (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGroup(g)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">{g.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {g.student_count || 0} nafar o'quvchi
                      </p>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditGroup(g)}
                        className="p-1 rounded text-gray-400 hover:text-gray-600"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
                        className="p-1 rounded text-red-400 hover:text-red-600"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MEMBERS OF SELECTED GROUP */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
          {selectedGroup ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedGroup.description || "Tavsif yo'q"}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setError(null);
                    setIsStudentModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>O'quvchi qo'shish</span>
                </button>
              </div>

              {membersLoading ? (
                <div className="py-8 text-center text-xs text-gray-500">Yuklanmoqda...</div>
              ) : members.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  Ushbu guruhda hozircha o'quvchilar yo'q. "O'quvchi qo'shish" tugmasini bosing.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">O'quvchi</th>
                        <th className="py-2.5 px-3">Telefon</th>
                        <th className="py-2.5 px-3">Qo'shilgan sana</th>
                        <th className="py-2.5 px-3 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                          <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                            {m.first_name} {m.last_name}
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300">
                            {m.phone}
                          </td>
                          <td className="py-3 px-3 text-gray-500">
                            {new Date(m.created_at).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(m.id)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Guruhdan chiqarish"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-xs text-gray-500">
              Guruhni tanlang yoki yangi guruh yarating.
            </div>
          )}
        </div>
      </div>

      {/* CREATE/EDIT GROUP MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                {editingGroup ? 'Guruhni Tahrirlash' : 'Yangi Guruh Yaratish'}
              </h3>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <form onSubmit={handleSaveGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guruh nomi
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Dasturlash Asoslari - 101"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tavsif (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="Guruh haqida qisqacha..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Guruhga O'quvchi Qo'shish
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ism
                </label>
                <input
                  type="text"
                  required
                  value={stFirstName}
                  onChange={(e) => setStFirstName(e.target.value)}
                  placeholder="Aziz"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Familiya
                </label>
                <input
                  type="text"
                  required
                  value={stLastName}
                  onChange={(e) => setStLastName(e.target.value)}
                  placeholder="Karimov"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon raqam
                </label>
                <input
                  type="tel"
                  required
                  value={stPhone}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (!v.startsWith('+998')) v = '+998' + v.replace(/\D/g, '');
                    setStPhone('+998' + v.substring(4).replace(/\D/g, '').slice(0, 9));
                  }}
                  placeholder="+998901234567"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  {saving ? "Qo'shilmoqda..." : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
