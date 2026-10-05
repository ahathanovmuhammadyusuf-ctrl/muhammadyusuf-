/**
 * Type definitions for ILMHUB - Professional Ta'lim Platformasi
 * "Bilim sari birgalikda!"
 */

export type UserRole = 'student' | 'teacher' | 'admin';

export type QuestionType = 'SINGLE_CHOICE' | 'TRUE_FALSE';

export type AttemptStatus = 'in_progress' | 'completed' | 'expired' | 'reset';

export type LevelName =
  | 'Beginner'
  | 'Starter'
  | 'Junior'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
  | 'Master';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  telegram_chat_id?: number | null;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  group_id?: string;
  group_name?: string;
  teacher_name?: string;
  // ILMHUB Gamification
  level: LevelName;
  xp: number;
  next_level_xp: number;
  streak: number;
  study_hours: number;
  completed_courses: number;
  completed_tests: number;
  average_score: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacher_id: string;
  teacher_name?: string;
  student_count?: number;
  average_score?: number;
  created_at: string;
  updated_at?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  student?: Profile;
  joined_at: string;
}

export interface TestGroup {
  id: string;
  test_id: string;
  group_id: string;
  group_name?: string;
}

export type TestDifficulty = 'Oson' | "O'rtacha" | 'Qiyin';
export type TestCategory = 'all' | 'new' | 'popular' | 'hard' | 'course';

export interface TestItem {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  max_attempts: number;
  passing_percentage: number;
  difficulty?: TestDifficulty;
  category?: TestCategory;
  attempts_count?: number; // necha marta ishlangan
  xp_reward?: number;
  start_time?: string | null;
  end_time?: string | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_correct_answers_after_test: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  group_ids?: string[];
  groups?: Group[];
  question_count?: number;
  // student-specific fields
  attempts_used?: number;
  can_attempt?: boolean;
  active_attempt_id?: string | null;
  last_score?: number | null;
  last_percentage?: number | null;
  is_date_expired?: boolean;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_letter: string;
  option_text: string;
  is_correct?: boolean;
  order_num: number;
}

export interface Question {
  id: string;
  test_id: string;
  type: QuestionType;
  question_text: string;
  points: number;
  explanation?: string;
  order_num: number;
  options: QuestionOption[];
  created_at?: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  started_at: string;
  server_end_time: string;
  submitted_at?: string | null;
  status: AttemptStatus;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  duration_seconds: number;
  tab_switch_count: number;
  earned_xp?: number;
}

export interface QuestionReview {
  id: string;
  question_text: string;
  type: QuestionType;
  points: number;
  explanation?: string;
  selected_option_id?: string;
  correct_option_id?: string;
  is_correct: boolean;
  points_earned: number;
  options: {
    id: string;
    option_letter: string;
    option_text: string;
    is_correct?: boolean;
  }[];
}

export interface TestResult {
  id: string;
  attempt_id: string;
  student_id: string;
  test_id: string;
  test_title?: string;
  student_name?: string;
  student_phone?: string;
  group_name?: string;
  earned_points: number;
  max_points: number;
  percentage: number;
  passed: boolean;
  duration_seconds: number;
  tab_switch_count: number;
  earned_xp?: number;
  bonus_xp?: number;
  created_at: string;
  reviews?: QuestionReview[];
}

export interface Lesson {
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

export interface Course {
  id: string;
  title: string;
  category: string;
  description: string;
  teacher_name: string;
  teacher_avatar?: string;
  lessons_count: number;
  duration_hours: number;
  level: LevelName;
  progress: number; // 0 - 100%
  icon: string;
  banner_color: string;
  lessons: Lesson[];
  tests_count: number;
  enrolled_count: number;
}

export interface ChallengeDay {
  day_num: number;
  day_name: string;
  task_title: string;
  task_type: 'test' | 'lesson' | 'questions' | 'minitest' | 'final';
  xp_reward: number;
  is_completed: boolean;
  is_current: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp_bonus: number;
  is_unlocked: boolean;
  progress?: number;
  max_progress?: number;
  category: 'streak' | 'test' | 'score' | 'mastery';
  unlocked_at?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'test' | 'streak' | 'achievement' | 'course' | 'info';
  time: string;
  read: boolean;
  link?: string;
}

export interface LeaderboardItem {
  rank: number;
  user_id: string;
  name: string;
  avatar_url?: string;
  group_name: string;
  level: LevelName;
  xp: number;
  streak: number;
  tests_count: number;
  average_score: number;
  is_current_user?: boolean;
}

export interface QuestionAnalytic {
  question_id: string;
  question_text: string;
  order_num: number;
  type: QuestionType;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
  correct_percentage: number;
  incorrect_percentage: number;
  difficulty: 'Qiyin' | "O'rtacha" | 'Oson';
}

export interface UnattemptedStudent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  group_name: string;
}
