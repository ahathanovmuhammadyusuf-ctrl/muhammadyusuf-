/**
 * ====================================================================
 * TESTPLATFORM PRO - 500 CONCURRENT USERS LOAD TEST SCRIPT (k6)
 * ====================================================================
 * Ushbu skript 500 ta talabaning bir vaqtda test topshirish
 * ssenariysini haqiqiy serverda sinash uchun mo'ljallangan.
 *
 * Ishga tushirish:
 *   k6 run load-test/k6-test.js
 * yoki boshqa URL bilan:
 *   k6 run -e BASE_URL=https://your-production-domain.com load-test/k6-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Maxsus metrikalar
const successfulAttempts = new Counter('successful_test_attempts');
const failedAttempts = new Counter('failed_test_attempts');
const testSubmissionLatency = new Trend('test_submission_latency_ms');
const errorRate = new Rate('custom_error_rate');

// 500 concurrent user yuklama konfiguratsiyasi
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // 50 foydalanuvchiga oshirish
    { duration: '1m', target: 200 },   // 200 foydalanuvchiga oshirish
    { duration: '2m', target: 500 },   // 500 bir vaqtdagi foydalanuvchilar (peak load)
    { duration: '2m', target: 500 },   // 500 foydalanuvchida barqaror ushlash
    { duration: '30s', target: 0 },    // Sekin tugatish (ramp-down)
  ],
  thresholds: {
    // P95 kechikish 500ms dan kam bo'lishi kerak
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    // Xatolik foizi 1% dan oshmasligi shart
    http_req_failed: ['rate<0.01'],
    custom_error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const userId = __VU; // Virtual User raqami
  // Har bir talaba uchun unikal telefon raqami
  const phone = `+99890${String(1000000 + userId).padStart(7, '0')}`;
  const firstName = `Talaba_${userId}`;
  const lastName = 'Testov';

  const headers = {
    'Content-Type': 'application/json',
  };

  // -----------------------------------------------------------
  // 1. QADAM: Talaba Login / Telegram Verification
  // -----------------------------------------------------------
  const loginRes = http.post(
    `${BASE_URL}/api/auth/student-request-code`,
    JSON.stringify({
      phone: phone,
      first_name: firstName,
      last_name: lastName,
      group_name: 'Dasturlash Asoslari - 101',
    }),
    { headers }
  );

  const loginSuccess = check(loginRes, {
    "1. Login so'rovi muvaffaqiyatli (200)": (r) => r.status === 200,
    "1. Verification code qaytdi": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && (body.code || body.token || body.success);
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    failedAttempts.add(1);
    return;
  }

  let sessionToken = '';
  let studentId = '';
  try {
    const resData = JSON.parse(loginRes.body);
    sessionToken = resData.token || 'simulated-token';
    studentId = resData.student?.id || `student-${userId}`;
  } catch (e) {
    // fallback
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionToken}`,
  };

  sleep(1);

  // -----------------------------------------------------------
  // 2. QADAM: Mavjud testlar ro'yxatini olish
  // -----------------------------------------------------------
  const testsRes = http.get(`${BASE_URL}/api/student/tests?studentId=${studentId}`, {
    headers: authHeaders,
  });

  const getTestsSuccess = check(testsRes, {
    "2. Testlar ro'yxati olindi (200)": (r) => r.status === 200,
    "2. Kamida bitta test mavjud": (r) => {
      try {
        const tests = JSON.parse(r.body);
        return Array.isArray(tests) && tests.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  if (!getTestsSuccess) {
    errorRate.add(1);
    failedAttempts.add(1);
    return;
  }

  let selectedTestId = '';
  try {
    const tests = JSON.parse(testsRes.body);
    selectedTestId = tests[0].id;
  } catch (e) {
    selectedTestId = 'test-1';
  }

  sleep(1);

  // -----------------------------------------------------------
  // 3. QADAM: Testni boshlash (Attempt yaratish va Server vaqti)
  // -----------------------------------------------------------
  const startRes = http.post(
    `${BASE_URL}/api/student/tests/${selectedTestId}/start`,
    JSON.stringify({ studentId: studentId }),
    { headers: authHeaders }
  );

  const startSuccess = check(startRes, {
    "3. Test urinishi (attempt) ochildi": (r) => r.status === 200 || r.status === 201,
  });

  if (!startSuccess) {
    errorRate.add(1);
    failedAttempts.add(1);
    return;
  }

  let attemptId = '';
  let questions = [];
  try {
    const startData = JSON.parse(startRes.body);
    attemptId = startData.attempt?.id;
    questions = startData.questions || [];
  } catch (e) {
    // fallback
  }

  // -----------------------------------------------------------
  // 4. QADAM: Savollarni o'qish va javoblarni tanlash
  // -----------------------------------------------------------
  sleep(2);

  const studentAnswers = {};
  if (Array.isArray(questions) && questions.length > 0) {
    questions.forEach((q) => {
      if (q.options && q.options.length > 0) {
        const randomOpt = q.options[Math.floor(Math.random() * q.options.length)];
        studentAnswers[q.id] = randomOpt.id;
      }
    });
  }

  // -----------------------------------------------------------
  // 5. QADAM: Tab switch hodisasi (ixtiyoriy 10% foydalanuvchida)
  // -----------------------------------------------------------
  if (Math.random() < 0.1 && attemptId) {
    http.post(
      `${BASE_URL}/api/student/tests/${selectedTestId}/tab-switch`,
      JSON.stringify({
        attemptId: attemptId,
        studentId: studentId,
        timestamp: new Date().toISOString(),
      }),
      { headers: authHeaders }
    );
  }

  // -----------------------------------------------------------
  // 6. QADAM: Testni topshirish (Server-side baholash)
  // -----------------------------------------------------------
  const startTime = Date.now();
  const submitRes = http.post(
    `${BASE_URL}/api/student/tests/${selectedTestId}/submit`,
    JSON.stringify({
      attemptId: attemptId,
      studentId: studentId,
      answers: studentAnswers,
    }),
    { headers: authHeaders }
  );

  const submitDuration = Date.now() - startTime;
  testSubmissionLatency.add(submitDuration);

  const submitSuccess = check(submitRes, {
    "6. Test server tomonidan tekshirildi (200)": (r) => r.status === 200,
    "6. Natija ball va foiz qaytdi": (r) => {
      try {
        const result = JSON.parse(r.body);
        return result && typeof result.percentage === 'number';
      } catch (e) {
        return false;
      }
    },
  });

  if (submitSuccess) {
    successfulAttempts.add(1);
    errorRate.add(0);
  } else {
    failedAttempts.add(1);
    errorRate.add(1);
  }

  sleep(1);
}
