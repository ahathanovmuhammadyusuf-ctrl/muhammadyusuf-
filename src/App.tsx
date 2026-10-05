/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { LandingHero } from './components/home/LandingHero';
import { LoginModal } from './components/auth/LoginModal';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentTestRunner } from './components/student/StudentTestRunner';
import { StudentResultModal } from './components/student/StudentResultModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TestResult } from './types';

function MainApp() {
  const { user, isLoading } = useAuth();

  // Test Runner states
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [completedResult, setCompletedResult] = useState<TestResult | null>(null);

  // Login Modal state (for manual / teacher login)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'student' | 'teacher'>('student');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          TestPlatform Pro yuklanmoqda...
        </p>
      </div>
    );
  }

  // Not logged in: Show the stunning Landing Page (Section 1) + frictionless test start
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
        <Header
          onOpenLoginModal={() => {
            setLoginTab('student');
            setShowLoginModal(true);
          }}
        />

        <main className="flex-1">
          <LandingHero
            onStartSpecificTest={(testId) => setActiveTestId(testId)}
            onOpenTeacherLogin={() => {
              setLoginTab('teacher');
              setShowLoginModal(true);
            }}
          />
        </main>

        {showLoginModal && (
          <LoginModal
            initialTab={loginTab}
            onClose={() => setShowLoginModal(false)}
          />
        )}
      </div>
    );
  }

  // Logged in User view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
      <Header />

      <main className="flex-1">
        {user.role === 'teacher' ? (
          <TeacherDashboard />
        ) : activeTestId ? (
          <StudentTestRunner
            testId={activeTestId}
            onFinish={(res) => {
              setActiveTestId(null);
              setCompletedResult(res);
            }}
            onCancel={() => setActiveTestId(null)}
          />
        ) : (
          <StudentDashboard onStartTest={(testId) => setActiveTestId(testId)} />
        )}
      </main>

      {/* Result Modal if test just completed */}
      {completedResult && (
        <StudentResultModal
          result={completedResult}
          onClose={() => setCompletedResult(null)}
          onRetake={() => {
            const retakeId = completedResult.test_id;
            setCompletedResult(null);
            setActiveTestId(retakeId);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
