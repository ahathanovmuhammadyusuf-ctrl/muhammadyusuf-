import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ====================================================================
// DATABASE SCHEMAS & IN-MEMORY ENGINE
// (Seamlessly mirrors Supabase schema and runs in AI Studio preview)
// ====================================================================

interface DBProfile {
  id: string;
  role: 'student' | 'teacher' | 'admin';
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  telegram_chat_id?: number | null;
  created_at: string;
  level?: string;
  xp?: number;
  next_level_xp?: number;
  streak?: number;
  study_hours?: number;
  completed_courses?: number;
  completed_tests?: number;
  average_score?: number;
}

interface DBCourseLesson {
  id: string;
  course_id: string;
  title: string;
  duration_minutes: number;
  order_num: number;
  is_completed: boolean;
  content_text: string;
  video_url?: string;
  key_takeaways: string[];
}

interface DBCourse {
  id: string;
  title: string;
  category: string;
  description: string;
  teacher_name: string;
  lessons_count: number;
  duration_hours: number;
  level: string;
  progress: number;
  icon: string;
  banner_color: string;
  lessons: DBCourseLesson[];
  tests_count: number;
  enrolled_count: number;
  created_at: string;
}

interface DBChallengeDay {
  day_num: number;
  day_name: string;
  task_title: string;
  task_type: 'test' | 'lesson' | 'questions' | 'minitest' | 'final';
  xp_reward: number;
  is_completed: boolean;
  is_current: boolean;
}

interface DBGroup {
  id: string;
  teacher_id: string;
  name: string;
  description: string;
  created_at: string;
}

interface DBGroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string;
}

interface DBTest {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  max_attempts: number;
  passing_percentage: number;
  start_time?: string | null;
  end_time?: string | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers_after_test: boolean;
  is_active: boolean;
  created_at: string;
}

interface DBTestGroup {
  id: string;
  test_id: string;
  group_id: string;
}

interface DBQuestion {
  id: string;
  test_id: string;
  type: 'SINGLE_CHOICE' | 'TRUE_FALSE';
  question_text: string;
  points: number;
  explanation: string;
  order_num: number;
  created_at: string;
}

interface DBOption {
  id: string;
  question_id: string;
  option_letter: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

interface DBAttempt {
  id: string;
  test_id: string;
  student_id: string;
  started_at: string;
  server_end_time: string;
  submitted_at?: string | null;
  status: 'in_progress' | 'completed' | 'expired' | 'reset';
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  duration_seconds: number;
  tab_switch_count: number;
}

interface DBAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  points_earned: number;
}

interface DBResult {
  id: string;
  attempt_id: string;
  student_id: string;
  test_id: string;
  earned_points: number;
  max_points: number;
  percentage: number;
  passed: boolean;
  duration_seconds: number;
  tab_switch_count: number;
  created_at: string;
}

interface DBTabSwitch {
  id: string;
  attempt_id: string;
  student_id: string;
  timestamp: string;
}

interface DBTelegramVerification {
  id: string;
  phone: string;
  code_hash: string;
  code_plain: string;
  expires_at: number;
  is_used: boolean;
  created_at: string;
}

// -------------------------------------------------------------
// SEED DATABASE STORE
// -------------------------------------------------------------
const db = {
  profiles: [
    {
      id: 'admin-1',
      role: 'admin' as const,
      first_name: 'Super',
      last_name: 'Admin',
      phone: '+998990000001',
      created_at: new Date().toISOString(),
    },
    {
      id: 'teacher-1',
      role: 'teacher' as const,
      first_name: 'Sardor',
      last_name: 'Rahimov',
      phone: '+998901234567',
      created_at: new Date().toISOString(),
    },
    {
      id: 'student-ahathanov',
      role: 'student' as const,
      first_name: 'Muhammadyusuf',
      last_name: 'Ahathanov',
      phone: '+998901234567',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      level: 'Advanced',
      xp: 740,
      next_level_xp: 1000,
      streak: 5,
      study_hours: 18.5,
      completed_courses: 2,
      completed_tests: 12,
      average_score: 87,
    },
    {
      id: 'student-1',
      role: 'student' as const,
      first_name: 'Aziz',
      last_name: 'Karimov',
      phone: '+998901112233',
      created_at: new Date().toISOString(),
      level: 'Intermediate',
      xp: 520,
      next_level_xp: 700,
      streak: 4,
      study_hours: 14.0,
      completed_courses: 1,
      completed_tests: 8,
      average_score: 82,
    },
    {
      id: 'student-2',
      role: 'student' as const,
      first_name: 'Malika',
      last_name: 'Yusupova',
      phone: '+998902223344',
      created_at: new Date().toISOString(),
      level: 'Expert',
      xp: 1240,
      next_level_xp: 1500,
      streak: 9,
      study_hours: 28.5,
      completed_courses: 3,
      completed_tests: 15,
      average_score: 93,
    },
    {
      id: 'student-3',
      role: 'student' as const,
      first_name: 'Jasur',
      last_name: 'Nazarov',
      phone: '+998903334455',
      created_at: new Date().toISOString(),
      level: 'Junior',
      xp: 380,
      next_level_xp: 500,
      streak: 2,
      study_hours: 9.0,
      completed_courses: 1,
      completed_tests: 5,
      average_score: 74,
    },
    {
      id: 'student-4',
      role: 'student' as const,
      first_name: 'Zuhra',
      last_name: 'Ahmedova',
      phone: '+998904445566',
      created_at: new Date().toISOString(),
      level: 'Starter',
      xp: 180,
      next_level_xp: 300,
      streak: 1,
      study_hours: 5.5,
      completed_courses: 0,
      completed_tests: 3,
      average_score: 68,
    },
    {
      id: 'student-5',
      role: 'student' as const,
      first_name: 'Bobur',
      last_name: 'Mirzayev',
      phone: '+998905556677',
      created_at: new Date().toISOString(),
      level: 'Beginner',
      xp: 80,
      next_level_xp: 200,
      streak: 0,
      study_hours: 2.0,
      completed_courses: 0,
      completed_tests: 1,
      average_score: 55,
    },
    {
      id: 'student-6',
      role: 'student' as const,
      first_name: 'Nigora',
      last_name: 'Toshmatova',
      phone: '+998906667788',
      created_at: new Date().toISOString(),
      level: 'Advanced',
      xp: 810,
      next_level_xp: 1000,
      streak: 6,
      study_hours: 21.0,
      completed_courses: 2,
      completed_tests: 11,
      average_score: 89,
    },
    {
      id: 'student-7',
      role: 'student' as const,
      first_name: 'Sardor',
      last_name: 'Bekchanov',
      phone: '+998907778899',
      created_at: new Date().toISOString(),
      level: 'Intermediate',
      xp: 610,
      next_level_xp: 800,
      streak: 3,
      study_hours: 16.0,
      completed_courses: 1,
      completed_tests: 9,
      average_score: 80,
    },
    {
      id: 'student-8',
      role: 'student' as const,
      first_name: 'Madina',
      last_name: 'Shodiyeva',
      phone: '+998908889900',
      created_at: new Date().toISOString(),
      level: 'Junior',
      xp: 320,
      next_level_xp: 500,
      streak: 2,
      study_hours: 8.0,
      completed_courses: 0,
      completed_tests: 4,
      average_score: 72,
    },
    {
      id: 'student-9',
      role: 'student' as const,
      first_name: 'Farrux',
      last_name: 'Ganiyev',
      phone: '+998909990011',
      created_at: new Date().toISOString(),
      level: 'Starter',
      xp: 150,
      next_level_xp: 300,
      streak: 1,
      study_hours: 4.0,
      completed_courses: 0,
      completed_tests: 2,
      average_score: 65,
    },
    {
      id: 'student-10',
      role: 'student' as const,
      first_name: 'Shahlo',
      last_name: 'Saidova',
      phone: '+998901239988',
      created_at: new Date().toISOString(),
      level: 'Beginner',
      xp: 50,
      next_level_xp: 200,
      streak: 0,
      study_hours: 1.5,
      completed_courses: 0,
      completed_tests: 0,
      average_score: 0,
    },
  ] as DBProfile[],

  groups: [
    {
      id: 'group-it-01',
      teacher_id: 'teacher-1',
      name: 'IT-01',
      description: "Dasturlash, Sun'iy Intellekt va Algoritmlar yo'nalishi",
      created_at: new Date().toISOString(),
    },
    {
      id: 'group-1',
      teacher_id: 'teacher-1',
      name: 'IT-101',
      description: "Web texnologiyalari va dasturlash mantig'i",
      created_at: new Date().toISOString(),
    },
    {
      id: 'group-2',
      teacher_id: 'teacher-1',
      name: 'Python Beginner',
      description: "Boshlang'ich Python dasturlash va ma'lumotlar tahlili",
      created_at: new Date().toISOString(),
    },
    {
      id: 'group-3',
      teacher_id: 'teacher-1',
      name: 'Frontend-01',
      description: 'React, TypeScript va Tailwind CSS zamonaviy veb',
      created_at: new Date().toISOString(),
    },
    {
      id: 'group-4',
      teacher_id: 'teacher-1',
      name: 'Robototexnika',
      description: 'Arduino, ESP32 va IoT dasturlash asoslari',
      created_at: new Date().toISOString(),
    },
    {
      id: 'group-5',
      teacher_id: 'teacher-1',
      name: 'Matematika',
      description: 'Oliy matematika, diskret tuzilmalar va mantiq',
      created_at: new Date().toISOString(),
    },
  ] as DBGroup[],

  group_members: [
    { id: 'gm-ahathanov', group_id: 'group-it-01', student_id: 'student-ahathanov', joined_at: new Date().toISOString() },
    { id: 'gm-1', group_id: 'group-it-01', student_id: 'student-1', joined_at: new Date().toISOString() },
    { id: 'gm-2', group_id: 'group-it-01', student_id: 'student-2', joined_at: new Date().toISOString() },
    { id: 'gm-3', group_id: 'group-1', student_id: 'student-3', joined_at: new Date().toISOString() },
    { id: 'gm-4', group_id: 'group-1', student_id: 'student-4', joined_at: new Date().toISOString() },
    { id: 'gm-5', group_id: 'group-2', student_id: 'student-5', joined_at: new Date().toISOString() },
    { id: 'gm-6', group_id: 'group-2', student_id: 'student-6', joined_at: new Date().toISOString() },
    { id: 'gm-7', group_id: 'group-3', student_id: 'student-7', joined_at: new Date().toISOString() },
    { id: 'gm-8', group_id: 'group-4', student_id: 'student-8', joined_at: new Date().toISOString() },
    { id: 'gm-9', group_id: 'group-5', student_id: 'student-9', joined_at: new Date().toISOString() },
    { id: 'gm-10', group_id: 'group-5', student_id: 'student-10', joined_at: new Date().toISOString() },
  ] as DBGroupMember[],

  courses: [
    {
      id: 'course-1',
      title: 'Python Dasturlash Asoslari va Algoritmlar',
      category: 'Dasturlash',
      description: "Sintaksis, OOP, fayllar bilan ishlash va ma'lumotlar tahlili uchun to'liq amaliy kurs",
      teacher_name: 'Sardor Rahimov',
      lessons_count: 12,
      duration_hours: 24,
      level: 'Beginner',
      progress: 65,
      icon: 'Code2',
      banner_color: 'from-blue-600 to-indigo-600',
      tests_count: 4,
      enrolled_count: 248,
      created_at: new Date().toISOString(),
      lessons: [
        {
          id: 'l-1-1',
          course_id: 'course-1',
          title: "1-Dars: Python bilan tanishuv va o'rnatish",
          duration_minutes: 25,
          order_num: 1,
          is_completed: true,
          content_text: "Python interpretatorini o'rnatish, VS Code bilan ishlash, dastlabki print() va o'zgaruvchilar.",
          video_url: 'https://www.youtube.com/embed/kqtD5dpn9C8',
          key_takeaways: ["Python interpretatori tuzilishi", "O'zgaruvchilar va tiplar", "print() va input() amallari"],
        },
        {
          id: 'l-1-2',
          course_id: 'course-1',
          title: "2-Dars: Shartli operatorlar (if, elif, else)",
          duration_minutes: 30,
          order_num: 2,
          is_completed: true,
          content_text: "Mantiqiy ifodalar, boolean qiymatlar, if-elif-else zanjiri va and/or mantiqiy operatorlari.",
          video_url: 'https://www.youtube.com/embed/kqtD5dpn9C8',
          key_takeaways: ["Shartli tarmoqlanish", "Mantiqiy operatorlar", "Taqqoslash belgilari"],
        },
        {
          id: 'l-1-3',
          course_id: 'course-1',
          title: "3-Dars: Takrorlanish operatorlari (for, while)",
          duration_minutes: 35,
          order_num: 3,
          is_completed: true,
          content_text: "range() funksiyasi, for tsikli, while operatori, break va continue ko'rsatmalari.",
          key_takeaways: ["Tsikllar bilan ishlash", "range() parametrlari", "break/continue nazorati"],
        },
        {
          id: 'l-1-4',
          course_id: 'course-1',
          title: "4-Dars: Ro'yxatlar (List) va Tuple",
          duration_minutes: 40,
          order_num: 4,
          is_completed: false,
          content_text: "List metodlari (append, pop, insert, sort), indekslash, slicing va o'zgarmas Tuple turi.",
          key_takeaways: ["List metodlari", "Indekslash va qirqish (slice)", "Tuple xususiyatlari"],
        },
      ],
    },
    {
      id: 'course-2',
      title: 'Zamonaviy Frontend Web Dasturlash (React & Tailwind)',
      category: 'Web Dasturlash',
      description: "HTML5, CSS3, JavaScript ES6+, React Hooks va zamonaviy Tailwind CSS dizayn tizimi",
      teacher_name: 'Farhod Sobirov',
      lessons_count: 18,
      duration_hours: 36,
      level: 'Intermediate',
      progress: 40,
      icon: 'Layout',
      banner_color: 'from-violet-600 to-purple-600',
      tests_count: 6,
      enrolled_count: 312,
      created_at: new Date().toISOString(),
      lessons: [
        {
          id: 'l-2-1',
          course_id: 'course-2',
          title: "1-Dars: Semantik HTML va zamonaviy CSS",
          duration_minutes: 30,
          order_num: 1,
          is_completed: true,
          content_text: "Veb sahifaning semantik skeletini tuzish, Flexbox va Grid orqali moslashuvchan dizayn.",
          key_takeaways: ["Semantik teglar", "Flexbox container & item", "CSS Grid asoslari"],
        },
        {
          id: 'l-2-2',
          course_id: 'course-2',
          title: "2-Dars: React Hooks (useState, useEffect)",
          duration_minutes: 45,
          order_num: 2,
          is_completed: true,
          content_text: "Komponent holatini boshqarish, asinxron ma'lumotlarni useEffect yordamida yuklash.",
          key_takeaways: ["Komponent hayot sikli", "useState reaktivligi", "useEffect qaramliklar massivi"],
        },
      ],
    },
    {
      id: 'course-3',
      title: "Algoritmlar va Ma'lumotlar Tuzilmasi",
      category: 'Informatika',
      description: "Big-O tahlili, massivlar, bog'langan ro'yxatlar, daraxtlar, qidiruv va saralash algoritmlari",
      teacher_name: 'Sardor Rahimov',
      lessons_count: 10,
      duration_hours: 20,
      level: 'Advanced',
      progress: 20,
      icon: 'Binary',
      banner_color: 'from-cyan-600 to-blue-600',
      tests_count: 5,
      enrolled_count: 195,
      created_at: new Date().toISOString(),
      lessons: [
        {
          id: 'l-3-1',
          course_id: 'course-3',
          title: "1-Dars: Algoritmik murakkablik va Big-O tahlili",
          duration_minutes: 35,
          order_num: 1,
          is_completed: true,
          content_text: "Vaqt va xotira murakkabligi: O(1), O(log n), O(n), O(n log n), O(n^2) taqqoslamalari.",
          key_takeaways: ["Asimptotik baholash", "Eng yaxshi, o'rtacha va eng yomon holat"],
        },
      ],
    },
    {
      id: 'course-4',
      title: 'Kiberxavfsizlik va Tarmoq Texnologiyalari',
      category: 'Xavfsizlik',
      description: "OSI 7 pog'onasi, TCP/IP, shifrlash protokollari, SQL injection va himoya strategiyalari",
      teacher_name: 'Anvar Alimov',
      lessons_count: 8,
      duration_hours: 16,
      level: 'Intermediate',
      progress: 0,
      icon: 'Shield',
      banner_color: 'from-rose-600 to-red-600',
      tests_count: 3,
      enrolled_count: 140,
      created_at: new Date().toISOString(),
      lessons: [],
    },
    {
      id: 'course-5',
      title: 'Matematika va Mantiqiy Fikrlash',
      category: 'Mantiq',
      description: "Kombinatorika, to'plamlar nazariyasi, mantiqiy xulosalar va olimpiada masalalari",
      teacher_name: 'Jamshid Qodirov',
      lessons_count: 15,
      duration_hours: 30,
      level: 'Master',
      progress: 85,
      icon: 'Sparkles',
      banner_color: 'from-amber-600 to-orange-600',
      tests_count: 5,
      enrolled_count: 270,
      created_at: new Date().toISOString(),
      lessons: [],
    },
  ] as DBCourse[],

  challenges: [
    {
      day_num: 1,
      day_name: '1-kun',
      task_title: 'Test yechish',
      task_type: 'test',
      xp_reward: 50,
      is_completed: true,
      is_current: false,
    },
    {
      day_num: 2,
      day_name: '2-kun',
      task_title: "Dars ko'rish",
      task_type: 'lesson',
      xp_reward: 50,
      is_completed: true,
      is_current: false,
    },
    {
      day_num: 3,
      day_name: '3-kun',
      task_title: '10 ta savol',
      task_type: 'questions',
      xp_reward: 60,
      is_completed: true,
      is_current: false,
    },
    {
      day_num: 4,
      day_name: '4-kun',
      task_title: 'Mini test',
      task_type: 'minitest',
      xp_reward: 70,
      is_completed: true,
      is_current: false,
    },
    {
      day_num: 5,
      day_name: '5-kun',
      task_title: 'Dars + test',
      task_type: 'test',
      xp_reward: 80,
      is_completed: true,
      is_current: false,
    },
    {
      day_num: 6,
      day_name: '6-kun',
      task_title: 'Qiyin test',
      task_type: 'test',
      xp_reward: 100,
      is_completed: false,
      is_current: true,
    },
    {
      day_num: 7,
      day_name: '7-kun',
      task_title: 'Final test',
      task_type: 'final',
      xp_reward: 150,
      is_completed: false,
      is_current: false,
    },
  ] as DBChallengeDay[],

  tests: [
    {
      id: 'test-1',
      teacher_id: 'teacher-1',
      title: 'Umumiy Intellekt, Dasturlash va Mantiq Testi (20 ta savol)',
      description: "Matematika, mantiq, kompyuter savodxonligi va fanlararo 20 ta saralangan savol",
      duration_minutes: 20,
      max_attempts: 3,
      passing_percentage: 60,
      start_time: null,
      end_time: null,
      shuffle_questions: false,
      shuffle_options: false,
      show_correct_answers_after_test: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'test-2',
      teacher_id: 'teacher-1',
      title: "Algoritmik Murakkablik va Ma'lumotlar Tuzilmasi",
      description: 'Big-O tahlili, saralash algoritmlari va binar qidiruv',
      duration_minutes: 30,
      max_attempts: 1,
      passing_percentage: 70,
      start_time: null,
      end_time: null,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_test: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'test-3',
      teacher_id: 'teacher-1',
      title: 'Kiberxavfsizlik va Tarmoq Asoslari',
      description: 'OSI modeli, TCP/IP, HTTPS shifrlash va xavfsizlik',
      duration_minutes: 25,
      max_attempts: 2,
      passing_percentage: 65,
      start_time: null,
      end_time: null,
      shuffle_questions: true,
      shuffle_options: true,
      show_correct_answers_after_test: false,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ] as DBTest[],

  test_groups: [
    { id: 'tg-1', test_id: 'test-1', group_id: 'group-1' },
    { id: 'tg-1b', test_id: 'test-1', group_id: 'group-2' },
    { id: 'tg-1c', test_id: 'test-1', group_id: 'group-3' },
    { id: 'tg-2', test_id: 'test-2', group_id: 'group-2' },
    { id: 'tg-3', test_id: 'test-3', group_id: 'group-3' },
  ] as DBTestGroup[],

  questions: [
    {
      id: 'q-1',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "O'zbekiston Respublikasining poytaxti qaysi shahar?",
      points: 1,
      explanation: "Toshkent — O'zbekiston Respublikasining poytaxti va Markaziy Osiyodagi eng yirik shahar.",
      order_num: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-2',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Arifmetik ifodani hisoblang: 2 + 2 * 2 nechiga teng?",
      points: 1,
      explanation: "Matematikada ko'paytirish qo'shishdan oldin bajariladi: 2 + (2 * 2) = 2 + 4 = 6.",
      order_num: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-3',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "JavaScript-da o'zgarmas (const) o'zgaruvchi e'lon qilish uchun qaysi kalit so'z ishlatiladi?",
      points: 1,
      explanation: "const kalit so'zi qiymati o'zgarmaydigan identifikator yaratadi.",
      order_num: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-4',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Kompyuter xotirasining eng tezkor turi qaysi?",
      points: 1,
      explanation: "CPU ichidagi kesh xotira (Cache L1/L2/L3) eng yuqori ishlash tezligiga ega.",
      order_num: 4,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-5',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Yer yuzidagi eng katta okean qaysi?",
      points: 1,
      explanation: "Tinch okeani maydoni bo'yicha dunyodagi eng yirik va chuqur okeandir.",
      order_num: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-6',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "JavaScript massivining oxiriga yangi element qo'shuvchi metod qaysi?",
      points: 1,
      explanation: "push() metodi massiv oxiriga yangi element qo'shadi va yangi uzunlikni qaytaradi.",
      order_num: 6,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-7',
      test_id: 'test-1',
      type: 'TRUE_FALSE',
      question_text: "HTML (HyperText Markup Language) mustaqil dasturlash tili hisoblanadi.",
      points: 1,
      explanation: "Noto'g'ri. HTML belgilash (markup) tili bo'lib, mantiqiy algoritmlar yozilmaydi.",
      order_num: 7,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-8',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "1 bayt axborot necha bitdan iborat?",
      points: 1,
      explanation: "1 bayt = 8 bitdan tashkil topadi.",
      order_num: 8,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-9',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Binar qidiruv (Binary Search) algoritmining o'rtacha vaqt murakkabligi nima?",
      points: 1,
      explanation: "Binar qidiruv har qadamda qidiruv sohasini teng ikkiga qisqartiradi: O(log n).",
      order_num: 9,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-10',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "O'zbekiston Respublikasi Mustaqillik kuni qaysi sana?",
      points: 1,
      explanation: "1991-yil 1-sentabr O'zbekiston Respublikasi Mustaqillik kuni hisoblanadi.",
      order_num: 10,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-11',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Quyosh sistemasidagi eng katta sayyora qaysi?",
      points: 1,
      explanation: "Yupiter — Quyosh sistemasidagi eng yirik gaz giganti sayyoradir.",
      order_num: 11,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-12',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "CSS-da elementlarni bir o'qda qulay joylashtirish uchun qaysi texnologiya ishlatiladi?",
      points: 1,
      explanation: "Flexbox (Flexible Box Layout) zamonaviy bir o'lchamli layout tizimidir.",
      order_num: 12,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-13',
      test_id: 'test-1',
      type: 'TRUE_FALSE',
      question_text: "Stack (stak) ma'lumotlar tuzilmasi FIFO (First In First Out) prinsipi asosida ishlaydi.",
      points: 1,
      explanation: "Noto'g'ri. Stack LIFO (Last In First Out) asosida ishlaydi. FIFO bu Queue (navbat).",
      order_num: 13,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-14',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Algoritm chekli qadamlar sonidan so'ng yakunlanishi uning qaysi xossasidir?",
      points: 1,
      explanation: "Diskretlik va cheklilik — algoritm chekli sonli operatsiyalar bilan yakunlanishi kerak.",
      order_num: 14,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-15',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Internetda brauzer va server o'rtasida shifrlangan xavfsiz protokol qaysi?",
      points: 1,
      explanation: "HTTPS (HyperText Transfer Protocol Secure) TLS/SSL orqali xavfsizlikni ta'minlaydi.",
      order_num: 15,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-16',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Tekislikdagi ixtiyoriy uchburchakning ichki burchaklari yig'indisi necha gradus?",
      points: 1,
      explanation: "Evklid geometriyasida ixtiyoriy uchburchakning ichki burchaklari yig'indisi 180° ga teng.",
      order_num: 16,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-17',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Python dasturlash tili muallifi kim?",
      points: 1,
      explanation: "Guido van Rossum 1989-1991 yillarda Python dasturlash tilini yaratgan.",
      order_num: 17,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-18',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "JavaScript-da `typeof NaN` ifodasining natijasi nima bo'ladi?",
      points: 1,
      explanation: "IEEE 754 float standarti bo'yicha NaN (Not-a-Number) son ('number') turiga tegishlidir.",
      order_num: 18,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-19',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Relyatsion ma'lumotlar bazalariga so'rov yuborish uchun qaysi til ishlatiladi?",
      points: 1,
      explanation: "SQL (Structured Query Language) relyatsion ma'lumotlar bazalari bilan ishlash standartidir.",
      order_num: 19,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-20',
      test_id: 'test-1',
      type: 'SINGLE_CHOICE',
      question_text: "Inson organizmidagi maydoni va og'irligi bo'yicha eng katta a'zo qaysi?",
      points: 1,
      explanation: "Teri inson tanasining umumiy maydoni va og'irligi bo'yicha eng katta a'zosi hisoblanadi.",
      order_num: 20,
      created_at: new Date().toISOString(),
    },
  ] as DBQuestion[],

  question_options: [
    // Q1
    { id: 'opt-1-a', question_id: 'q-1', option_letter: 'A', option_text: 'Samarqand', is_correct: false, order_num: 1 },
    { id: 'opt-1-b', question_id: 'q-1', option_letter: 'B', option_text: 'Toshkent', is_correct: true, order_num: 2 },
    { id: 'opt-1-c', question_id: 'q-1', option_letter: 'C', option_text: 'Buxoro', is_correct: false, order_num: 3 },
    { id: 'opt-1-d', question_id: 'q-1', option_letter: 'D', option_text: 'Xiva', is_correct: false, order_num: 4 },
    // Q2
    { id: 'opt-2-a', question_id: 'q-2', option_letter: 'A', option_text: '6', is_correct: true, order_num: 1 },
    { id: 'opt-2-b', question_id: 'q-2', option_letter: 'B', option_text: '8', is_correct: false, order_num: 2 },
    { id: 'opt-2-c', question_id: 'q-2', option_letter: 'C', option_text: '4', is_correct: false, order_num: 3 },
    { id: 'opt-2-d', question_id: 'q-2', option_letter: 'D', option_text: '10', is_correct: false, order_num: 4 },
    // Q3
    { id: 'opt-3-a', question_id: 'q-3', option_letter: 'A', option_text: 'var', is_correct: false, order_num: 1 },
    { id: 'opt-3-b', question_id: 'q-3', option_letter: 'B', option_text: 'let', is_correct: false, order_num: 2 },
    { id: 'opt-3-c', question_id: 'q-3', option_letter: 'C', option_text: 'const', is_correct: true, order_num: 3 },
    { id: 'opt-3-d', question_id: 'q-3', option_letter: 'D', option_text: 'static', is_correct: false, order_num: 4 },
    // Q4
    { id: 'opt-4-a', question_id: 'q-4', option_letter: 'A', option_text: 'HDD', is_correct: false, order_num: 1 },
    { id: 'opt-4-b', question_id: 'q-4', option_letter: 'B', option_text: 'SSD', is_correct: false, order_num: 2 },
    { id: 'opt-4-c', question_id: 'q-4', option_letter: 'C', option_text: 'Kesh xotira (Cache)', is_correct: true, order_num: 3 },
    { id: 'opt-4-d', question_id: 'q-4', option_letter: 'D', option_text: 'Flesh xotira (USB)', is_correct: false, order_num: 4 },
    // Q5
    { id: 'opt-5-a', question_id: 'q-5', option_letter: 'A', option_text: 'Atlantika okeani', is_correct: false, order_num: 1 },
    { id: 'opt-5-b', question_id: 'q-5', option_letter: 'B', option_text: 'Tinch okeani', is_correct: true, order_num: 2 },
    { id: 'opt-5-c', question_id: 'q-5', option_letter: 'C', option_text: 'Hind okeani', is_correct: false, order_num: 3 },
    { id: 'opt-5-d', question_id: 'q-5', option_letter: 'D', option_text: 'Shimoliy Muz okeani', is_correct: false, order_num: 4 },
    // Q6
    { id: 'opt-6-a', question_id: 'q-6', option_letter: 'A', option_text: 'shift()', is_correct: false, order_num: 1 },
    { id: 'opt-6-b', question_id: 'q-6', option_letter: 'B', option_text: 'pop()', is_correct: false, order_num: 2 },
    { id: 'opt-6-c', question_id: 'q-6', option_letter: 'C', option_text: 'push()', is_correct: true, order_num: 3 },
    { id: 'opt-6-d', question_id: 'q-6', option_letter: 'D', option_text: 'unshift()', is_correct: false, order_num: 4 },
    // Q7
    { id: 'opt-7-a', question_id: 'q-7', option_letter: 'A', option_text: "To'g'ri", is_correct: false, order_num: 1 },
    { id: 'opt-7-b', question_id: 'q-7', option_letter: 'B', option_text: "Noto'g'ri", is_correct: true, order_num: 2 },
    // Q8
    { id: 'opt-8-a', question_id: 'q-8', option_letter: 'A', option_text: '4 bit', is_correct: false, order_num: 1 },
    { id: 'opt-8-b', question_id: 'q-8', option_letter: 'B', option_text: '8 bit', is_correct: true, order_num: 2 },
    { id: 'opt-8-c', question_id: 'q-8', option_letter: 'C', option_text: '16 bit', is_correct: false, order_num: 3 },
    { id: 'opt-8-d', question_id: 'q-8', option_letter: 'D', option_text: '32 bit', is_correct: false, order_num: 4 },
    // Q9
    { id: 'opt-9-a', question_id: 'q-9', option_letter: 'A', option_text: 'O(1)', is_correct: false, order_num: 1 },
    { id: 'opt-9-b', question_id: 'q-9', option_letter: 'B', option_text: 'O(n)', is_correct: false, order_num: 2 },
    { id: 'opt-9-c', question_id: 'q-9', option_letter: 'C', option_text: 'O(log n)', is_correct: true, order_num: 3 },
    { id: 'opt-9-d', question_id: 'q-9', option_letter: 'D', option_text: 'O(n^2)', is_correct: false, order_num: 4 },
    // Q10
    { id: 'opt-10-a', question_id: 'q-10', option_letter: 'A', option_text: '1989-yil 21-oktabr', is_correct: false, order_num: 1 },
    { id: 'opt-10-b', question_id: 'q-10', option_letter: 'B', option_text: '1991-yil 1-sentabr', is_correct: true, order_num: 2 },
    { id: 'opt-10-c', question_id: 'q-10', option_letter: 'C', option_text: '1992-yil 8-dekabr', is_correct: false, order_num: 3 },
    { id: 'opt-10-d', question_id: 'q-10', option_letter: 'D', option_text: '1993-yil 2-iyul', is_correct: false, order_num: 4 },
    // Q11
    { id: 'opt-11-a', question_id: 'q-11', option_letter: 'A', option_text: 'Mars', is_correct: false, order_num: 1 },
    { id: 'opt-11-b', question_id: 'q-11', option_letter: 'B', option_text: 'Venera', is_correct: false, order_num: 2 },
    { id: 'opt-11-c', question_id: 'q-11', option_letter: 'C', option_text: 'Yupiter', is_correct: true, order_num: 3 },
    { id: 'opt-11-d', question_id: 'q-11', option_letter: 'D', option_text: 'Saturn', is_correct: false, order_num: 4 },
    // Q12
    { id: 'opt-12-a', question_id: 'q-12', option_letter: 'A', option_text: 'Float va Clear', is_correct: false, order_num: 1 },
    { id: 'opt-12-b', question_id: 'q-12', option_letter: 'B', option_text: 'Flexbox', is_correct: true, order_num: 2 },
    { id: 'opt-12-c', question_id: 'q-12', option_letter: 'C', option_text: 'Table layout', is_correct: false, order_num: 3 },
    { id: 'opt-12-d', question_id: 'q-12', option_letter: 'D', option_text: 'Position static', is_correct: false, order_num: 4 },
    // Q13
    { id: 'opt-13-a', question_id: 'q-13', option_letter: 'A', option_text: "To'g'ri", is_correct: false, order_num: 1 },
    { id: 'opt-13-b', question_id: 'q-13', option_letter: 'B', option_text: "Noto'g'ri", is_correct: true, order_num: 2 },
    // Q14
    { id: 'opt-14-a', question_id: 'q-14', option_letter: 'A', option_text: 'Cheklilik (Diskretlik)', is_correct: true, order_num: 1 },
    { id: 'opt-14-b', question_id: 'q-14', option_letter: 'B', option_text: 'Cheksizlik', is_correct: false, order_num: 2 },
    { id: 'opt-14-c', question_id: 'q-14', option_letter: 'C', option_text: 'Noaniqlik', is_correct: false, order_num: 3 },
    { id: 'opt-14-d', question_id: 'q-14', option_letter: 'D', option_text: 'Murakkablik', is_correct: false, order_num: 4 },
    // Q15
    { id: 'opt-15-a', question_id: 'q-15', option_letter: 'A', option_text: 'HTTP', is_correct: false, order_num: 1 },
    { id: 'opt-15-b', question_id: 'q-15', option_letter: 'B', option_text: 'HTTPS', is_correct: true, order_num: 2 },
    { id: 'opt-15-c', question_id: 'q-15', option_letter: 'C', option_text: 'FTP', is_correct: false, order_num: 3 },
    { id: 'opt-15-d', question_id: 'q-15', option_letter: 'D', option_text: 'Telnet', is_correct: false, order_num: 4 },
    // Q16
    { id: 'opt-16-a', question_id: 'q-16', option_letter: 'A', option_text: '90°', is_correct: false, order_num: 1 },
    { id: 'opt-16-b', question_id: 'q-16', option_letter: 'B', option_text: '180°', is_correct: true, order_num: 2 },
    { id: 'opt-16-c', question_id: 'q-16', option_letter: 'C', option_text: '360°', is_correct: false, order_num: 3 },
    { id: 'opt-16-d', question_id: 'q-16', option_letter: 'D', option_text: '270°', is_correct: false, order_num: 4 },
    // Q17
    { id: 'opt-17-a', question_id: 'q-17', option_letter: 'A', option_text: 'James Gosling', is_correct: false, order_num: 1 },
    { id: 'opt-17-b', question_id: 'q-17', option_letter: 'B', option_text: 'Guido van Rossum', is_correct: true, order_num: 2 },
    { id: 'opt-17-c', question_id: 'q-17', option_letter: 'C', option_text: 'Dennis Ritchie', is_correct: false, order_num: 3 },
    { id: 'opt-17-d', question_id: 'q-17', option_letter: 'D', option_text: 'Bjarne Stroustrup', is_correct: false, order_num: 4 },
    // Q18
    { id: 'opt-18-a', question_id: 'q-18', option_letter: 'A', option_text: "'undefined'", is_correct: false, order_num: 1 },
    { id: 'opt-18-b', question_id: 'q-18', option_letter: 'B', option_text: "'NaN'", is_correct: false, order_num: 2 },
    { id: 'opt-18-c', question_id: 'q-18', option_letter: 'C', option_text: "'number'", is_correct: true, order_num: 3 },
    { id: 'opt-18-d', question_id: 'q-18', option_letter: 'D', option_text: "'object'", is_correct: false, order_num: 4 },
    // Q19
    { id: 'opt-19-a', question_id: 'q-19', option_letter: 'A', option_text: 'HTML', is_correct: false, order_num: 1 },
    { id: 'opt-19-b', question_id: 'q-19', option_letter: 'B', option_text: 'CSS', is_correct: false, order_num: 2 },
    { id: 'opt-19-c', question_id: 'q-19', option_letter: 'C', option_text: 'SQL', is_correct: true, order_num: 3 },
    { id: 'opt-19-d', question_id: 'q-19', option_letter: 'D', option_text: 'JSON', is_correct: false, order_num: 4 },
    // Q20
    { id: 'opt-20-a', question_id: 'q-20', option_letter: 'A', option_text: 'Jigar', is_correct: false, order_num: 1 },
    { id: 'opt-20-b', question_id: 'q-20', option_letter: 'B', option_text: 'Teri', is_correct: true, order_num: 2 },
    { id: 'opt-20-c', question_id: 'q-20', option_letter: 'C', option_text: 'Yurak', is_correct: false, order_num: 3 },
    { id: 'opt-20-d', question_id: 'q-20', option_letter: 'D', option_text: "O'pka", is_correct: false, order_num: 4 },
  ] as DBOption[],

  test_attempts: [] as DBAttempt[],
  answers: [] as DBAnswer[],
  test_results: [] as DBResult[],
  tab_switch_events: [] as DBTabSwitch[],
  telegram_verifications: [] as DBTelegramVerification[],
};

// Initial seed results for demonstration & Ahathanov Muhammadyusuf demo account
const dayMs = 86400000;
const now = Date.now();

// 12 test results for Ahathanov Muhammadyusuf (average: ~87%)
const ahathanovResults = [
  { dayOffset: 5, score: 13, max: 20, pct: 65, test: 'test-1', label: 'Dushanba' },
  { dayOffset: 4, score: 14, max: 20, pct: 72, test: 'test-1', label: 'Seshanba' },
  { dayOffset: 3, score: 16, max: 20, pct: 80, test: 'test-2', label: 'Chorshanba' },
  { dayOffset: 2, score: 15, max: 20, pct: 76, test: 'test-3', label: 'Payshanba' },
  { dayOffset: 1, score: 18, max: 20, pct: 88, test: 'test-1', label: 'Juma' },
  { dayOffset: 0.5, score: 19, max: 20, pct: 95, test: 'test-2', label: 'Shanba' },
  { dayOffset: 0.1, score: 18, max: 20, pct: 90, test: 'test-1', label: 'Bugun' },
  { dayOffset: 8, score: 17, max: 20, pct: 85, test: 'test-1', label: 'O‘tgan hafta' },
  { dayOffset: 10, score: 19, max: 20, pct: 95, test: 'test-2', label: 'O‘tgan hafta' },
  { dayOffset: 14, score: 18, max: 20, pct: 90, test: 'test-3', label: '2 hafta oldin' },
  { dayOffset: 18, score: 20, max: 20, pct: 100, test: 'test-1', label: '3 hafta oldin' },
  { dayOffset: 22, score: 17, max: 20, pct: 85, test: 'test-2', label: '1 oy oldin' },
];

ahathanovResults.forEach((item, idx) => {
  const resultId = `result-ahathanov-${idx + 1}`;
  const attemptId = `attempt-ahathanov-${idx + 1}`;
  const testDate = new Date(now - item.dayOffset * dayMs).toISOString();

  db.test_results.push({
    id: resultId,
    attempt_id: attemptId,
    student_id: 'student-ahathanov',
    test_id: item.test,
    earned_points: item.score,
    max_points: item.max,
    percentage: item.pct,
    passed: item.pct >= 60,
    duration_seconds: 720 + idx * 30,
    tab_switch_count: idx % 3 === 0 ? 1 : 0,
    created_at: testDate,
  });

  db.test_attempts.push({
    id: attemptId,
    test_id: item.test,
    student_id: 'student-ahathanov',
    started_at: new Date(now - item.dayOffset * dayMs - (720 + idx * 30) * 1000).toISOString(),
    server_end_time: testDate,
    submitted_at: testDate,
    status: 'completed',
    score: item.score,
    max_score: item.max,
    percentage: item.pct,
    passed: item.pct >= 60,
    duration_seconds: 720 + idx * 30,
    tab_switch_count: idx % 3 === 0 ? 1 : 0,
  });
});

// Other student seed result
db.test_results.push({
  id: 'result-seed-1',
  attempt_id: 'attempt-seed-1',
  student_id: 'student-2',
  test_id: 'test-1',
  earned_points: 18,
  max_points: 20,
  percentage: 90,
  passed: true,
  duration_seconds: 640,
  tab_switch_count: 0,
  created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
});

db.test_attempts.push({
  id: 'attempt-seed-1',
  test_id: 'test-1',
  student_id: 'student-2',
  started_at: new Date(Date.now() - 3600000 * 5 - 640000).toISOString(),
  server_end_time: new Date(Date.now() - 3600000 * 5).toISOString(),
  submitted_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  status: 'completed',
  score: 18,
  max_score: 20,
  percentage: 90,
  passed: true,
  duration_seconds: 640,
  tab_switch_count: 0,
});

db.answers.push(
  { id: 'ans-1', attempt_id: 'attempt-seed-1', question_id: 'q-1', selected_option_id: 'opt-3', is_correct: true, points_earned: 1 },
  { id: 'ans-2', attempt_id: 'attempt-seed-1', question_id: 'q-2', selected_option_id: 'opt-7', is_correct: true, points_earned: 1 },
  { id: 'ans-3', attempt_id: 'attempt-seed-1', question_id: 'q-3', selected_option_id: 'opt-10', is_correct: true, points_earned: 1 },
  { id: 'ans-4', attempt_id: 'attempt-seed-1', question_id: 'q-4', selected_option_id: 'opt-11', is_correct: false, points_earned: 0 }
);

// Helper: send Telegram notification
async function dispatchTelegramNotification(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId || token === 'your_telegram_bot_token_here') {
    console.log('[Telegram Notification Simulated]:\n' + text);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return response.ok;
  } catch (error) {
    console.warn('[Telegram Dispatch Failed]:', error);
    return false;
  }
}

// ====================================================================
// API ENDPOINTS
// ====================================================================

// 1. System status
app.get('/api/system/status', (req: Request, res: Response) => {
  const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  const hasTelegramToken = Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here'
  );
  const hasTelegramAdmin = Boolean(
    process.env.TELEGRAM_ADMIN_CHAT_ID && process.env.TELEGRAM_ADMIN_CHAT_ID !== 'your_telegram_admin_chat_id_here'
  );

  res.json({
    supabaseConfigured: hasSupabase,
    telegramConfigured: hasTelegramToken && hasTelegramAdmin,
    botTokenPresent: hasTelegramToken,
    adminChatIdPresent: hasTelegramAdmin,
    counts: {
      students: db.profiles.filter((p) => p.role === 'student').length,
      groups: db.groups.length,
      tests: db.tests.length,
      results: db.test_results.length,
    },
  });
});

// 2. Student Request Verification Code (Telegram Auth Flow)
app.post('/api/auth/student-request-code', async (req: Request, res: Response) => {
  const { phone, first_name, last_name, group_id } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqami kiritilishi shart (+998XXXXXXXXX).' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  if (!/^\+998\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: "Telefon raqami formati noto'g'ri. Misol: +998901234567" });
  }

  let student = db.profiles.find((p) => p.phone === cleanPhone);
  if (!student) {
    student = {
      id: `student-${Date.now()}`,
      role: 'student',
      first_name: first_name?.trim() || "O'quvchi",
      last_name: last_name?.trim() || '',
      phone: cleanPhone,
      created_at: new Date().toISOString(),
    };
    db.profiles.push(student);

    const targetGroupId = group_id || 'group-1';
    db.group_members.push({
      id: `gm-${Date.now()}`,
      group_id: targetGroupId,
      student_id: student.id,
      joined_at: new Date().toISOString(),
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000;

  db.telegram_verifications.forEach((v) => {
    if (v.phone === cleanPhone) v.is_used = true;
  });

  db.telegram_verifications.push({
    id: `ver-${Date.now()}`,
    phone: cleanPhone,
    code_hash: codeHash,
    code_plain: code,
    expires_at: expiresAt,
    is_used: false,
    created_at: new Date().toISOString(),
  });

  const hasTelegramToken = Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here'
  );

  if (hasTelegramToken) {
    await dispatchTelegramNotification(
      `🔑 <b>KIRISH KODI</b>\n\n👤 Talaba: ${student.first_name} ${student.last_name}\n📱 Tel: ${cleanPhone}\n🔢 Kod: <code>${code}</code>\n⏳ Amal qilish muddati: 5 daqiqa`
    );
  }

  return res.json({
    success: true,
    message: hasTelegramToken
      ? 'Bir martalik kod Telegram botingizga yuborildi.'
      : "Kod yaratildi. Telegram bot ulanmaganligi sababli kod quyida ko'rsatilmoqda (Sinov rejimi).",
    demoCode: code,
    expiresAt,
    telegramConfigured: hasTelegramToken,
  });
});

// 3. Student Verify Code
app.post('/api/auth/student-verify-code', (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Telefon va bir martalik kod talab qilinadi.' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const verification = db.telegram_verifications.find(
    (v) => v.phone === cleanPhone && !v.is_used && v.expires_at > Date.now()
  );

  if (!verification) {
    return res.status(400).json({ error: "Kod muddati tugagan yoki noto'g'ri. Yangi kod so'rang." });
  }

  const inputHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
  if (verification.code_hash !== inputHash && verification.code_plain !== code.trim()) {
    return res.status(400).json({ error: "Kiritilgan tasdiqlash kodi noto'g'ri." });
  }

  verification.is_used = true;

  const student = db.profiles.find((p) => p.phone === cleanPhone);
  if (!student) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
  }

  const member = db.group_members.find((gm) => gm.student_id === student.id);
  const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;

  const token = `student_sess_${student.id}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user: {
      ...student,
      group_id: group?.id,
      group_name: group?.name || 'Guruh biriktirilmagan',
    },
  });
});

// 3.5. Student Fast Entry (Frictionless entry: Ism, Familiya, Telefon)
app.post('/api/auth/student-direct-login', (req: Request, res: Response) => {
  const { first_name, last_name, phone } = req.body;

  if (!first_name || !first_name.trim()) {
    return res.status(400).json({ error: 'Ismingizni kiriting.' });
  }

  const cleanPhone = (phone || '').trim().replace(/\s+/g, '');
  if (!cleanPhone || !/^\+998\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: "Telefon raqami formati noto'g'ri. Misol: +998901234567" });
  }

  let student = db.profiles.find((p) => p.phone === cleanPhone);
  if (!student) {
    student = {
      id: `student-${Date.now()}`,
      role: 'student',
      first_name: first_name.trim(),
      last_name: (last_name || '').trim(),
      phone: cleanPhone,
      created_at: new Date().toISOString(),
    };
    db.profiles.push(student);

    db.groups.forEach((g) => {
      db.group_members.push({
        id: `gm-${Date.now()}-${g.id}`,
        group_id: g.id,
        student_id: student!.id,
        joined_at: new Date().toISOString(),
      });
    });
  } else {
    if (first_name) student.first_name = first_name.trim();
    if (last_name) student.last_name = last_name.trim();
    db.groups.forEach((g) => {
      if (!db.group_members.some((gm) => gm.group_id === g.id && gm.student_id === student!.id)) {
        db.group_members.push({
          id: `gm-${Date.now()}-${g.id}`,
          group_id: g.id,
          student_id: student!.id,
          joined_at: new Date().toISOString(),
        });
      }
    });
  }

  const token = `student_sess_${student.id}_${Date.now()}`;
  const member = db.group_members.find((gm) => gm.student_id === student!.id);
  const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;

  res.json({
    success: true,
    token,
    user: {
      ...student,
      group_id: group?.id,
      group_name: group?.name || 'Umumiy Guruh',
    },
  });
});

// 4. Teacher Login
app.post('/api/auth/teacher-login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password && password.trim() !== '123456') {
    return res.status(401).json({ error: "O'qituvchi paroli noto'g'ri (Standart: 123456)" });
  }
  const teacher = db.profiles.find((p) => p.role === 'teacher') || db.profiles[0];
  const token = `teacher_sess_${teacher.id}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user: teacher,
  });
});

// 4.1. Admin Login
app.post('/api/auth/admin-login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password && password.trim() !== 'admin123') {
    return res.status(401).json({ error: "Admin paroli noto'g'ri (Standart: admin123)" });
  }
  const admin = db.profiles.find((p) => p.role === 'admin') || {
    id: 'admin-1',
    role: 'admin' as const,
    first_name: 'Super',
    last_name: 'Admin',
    phone: '+998990000001',
    created_at: new Date().toISOString(),
  };
  const token = `admin_sess_${admin.id}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user: admin,
  });
});

// 4.2. 1-Click Fast Demo Login for instant testing
app.post('/api/auth/demo-login', (req: Request, res: Response) => {
  const { role } = req.body; // 'student' | 'teacher' | 'admin'

  if (role === 'admin') {
    const admin = db.profiles.find((p) => p.role === 'admin') || db.profiles[0];
    const token = `admin_sess_${admin.id}_${Date.now()}`;
    return res.json({ success: true, token, user: admin });
  }

  if (role === 'teacher') {
    const teacher = db.profiles.find((p) => p.role === 'teacher') || db.profiles[1];
    const token = `teacher_sess_${teacher.id}_${Date.now()}`;
    return res.json({ success: true, token, user: teacher });
  }

  // Student demo: Ahathanov Muhammadyusuf
  const student = db.profiles.find((p) => p.id === 'student-ahathanov') || db.profiles.find((p) => p.role === 'student');
  if (!student) return res.status(404).json({ error: 'Talaba profili topilmadi' });

  const member = db.group_members.find((gm) => gm.student_id === student.id);
  const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;
  const token = `student_sess_${student.id}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user: {
      ...student,
      group_id: group?.id || 'group-it-01',
      group_name: group?.name || 'IT-01',
    },
  });
});

// 5. Auth Me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan" });
  }

  const token = authHeader.replace('Bearer ', '');
  if (token.startsWith('admin_sess')) {
    const admin = db.profiles.find((p) => p.role === 'admin') || {
      id: 'admin-1',
      role: 'admin' as const,
      first_name: 'Super',
      last_name: 'Admin',
      phone: '+998990000001',
      created_at: new Date().toISOString(),
    };
    return res.json({ user: admin });
  }

  if (token.startsWith('teacher_sess')) {
    const teacher = db.profiles.find((p) => p.role === 'teacher') || db.profiles[1];
    return res.json({ user: teacher });
  }

  if (token.startsWith('student_sess')) {
    const parts = token.split('_');
    const studentId = parts[2];
    const student = db.profiles.find((p) => p.id === studentId);
    if (!student) return res.status(404).json({ error: 'Talaba topilmadi' });

    const member = db.group_members.find((gm) => gm.student_id === student.id);
    const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;

    return res.json({
      user: {
        ...student,
        group_id: group?.id,
        group_name: group?.name || 'IT-01',
      },
    });
  }

  res.status(401).json({ error: 'Yaroqsiz sessiya' });
});

// 6. GROUPS CRUD
app.get('/api/groups', (req: Request, res: Response) => {
  const groupsWithCount = db.groups.map((g) => {
    const count = db.group_members.filter((gm) => gm.group_id === g.id).length;
    return { ...g, student_count: count };
  });
  res.json(groupsWithCount);
});

app.post('/api/groups', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Guruh nomi kiritilishi shart' });

  const newGroup: DBGroup = {
    id: `group-${Date.now()}`,
    teacher_id: 'teacher-1',
    name: name.trim(),
    description: description?.trim() || '',
    created_at: new Date().toISOString(),
  };

  db.groups.push(newGroup);
  res.status(201).json({ ...newGroup, student_count: 0 });
});

app.put('/api/groups/:id', (req: Request, res: Response) => {
  const group = db.groups.find((g) => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Guruh topilmadi' });

  if (req.body.name) group.name = req.body.name.trim();
  if (req.body.description !== undefined) group.description = req.body.description.trim();

  const count = db.group_members.filter((gm) => gm.group_id === group.id).length;
  res.json({ ...group, student_count: count });
});

app.delete('/api/groups/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = db.groups.findIndex((g) => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Guruh topilmadi' });

  db.groups.splice(idx, 1);
  db.group_members = db.group_members.filter((gm) => gm.group_id !== id);
  db.test_groups = db.test_groups.filter((tg) => tg.group_id !== id);

  res.json({ success: true, message: "Guruh o'chirildi" });
});

// Group Members
app.get('/api/groups/:id/members', (req: Request, res: Response) => {
  const groupMembers = db.group_members.filter((gm) => gm.group_id === req.params.id);
  const students = groupMembers
    .map((gm) => {
      const profile = db.profiles.find((p) => p.id === gm.student_id);
      return profile ? { ...profile, joined_at: gm.joined_at } : null;
    })
    .filter(Boolean);
  res.json(students);
});

app.post('/api/groups/:id/members', (req: Request, res: Response) => {
  const groupId = req.params.id;
  const { first_name, last_name, phone, student_id } = req.body;

  let student: DBProfile | undefined;

  if (student_id) {
    student = db.profiles.find((p) => p.id === student_id);
  } else if (phone) {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    student = db.profiles.find((p) => p.phone === cleanPhone);
    if (!student) {
      student = {
        id: `student-${Date.now()}`,
        role: 'student',
        first_name: first_name?.trim() || "O'quvchi",
        last_name: last_name?.trim() || '',
        phone: cleanPhone,
        created_at: new Date().toISOString(),
      };
      db.profiles.push(student);
    }
  }

  if (!student) {
    return res.status(400).json({ error: "O'quvchi ma'lumotlari to'liq emas" });
  }

  const existing = db.group_members.find((gm) => gm.group_id === groupId && gm.student_id === student!.id);
  if (!existing) {
    db.group_members.push({
      id: `gm-${Date.now()}`,
      group_id: groupId,
      student_id: student.id,
      joined_at: new Date().toISOString(),
    });
  }

  res.json({ success: true, student });
});

app.delete('/api/groups/:id/members/:studentId', (req: Request, res: Response) => {
  const { id: groupId, studentId } = req.params;
  const initialLen = db.group_members.length;
  db.group_members = db.group_members.filter((gm) => !(gm.group_id === groupId && gm.student_id === studentId));

  if (db.group_members.length === initialLen) {
    return res.status(404).json({ error: "O'quvchi guruhda topilmadi" });
  }
  res.json({ success: true, message: "O'quvchi guruhdan chiqarildi" });
});

// 7. TESTS CRUD (Teacher)
app.get('/api/tests', (req: Request, res: Response) => {
  const testsWithDetails = db.tests.map((t) => {
    const assignedGroupIds = db.test_groups.filter((tg) => tg.test_id === t.id).map((tg) => tg.group_id);
    const assignedGroups = db.groups.filter((g) => assignedGroupIds.includes(g.id));
    const questionCount = db.questions.filter((q) => q.test_id === t.id).length;

    return {
      ...t,
      group_ids: assignedGroupIds,
      groups: assignedGroups,
      question_count: questionCount,
    };
  });
  res.json(testsWithDetails);
});

app.post('/api/tests', (req: Request, res: Response) => {
  const {
    title,
    description,
    duration_minutes,
    max_attempts,
    passing_percentage,
    start_time,
    end_time,
    group_ids,
    shuffle_questions,
    shuffle_options,
    show_correct_answers_after_test,
    is_active,
  } = req.body;

  if (!title) return res.status(400).json({ error: 'Test nomi kiritilishi shart' });

  const newTest: DBTest = {
    id: `test-${Date.now()}`,
    teacher_id: 'teacher-1',
    title: title.trim(),
    description: description?.trim() || '',
    duration_minutes: Number(duration_minutes) || 30,
    max_attempts: Number(max_attempts) || 1,
    passing_percentage: Number(passing_percentage) || 60,
    start_time: start_time || null,
    end_time: end_time || null,
    shuffle_questions: shuffle_questions !== false,
    shuffle_options: shuffle_options !== false,
    show_correct_answers_after_test: show_correct_answers_after_test !== false,
    is_active: is_active !== false,
    created_at: new Date().toISOString(),
  };

  db.tests.push(newTest);

  if (Array.isArray(group_ids)) {
    group_ids.forEach((gid) => {
      db.test_groups.push({
        id: `tg-${Date.now()}-${Math.random()}`,
        test_id: newTest.id,
        group_id: gid,
      });
    });
  }

  res.status(201).json(newTest);
});

app.put('/api/tests/:id', (req: Request, res: Response) => {
  const test = db.tests.find((t) => t.id === req.params.id);
  if (!test) return res.status(404).json({ error: 'Test topilmadi' });

  const fields = [
    'title',
    'description',
    'duration_minutes',
    'max_attempts',
    'passing_percentage',
    'start_time',
    'end_time',
    'shuffle_questions',
    'shuffle_options',
    'show_correct_answers_after_test',
    'is_active',
  ];

  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      (test as any)[f] = req.body[f];
    }
  });

  if (Array.isArray(req.body.group_ids)) {
    db.test_groups = db.test_groups.filter((tg) => tg.test_id !== test.id);
    req.body.group_ids.forEach((gid: string) => {
      db.test_groups.push({
        id: `tg-${Date.now()}-${Math.random()}`,
        test_id: test.id,
        group_id: gid,
      });
    });
  }

  res.json(test);
});

app.delete('/api/tests/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = db.tests.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Test topilmadi' });

  db.tests.splice(idx, 1);
  db.test_groups = db.test_groups.filter((tg) => tg.test_id !== id);
  const qIds = db.questions.filter((q) => q.test_id === id).map((q) => q.id);
  db.questions = db.questions.filter((q) => q.test_id !== id);
  db.question_options = db.question_options.filter((opt) => !qIds.includes(opt.question_id));

  res.json({ success: true, message: "Test o'chirildi" });
});

// 8. QUESTIONS MANAGEMENT (Teacher)
app.get('/api/tests/:id/questions', (req: Request, res: Response) => {
  const testId = req.params.id;
  const questions = db.questions.filter((q) => q.test_id === testId);
  const questionsWithOptions = questions.map((q) => {
    const options = db.question_options
      .filter((opt) => opt.question_id === q.id)
      .sort((a, b) => a.order_num - b.order_num);
    return {
      ...q,
      options,
    };
  });
  res.json(questionsWithOptions);
});

app.post('/api/tests/:id/questions', (req: Request, res: Response) => {
  const testId = req.params.id;
  const { type, question_text, points, explanation, options } = req.body;

  if (!question_text) return res.status(400).json({ error: 'Savol matni kiritilishi shart' });
  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "Kamida 2 ta variant bo'lishi kerak" });
  }

  const qId = `q-${Date.now()}`;
  const newQuestion: DBQuestion = {
    id: qId,
    test_id: testId,
    type: type || 'SINGLE_CHOICE',
    question_text: question_text.trim(),
    points: Number(points) || 1,
    explanation: explanation?.trim() || '',
    order_num: db.questions.filter((q) => q.test_id === testId).length + 1,
    created_at: new Date().toISOString(),
  };

  db.questions.push(newQuestion);

  const savedOptions = options.map((opt: any, idx: number) => {
    const newOpt: DBOption = {
      id: `opt-${Date.now()}-${idx}`,
      question_id: qId,
      option_letter: opt.option_letter || String.fromCharCode(65 + idx),
      option_text: opt.option_text.trim(),
      is_correct: Boolean(opt.is_correct),
      order_num: idx + 1,
    };
    db.question_options.push(newOpt);
    return newOpt;
  });

  res.status(201).json({ ...newQuestion, options: savedOptions });
});

app.put('/api/tests/:testId/questions/:questionId', (req: Request, res: Response) => {
  const { questionId } = req.params;
  const question = db.questions.find((q) => q.id === questionId);
  if (!question) return res.status(404).json({ error: 'Savol topilmadi' });

  if (req.body.question_text) question.question_text = req.body.question_text.trim();
  if (req.body.points) question.points = Number(req.body.points);
  if (req.body.explanation !== undefined) question.explanation = req.body.explanation.trim();
  if (req.body.type) question.type = req.body.type;

  if (Array.isArray(req.body.options)) {
    db.question_options = db.question_options.filter((opt) => opt.question_id !== questionId);
    req.body.options.forEach((opt: any, idx: number) => {
      db.question_options.push({
        id: opt.id || `opt-${Date.now()}-${idx}`,
        question_id: questionId,
        option_letter: opt.option_letter || String.fromCharCode(65 + idx),
        option_text: opt.option_text,
        is_correct: Boolean(opt.is_correct),
        order_num: idx + 1,
      });
    });
  }

  const updatedOptions = db.question_options.filter((opt) => opt.question_id === questionId);
  res.json({ ...question, options: updatedOptions });
});

app.delete('/api/tests/:testId/questions/:questionId', (req: Request, res: Response) => {
  const { questionId } = req.params;
  const idx = db.questions.findIndex((q) => q.id === questionId);
  if (idx === -1) return res.status(404).json({ error: 'Savol topilmadi' });

  db.questions.splice(idx, 1);
  db.question_options = db.question_options.filter((opt) => opt.question_id !== questionId);

  res.json({ success: true, message: "Savol o'chirildi" });
});

// Batch Import from DOCX Preview
app.post('/api/tests/:id/import-questions', (req: Request, res: Response) => {
  const testId = req.params.id;
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Hech qanday savol yuborilmadi' });
  }

  const importedList: any[] = [];

  questions.forEach((qItem: any, qIdx: number) => {
    const qId = `q-imp-${Date.now()}-${qIdx}`;
    const newQuestion: DBQuestion = {
      id: qId,
      test_id: testId,
      type: qItem.type || 'SINGLE_CHOICE',
      question_text: qItem.questionText || qItem.question_text,
      points: Number(qItem.points) || 1,
      explanation: qItem.explanation || '',
      order_num: db.questions.filter((q) => q.test_id === testId).length + 1,
      created_at: new Date().toISOString(),
    };
    db.questions.push(newQuestion);

    const savedOpts = (qItem.options || []).map((opt: any, optIdx: number) => {
      const optRecord: DBOption = {
        id: `opt-imp-${Date.now()}-${qIdx}-${optIdx}`,
        question_id: qId,
        option_letter: opt.letter || opt.option_letter || String.fromCharCode(65 + optIdx),
        option_text: opt.text || opt.option_text,
        is_correct: Boolean(opt.isCorrect !== undefined ? opt.isCorrect : opt.is_correct),
        order_num: optIdx + 1,
      };
      db.question_options.push(optRecord);
      return optRecord;
    });

    importedList.push({ ...newQuestion, options: savedOpts });
  });

  res.json({
    success: true,
    count: importedList.length,
    message: `${importedList.length} ta savol muvaffaqiyatli testga qo'shildi.`,
    questions: importedList,
  });
});

// 9. STUDENT TEST ENGINE (Security: Correct answers stripped!)
app.get('/api/student/tests', (req: Request, res: Response) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ error: 'studentId kerak' });

  const memberRecords = db.group_members.filter((gm) => gm.student_id === studentId);
  const groupIds = memberRecords.map((m) => m.group_id);

  const testIdsForGroups = db.test_groups.filter((tg) => groupIds.includes(tg.group_id)).map((tg) => tg.test_id);

  const now = Date.now();

  const availableTests = db.tests
    .filter((t) => t.is_active && testIdsForGroups.includes(t.id))
    .map((t) => {
      const attempts = db.test_attempts.filter((a) => a.test_id === t.id && a.student_id === studentId);
      const completedAttempts = attempts.filter((a) => a.status === 'completed');
      const activeAttempt = attempts.find((a) => a.status === 'in_progress');
      const lastResult = db.test_results
        .filter((r) => r.test_id === t.id && r.student_id === studentId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const questionCount = db.questions.filter((q) => q.test_id === t.id).length;

      // Check dates if set
      let dateAllowed = true;
      if (t.start_time && new Date(t.start_time).getTime() > now) dateAllowed = false;
      if (t.end_time && new Date(t.end_time).getTime() < now) dateAllowed = false;

      return {
        ...t,
        question_count: questionCount,
        attempts_used: completedAttempts.length,
        can_attempt: (completedAttempts.length < t.max_attempts && dateAllowed) || Boolean(activeAttempt),
        active_attempt_id: activeAttempt?.id || null,
        last_score: lastResult ? lastResult.earned_points : null,
        last_percentage: lastResult ? lastResult.percentage : null,
        is_date_expired: t.end_time ? new Date(t.end_time).getTime() < now : false,
      };
    });

  res.json(availableTests);
});

// Start Test Attempt
app.post('/api/student/tests/:id/start', (req: Request, res: Response) => {
  const testId = req.params.id;
  const { studentId } = req.body;

  const test = db.tests.find((t) => t.id === testId && t.is_active);
  if (!test) return res.status(404).json({ error: 'Test topilmadi yoki faol emas' });

  const now = Date.now();
  if (test.start_time && new Date(test.start_time).getTime() > now) {
    return res.status(400).json({ error: "Ushbu test hali ochilmagan." });
  }
  if (test.end_time && new Date(test.end_time).getTime() < now) {
    return res.status(400).json({ error: "Ushbu testning topshirish muddati yakunlangan." });
  }

  let attempt = db.test_attempts.find(
    (a) => a.test_id === testId && a.student_id === studentId && a.status === 'in_progress'
  );

  const durationMs = test.duration_minutes * 60 * 1000;

  if (attempt) {
    const serverEnd = new Date(attempt.server_end_time).getTime();
    if (now > serverEnd) {
      attempt.status = 'expired';
      attempt = undefined;
    }
  }

  if (!attempt) {
    const completedCount = db.test_attempts.filter(
      (a) => a.test_id === testId && a.student_id === studentId && a.status === 'completed'
    ).length;

    if (completedCount >= test.max_attempts) {
      return res.status(403).json({ error: 'Ushbu test uchun barcha urinishlaringiz tugagan.' });
    }

    const serverEndTime = new Date(now + durationMs).toISOString();
    attempt = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      test_id: testId,
      student_id: studentId,
      started_at: new Date(now).toISOString(),
      server_end_time: serverEndTime,
      status: 'in_progress',
      score: 0,
      max_score: 0,
      percentage: 0,
      passed: false,
      duration_seconds: 0,
      tab_switch_count: 0,
    };
    db.test_attempts.push(attempt);
  }

  // Load existing answers for this attempt if student is resuming
  const currentAnswers: Record<string, string> = {};
  db.answers
    .filter((a) => a.attempt_id === attempt!.id && a.selected_option_id)
    .forEach((a) => {
      currentAnswers[a.question_id] = a.selected_option_id!;
    });

  // CRITICAL SECURITY: Fetch questions and STRIP is_correct and explanation!
  const questions = db.questions.filter((q) => q.test_id === testId);
  const sanitizedQuestions = questions.map((q) => {
    let options = db.question_options
      .filter((opt) => opt.question_id === q.id)
      .map((opt) => ({
        id: opt.id,
        question_id: opt.question_id,
        option_letter: opt.option_letter,
        option_text: opt.option_text,
        order_num: opt.order_num,
      }));

    if (test.shuffle_options) {
      options = options.sort(() => Math.random() - 0.5);
    } else {
      options = options.sort((a, b) => a.order_num - b.order_num);
    }

    return {
      id: q.id,
      test_id: q.test_id,
      type: q.type,
      question_text: q.question_text,
      points: q.points,
      order_num: q.order_num,
      options,
    };
  });

  const finalQuestions = test.shuffle_questions
    ? sanitizedQuestions.sort(() => Math.random() - 0.5)
    : sanitizedQuestions.sort((a, b) => a.order_num - b.order_num);

  res.json({
    attempt: {
      id: attempt.id,
      started_at: attempt.started_at,
      server_end_time: attempt.server_end_time,
      duration_minutes: test.duration_minutes,
      server_current_time: new Date().toISOString(),
    },
    savedAnswers: currentAnswers,
    questions: finalQuestions,
  });
});

// Periodic or Reconnection Sync of Answers (prevents loss on sudden refresh/disconnect)
app.post('/api/student/tests/:id/sync-answers', (req: Request, res: Response) => {
  const { attemptId, answers } = req.body;

  if (!attemptId || !answers || typeof answers !== 'object') {
    return res.status(400).json({ error: "Yaroqsiz ma'lumotlar" });
  }

  const attempt = db.test_attempts.find((a) => a.id === attemptId && a.status === 'in_progress');
  if (!attempt) {
    return res.status(404).json({ error: 'Faol urinish topilmadi' });
  }

  // Update or insert answers in database store
  Object.entries(answers).forEach(([qId, optId]) => {
    const existing = db.answers.find((a) => a.attempt_id === attemptId && a.question_id === qId);
    if (existing) {
      existing.selected_option_id = String(optId);
    } else {
      db.answers.push({
        id: `ans-sync-${Date.now()}-${Math.random()}`,
        attempt_id: attemptId,
        question_id: qId,
        selected_option_id: String(optId),
        is_correct: false,
        points_earned: 0,
      });
    }
  });

  res.json({ success: true, count: Object.keys(answers).length });
});

// Tab Switch event logger
app.post('/api/student/tests/:id/tab-switch', (req: Request, res: Response) => {
  const { attemptId, studentId, timestamp } = req.body;

  const event: DBTabSwitch = {
    id: `ts-${Date.now()}-${Math.random()}`,
    attempt_id: attemptId,
    student_id: studentId,
    timestamp: timestamp || new Date().toISOString(),
  };

  db.tab_switch_events.push(event);

  const attempt = db.test_attempts.find((a) => a.id === attemptId);
  if (attempt) {
    attempt.tab_switch_count = (attempt.tab_switch_count || 0) + 1;
  }

  res.json({ success: true, count: attempt?.tab_switch_count || 1 });
});

// SUBMIT TEST (SERVER-SIDE GRADING ENGINE)
app.post('/api/student/tests/:id/submit', async (req: Request, res: Response) => {
  const testId = req.params.id;
  const { attemptId, studentId, answers } = req.body;

  const test = db.tests.find((t) => t.id === testId);
  if (!test) return res.status(404).json({ error: 'Test topilmadi' });

  const attempt = db.test_attempts.find((a) => a.id === attemptId);
  if (!attempt) return res.status(404).json({ error: 'Urinish topilmadi' });

  if (attempt.status === 'completed') {
    const existingResult = db.test_results.find((r) => r.attempt_id === attemptId);
    if (existingResult) return res.json(existingResult);
  }

  const questions = db.questions.filter((q) => q.test_id === testId);
  let totalPoints = 0;
  let maxPoints = 0;

  const reviews: any[] = [];

  // Clear any incomplete sync answers for this attempt before final scoring
  db.answers = db.answers.filter((a) => a.attempt_id !== attemptId);

  questions.forEach((q) => {
    maxPoints += q.points;
    const selectedOptionId = answers ? answers[q.id] : undefined;
    const correctOption = db.question_options.find((opt) => opt.question_id === q.id && opt.is_correct);
    const isCorrect = Boolean(selectedOptionId && correctOption && selectedOptionId === correctOption.id);
    const pointsEarned = isCorrect ? q.points : 0;

    totalPoints += pointsEarned;

    db.answers.push({
      id: `ans-${Date.now()}-${Math.random()}`,
      attempt_id: attemptId,
      question_id: q.id,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      points_earned: pointsEarned,
    });

    if (test.show_correct_answers_after_test) {
      const qOptions = db.question_options.filter((opt) => opt.question_id === q.id);
      reviews.push({
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        points: q.points,
        explanation: q.explanation,
        selected_option_id: selectedOptionId,
        correct_option_id: correctOption?.id,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        options: qOptions.map((opt) => ({
          id: opt.id,
          option_letter: opt.option_letter,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
        })),
      });
    }
  });

  const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100 * 100) / 100 : 0;
  const passed = percentage >= test.passing_percentage;

  const startTime = new Date(attempt.started_at).getTime();
  const endTime = Date.now();
  const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));

  const tabSwitchCount = db.tab_switch_events.filter((ts) => ts.attempt_id === attemptId).length;

  attempt.status = 'completed';
  attempt.submitted_at = new Date().toISOString();
  attempt.score = totalPoints;
  attempt.max_score = maxPoints;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.duration_seconds = durationSeconds;
  attempt.tab_switch_count = tabSwitchCount;

  const result: DBResult = {
    id: `res-${Date.now()}`,
    attempt_id: attemptId,
    student_id: studentId,
    test_id: testId,
    earned_points: totalPoints,
    max_points: maxPoints,
    percentage,
    passed,
    duration_seconds: durationSeconds,
    tab_switch_count: tabSwitchCount,
    created_at: new Date().toISOString(),
  };

  db.test_results.push(result);

  const studentProfile = db.profiles.find((p) => p.id === studentId);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const durationText = `${minutes} daqiqa ${seconds} soniya`;

  const notificationMessage = `📚 <b>TEST YAKUNLANDI</b>\n\n👤 <b>O'quvchi:</b> ${studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name} (${studentProfile.phone})` : "Noma'lum"}\n📝 <b>Test:</b> ${test.title}\n🎯 <b>Ball:</b> ${totalPoints} / ${maxPoints}\n📊 <b>Foiz:</b> ${percentage}%\n✅ <b>Holat:</b> ${passed ? "O'TDI 🎉" : "O'TMADI ❌"}\n⏱ <b>Vaqt:</b> ${durationText}\n👁 <b>Oynadan chiqishlar:</b> ${tabSwitchCount} marta`;

  await dispatchTelegramNotification(notificationMessage);

  res.json({
    ...result,
    test_title: test.title,
    student_name: studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}` : "O'quvchi",
    student_phone: studentProfile?.phone,
    reviews: test.show_correct_answers_after_test ? reviews : undefined,
  });
});

// 10. TEACHER RESULTS & ANALYTICS
app.get('/api/teacher/results', (req: Request, res: Response) => {
  const { groupId, testId, search, date } = req.query;

  let results = db.test_results.map((r) => {
    const student = db.profiles.find((p) => p.id === r.student_id);
    const test = db.tests.find((t) => t.id === r.test_id);
    const member = db.group_members.find((gm) => gm.student_id === r.student_id);
    const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;

    return {
      ...r,
      test_title: test?.title || "O'chirilgan test",
      student_name: student ? `${student.first_name} ${student.last_name}` : "Noma'lum",
      student_phone: student?.phone || '',
      group_id: group?.id,
      group_name: group?.name || 'Guruhsiz',
    };
  });

  if (groupId) {
    results = results.filter((r) => r.group_id === groupId);
  }
  if (testId) {
    results = results.filter((r) => r.test_id === testId);
  }
  if (search) {
    const s = String(search).toLowerCase();
    results = results.filter(
      (r) =>
        r.student_name.toLowerCase().includes(s) ||
        r.student_phone.includes(s) ||
        r.test_title.toLowerCase().includes(s)
    );
  }
  if (date) {
    results = results.filter((r) => r.created_at.startsWith(String(date)));
  }

  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json(results);
});

// Reset Attempt (Teacher permission for retake)
app.delete('/api/teacher/results/:id/retake', (req: Request, res: Response) => {
  const resultId = req.params.id;
  const resultIndex = db.test_results.findIndex((r) => r.id === resultId);

  if (resultIndex === -1) {
    return res.status(404).json({ error: 'Natija topilmadi' });
  }

  const result = db.test_results[resultIndex];
  const attemptId = result.attempt_id;

  db.test_results.splice(resultIndex, 1);

  const attemptIndex = db.test_attempts.findIndex((a) => a.id === attemptId);
  if (attemptIndex !== -1) {
    db.test_attempts.splice(attemptIndex, 1);
  }

  db.answers = db.answers.filter((a) => a.attempt_id !== attemptId);
  db.tab_switch_events = db.tab_switch_events.filter((ts) => ts.attempt_id !== attemptId);

  res.json({
    success: true,
    message: "Natija o'chirildi va o'quvchiga yangi urinish berildi.",
  });
});

// Unattempted Students
app.get('/api/teacher/analytics/unattempted', (req: Request, res: Response) => {
  const { testId } = req.query;
  if (!testId) return res.status(400).json({ error: 'testId talab qilinadi' });

  const assignedGroupIds = db.test_groups.filter((tg) => tg.test_id === testId).map((tg) => tg.group_id);
  const members = db.group_members.filter((gm) => assignedGroupIds.includes(gm.group_id));

  const completedStudentIds = db.test_attempts
    .filter((a) => a.test_id === testId && (a.status === 'completed' || a.status === 'in_progress'))
    .map((a) => a.student_id);

  const unattemptedList = members
    .filter((gm) => !completedStudentIds.includes(gm.student_id))
    .map((gm) => {
      const student = db.profiles.find((p) => p.id === gm.student_id);
      const group = db.groups.find((g) => g.id === gm.group_id);
      return {
        id: student?.id,
        first_name: student?.first_name || '',
        last_name: student?.last_name || '',
        phone: student?.phone || '',
        group_name: group?.name || '',
      };
    })
    .filter((s) => Boolean(s.id));

  res.json(unattemptedList);
});

// Question Analytics
app.get('/api/teacher/analytics/questions', (req: Request, res: Response) => {
  const { testId } = req.query;
  if (!testId) return res.status(400).json({ error: 'testId talab qilinadi' });

  const questions = db.questions.filter((q) => q.test_id === testId);

  const analytics = questions.map((q) => {
    const qAnswers = db.answers.filter((a) => a.question_id === q.id);
    const total = qAnswers.length;
    const correct = qAnswers.filter((a) => a.is_correct).length;
    const incorrect = total - correct;
    const correctPercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const incorrectPercentage = total > 0 ? 100 - correctPercentage : 0;

    let difficulty: 'Qiyin' | "O'rtacha" | 'Oson' = "O'rtacha";
    if (total > 0) {
      if (correctPercentage < 50) difficulty = 'Qiyin';
      else if (correctPercentage > 80) difficulty = 'Oson';
    }

    return {
      question_id: q.id,
      question_text: q.question_text,
      order_num: q.order_num,
      type: q.type,
      total_answers: total,
      correct_answers: correct,
      incorrect_answers: incorrect,
      correct_percentage: correctPercentage,
      incorrect_percentage: incorrectPercentage,
      difficulty,
    };
  });

  res.json(analytics);
});

// ====================================================================
// COURSES API (ILMHUB Ta'lim tizimi)
// ====================================================================
app.get('/api/courses', (req: Request, res: Response) => {
  res.json(db.courses);
});

app.post('/api/courses', (req: Request, res: Response) => {
  const { title, category, description, duration_hours, level } = req.body;
  if (!title) return res.status(400).json({ error: 'Kurs nomi talab qilinadi' });

  const newCourse: DBCourse = {
    id: `course-${Date.now()}`,
    title: title.trim(),
    category: category || 'Umumiy',
    description: description || '',
    teacher_name: 'Sardor Rahimov',
    lessons_count: 0,
    duration_hours: Number(duration_hours) || 10,
    level: level || 'Beginner',
    progress: 0,
    icon: 'BookOpen',
    banner_color: 'from-blue-600 to-indigo-600',
    lessons: [],
    tests_count: 1,
    enrolled_count: 1,
    created_at: new Date().toISOString(),
  };

  db.courses.push(newCourse);
  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', (req: Request, res: Response) => {
  const course = db.courses.find((c) => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs topilmadi' });

  Object.assign(course, req.body);
  res.json(course);
});

app.delete('/api/courses/:id', (req: Request, res: Response) => {
  const idx = db.courses.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Kurs topilmadi' });

  db.courses.splice(idx, 1);
  res.json({ success: true });
});

app.post('/api/courses/:id/lessons/:lessonId/complete', (req: Request, res: Response) => {
  const course = db.courses.find((c) => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs topilmadi' });

  const lesson = course.lessons.find((l) => l.id === req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: 'Dars topilmadi' });

  lesson.is_completed = true;
  const completedCount = course.lessons.filter((l) => l.is_completed).length;
  course.progress = Math.round((completedCount / (course.lessons.length || 1)) * 100);

  res.json({ success: true, progress: course.progress });
});

// ====================================================================
// 7 KUNLIK BILIM CHALLENGE API
// ====================================================================
app.get('/api/challenge/status', (req: Request, res: Response) => {
  const completedCount = db.challenges.filter((c) => c.is_completed).length;
  const isAllCompleted = completedCount === db.challenges.length;

  res.json({
    challenges: db.challenges,
    completedCount,
    totalCount: db.challenges.length,
    isAllCompleted,
  });
});

app.post('/api/challenge/complete-day', (req: Request, res: Response) => {
  const { day_num } = req.body;
  const day = db.challenges.find((c) => c.day_num === day_num);
  if (!day) return res.status(404).json({ error: 'Kun topilmadi' });

  day.is_completed = true;
  day.is_current = false;

  const nextDay = db.challenges.find((c) => c.day_num === day_num + 1);
  if (nextDay) nextDay.is_current = true;

  const completedCount = db.challenges.filter((c) => c.is_completed).length;
  res.json({
    success: true,
    day,
    completedCount,
    isAllCompleted: completedCount === db.challenges.length,
  });
});

// ====================================================================
// TEACHER STUDENTS & GROUP RANKINGS API
// ====================================================================
app.get('/api/teacher/students', (req: Request, res: Response) => {
  const students = db.profiles
    .filter((p) => p.role === 'student')
    .map((student, idx) => {
      const member = db.group_members.find((gm) => gm.student_id === student.id);
      const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;
      const sResults = db.test_results.filter((r) => r.student_id === student.id);

      const testsCount = sResults.length || student.completed_tests || 0;
      const avgScore = sResults.length > 0
        ? Math.round((sResults.reduce((sum, r) => sum + r.percentage, 0) / sResults.length) * 10) / 10
        : student.average_score || 0;

      return {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        phone: student.phone,
        group_id: group?.id || 'group-it-01',
        group_name: group?.name || 'IT-01',
        tests_count: testsCount,
        average_score: avgScore,
        level: student.level || 'Intermediate',
        streak: student.streak || 3,
        xp: student.xp || 500,
        study_hours: student.study_hours || 12,
        last_activity: sResults.length > 0 ? 'Bugun' : idx % 2 === 0 ? 'Bugun' : 'Kecha',
      };
    });

  res.json(students);
});

app.get('/api/teacher/students/:id/details', (req: Request, res: Response) => {
  const student = db.profiles.find((p) => p.id === req.params.id);
  if (!student) return res.status(404).json({ error: 'O‘quvchi topilmadi' });

  const member = db.group_members.find((gm) => gm.student_id === student.id);
  const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;
  const sResults = db.test_results.filter((r) => r.student_id === student.id);

  const testsHistory = sResults.map((r) => {
    const t = db.tests.find((test) => test.id === r.test_id);
    return {
      test_id: r.test_id,
      title: t?.title || 'Online Test',
      score: r.earned_points,
      max_score: r.max_points,
      percentage: r.percentage,
      date: new Date(r.created_at).toLocaleDateString('uz-UZ'),
      duration_minutes: Math.round(r.duration_seconds / 60),
    };
  });

  const bestScore = sResults.length > 0 ? Math.max(...sResults.map((r) => r.percentage)) : 0;
  const avgScore = sResults.length > 0
    ? Math.round(sResults.reduce((a, b) => a + b.percentage, 0) / sResults.length)
    : student.average_score || 0;

  res.json({
    profile: {
      ...student,
      group_name: group?.name || 'IT-01',
      tests_count: sResults.length || student.completed_tests || 0,
      average_score: avgScore,
      best_score: bestScore,
    },
    tests: testsHistory,
    weak_topics: ["Asimptotik murakkablik (Big-O)", "Recursion va daraxtlar", "Dinamik xotira"],
    strong_topics: ["Python sintaksisi", "Mantiqiy amallar", "HTML & CSS layout"],
  });
});

app.get('/api/teacher/group-rankings', (req: Request, res: Response) => {
  const rankings = db.groups.map((group, idx) => {
    const members = db.group_members.filter((gm) => gm.group_id === group.id);
    const memberIds = members.map((m) => m.student_id);
    const groupResults = db.test_results.filter((r) => memberIds.includes(r.student_id));

    const avgScore = groupResults.length > 0
      ? Math.round(groupResults.reduce((a, b) => a + b.percentage, 0) / groupResults.length)
      : 75 + ((idx * 7) % 20);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      students_count: members.length || 4,
      tests_taken: groupResults.length || 15,
      average_score: avgScore,
      rating_rank: idx + 1,
      badge: idx === 0 ? '🥇 1-o‘rin' : idx === 1 ? '🥈 2-o‘rin' : idx === 2 ? '🥉 3-o‘rin' : `${idx + 1}-o‘rin`,
    };
  }).sort((a, b) => b.average_score - a.average_score);

  res.json(rankings);
});

// ====================================================================
// ADMIN API (ILMHUB Super Admin Boshqaruv Markazi)
// ====================================================================
app.get('/api/admin/overview', (req: Request, res: Response) => {
  const totalStudents = db.profiles.filter((p) => p.role === 'student').length;
  const totalTeachers = db.profiles.filter((p) => p.role === 'teacher').length;
  const totalGroups = db.groups.length;
  const totalTests = db.tests.length;
  const totalCourses = db.courses.length;
  const activeToday = Math.max(14, totalStudents + 4);

  res.json({
    metrics: {
      totalStudents,
      totalTeachers,
      totalGroups,
      totalTests,
      totalCourses,
      activeToday,
    },
    platformGrowth: [
      { oy: 'Yanvar', oquvchilar: 120, testlar: 450 },
      { oy: 'Fevral', oquvchilar: 190, testlar: 780 },
      { oy: 'Mart', oquvchilar: 280, testlar: 1200 },
      { oy: 'Aprel', oquvchilar: 390, testlar: 1850 },
      { oy: 'May', oquvchilar: 520, testlar: 2400 },
      { oy: 'Iyun', oquvchilar: 680, testlar: 3100 },
      { oy: 'Hozir', oquvchilar: 840, testlar: 4250 },
    ],
    weeklyActivity: [
      { kun: 'Dush', faollar: 140, topshirish: 85 },
      { kun: 'Sesh', faollar: 185, topshirish: 120 },
      { kun: 'Chor', faollar: 210, topshirish: 145 },
      { kun: 'Pay', faollar: 195, topshirish: 130 },
      { kun: 'Juma', faollar: 240, topshirish: 175 },
      { kun: 'Shan', faollar: 220, topshirish: 160 },
      { kun: 'Yak', faollar: 170, topshirish: 110 },
    ],
  });
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  const usersWithGroup = db.profiles.map((p) => {
    const member = db.group_members.find((gm) => gm.student_id === p.id);
    const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;
    return {
      ...p,
      group_name: group?.name || (p.role === 'teacher' ? "O'qituvchi" : p.role === 'admin' ? 'Admin' : 'Guruhsiz'),
    };
  });
  res.json(usersWithGroup);
});

app.post('/api/admin/users', (req: Request, res: Response) => {
  const { first_name, last_name, phone, role, group_id } = req.body;
  if (!first_name || !phone) return res.status(400).json({ error: 'Ism va telefon talab qilinadi' });

  const newUser: DBProfile = {
    id: `${role || 'student'}-${Date.now()}`,
    role: role || 'student',
    first_name: first_name.trim(),
    last_name: (last_name || '').trim(),
    phone: phone.trim(),
    created_at: new Date().toISOString(),
    level: 'Beginner',
    xp: 100,
    next_level_xp: 300,
    streak: 1,
    study_hours: 1,
    completed_courses: 0,
    completed_tests: 0,
    average_score: 0,
  };

  db.profiles.push(newUser);

  if (group_id && newUser.role === 'student') {
    db.group_members.push({
      id: `gm-${Date.now()}`,
      group_id,
      student_id: newUser.id,
      joined_at: new Date().toISOString(),
    });
  }

  res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', (req: Request, res: Response) => {
  const user = db.profiles.find((p) => p.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

  Object.assign(user, req.body);
  res.json(user);
});

app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const idx = db.profiles.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

  db.profiles.splice(idx, 1);
  res.json({ success: true });
});

// EXCEL EXPORT (Real XLSX generation using SheetJS xlsx)
app.get('/api/teacher/export-excel', (req: Request, res: Response) => {
  const { groupId, testId, date } = req.query;

  let results = db.test_results.map((r) => {
    const student = db.profiles.find((p) => p.id === r.student_id);
    const test = db.tests.find((t) => t.id === r.test_id);
    const member = db.group_members.find((gm) => gm.student_id === r.student_id);
    const group = member ? db.groups.find((g) => g.id === member.group_id) : undefined;

    const minutes = Math.floor(r.duration_seconds / 60);
    const seconds = r.duration_seconds % 60;
    const durationFormatted = `${minutes}m ${seconds}s`;

    return {
      'Ism': student?.first_name || '',
      'Familiya': student?.last_name || '',
      'Telefon': student?.phone || '',
      'Guruh': group?.name || 'Guruhsiz',
      'Test': test?.title || '',
      'Ball': r.earned_points,
      'Maksimal ball': r.max_points,
      'Foiz': `${r.percentage}%`,
      'Holat': r.passed ? "O'tdi" : "O'tmadi",
      'Sarflangan vaqt': durationFormatted,
      'Tab switch (Oynadan chiqish)': `${r.tab_switch_count} marta`,
      'Sana': new Date(r.created_at).toLocaleString('uz-UZ'),
      _group_id: group?.id,
      _test_id: r.test_id,
      _created_at: r.created_at,
    };
  });

  if (groupId) {
    results = results.filter((r) => r._group_id === groupId);
  }
  if (testId) {
    results = results.filter((r) => r._test_id === testId);
  }
  if (date) {
    results = results.filter((r) => r._created_at.startsWith(String(date)));
  }

  const cleanData = results.map(({ _group_id, _test_id, _created_at, ...rest }) => rest);

  const worksheet = XLSX.utils.json_to_sheet(cleanData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Natijalari');

  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="test-natijalari.xlsx"');
  res.send(excelBuffer);
});

// Telegram Webhook Handler
app.post('/api/telegram/webhook', (req: Request, res: Response) => {
  const update = req.body;
  if (update && update.message) {
    const text = update.message.text;
    const chatId = update.message.chat.id;

    if (text === '/start') {
      dispatchTelegramNotification(
        `Assalomu alaykum! TestPlatform botiga xush kelibsiz.\nSizning Telegram Chat ID: <code>${chatId}</code>\nPlatformada test topshirishda ushbu bot orqali bir martalik xavfsiz kod olasiz.`
      );
    }
  }
  res.json({ ok: true });
});

// ====================================================================
// VITE INTEGRATION & SERVER START
// ====================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[TestPlatform Pro Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
