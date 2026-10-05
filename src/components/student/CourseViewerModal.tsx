import React, { useState } from 'react';
import { Course, Lesson } from '../../types';
import {
  X,
  BookOpen,
  CheckCircle,
  PlayCircle,
  Clock,
  Award,
  Sparkles,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

interface CourseViewerModalProps {
  course: Course;
  onClose: () => void;
  onStartCourseTest?: (testId: string) => void;
}

export const CourseViewerModal: React.FC<CourseViewerModalProps> = ({
  course,
  onClose,
  onStartCourseTest,
}) => {
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>(course.lessons || []);
  const [completing, setCompleting] = useState(false);

  const activeLesson = lessons[activeLessonIdx] || {
    id: 'demo-l',
    course_id: course.id,
    title: `${course.title} - Kirish darsi`,
    duration_minutes: 25,
    order_num: 1,
    is_completed: false,
    content_text:
      "Ushbu darsda siz kursning asosiy yo‘nalishlari, muhim tushunchalar va amaliy mashg‘ulotlar tartibi bilan tanishasiz. Mavzularni sinchkovlik bilan o‘rganing va har bir bo‘lim yakunida test savollariga javob bering.",
    key_takeaways: [
      "Kurs arxitekturasi va talablar",
      "Amaliy mashqlar va kod namunalari",
      "Yakuniy testga tayyorgarlik ko‘rsatmalari",
    ],
  };

  const completedCount = lessons.filter((l) => l.is_completed).length;
  const progressPct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : course.progress;

  const handleCompleteLesson = async (lessonId: string) => {
    setCompleting(true);
    try {
      await fetch(`/api/courses/${course.id}/lessons/${lessonId}/complete`, {
        method: 'POST',
      });
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, is_completed: true } : l))
      );
    } catch (e) {
      console.warn('Lesson complete err:', e);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                  {course.category}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{course.level}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                {course.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Kurs progressi: {completedCount} / {lessons.length || 4} dars tugatildi
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 overflow-y-auto pr-1">
          {/* Left: Lessons list */}
          <div className="space-y-2 order-2 md:order-1">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Darslar Ro‘yxati
            </h4>
            <div className="space-y-1.5 max-h-72 md:max-h-96 overflow-y-auto">
              {(lessons.length > 0 ? lessons : [activeLesson]).map((lesson, idx) => {
                const isActive = idx === activeLessonIdx;

                return (
                  <button
                    key={lesson.id || idx}
                    onClick={() => setActiveLessonIdx(idx)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {lesson.is_completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <PlayCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{lesson.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {lesson.duration_minutes}m
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Test action inside course */}
            <div className="pt-3">
              <button
                onClick={() => {
                  onClose();
                  if (onStartCourseTest) onStartCourseTest('test-1');
                }}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Modul Testini Topshirish</span>
              </button>
            </div>
          </div>

          {/* Right: Active Lesson Video & Content */}
          <div className="md:col-span-2 space-y-4 order-1 md:order-2">
            {/* Video preview / placeholder */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-950 aspect-video flex items-center justify-center border border-gray-800 shadow-inner">
              {activeLesson.video_url ? (
                <iframe
                  className="w-full h-full"
                  src={activeLesson.video_url}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <PlayCircle className="w-12 h-12 mx-auto text-blue-500 animate-pulse" />
                  <p className="text-xs text-gray-400">
                    Interaktiv darslik va video konspekt
                  </p>
                </div>
              )}
            </div>

            {/* Lesson details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {activeLesson.title}
                </h3>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{activeLesson.duration_minutes} daqiqa</span>
                </span>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {activeLesson.content_text}
              </p>

              {/* Takeaways */}
              {activeLesson.key_takeaways && activeLesson.key_takeaways.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    Asosiy Xulosalar:
                  </span>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {activeLesson.key_takeaways.map((takeaway, i) => (
                      <li key={i}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  disabled={activeLesson.is_completed || completing}
                  onClick={() => handleCompleteLesson(activeLesson.id)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    activeLesson.is_completed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-500/20'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {activeLesson.is_completed ? 'Dars bajarildi ✓' : completing ? 'Yuklanmoqda...' : 'Darsni tugatdim'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
