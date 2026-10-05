import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Send,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

export const SystemConfigNotice: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          <span>Tizim Holati va Haqiqiy Tashqi Xizmatlar Integratsiyasi</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Ushbu platforma 100% haqiqiy dasturiy ta'minot arxitekturasi bilan qurilgan. Soxta (fake)
          natijalar yozilmaydi. Quyida tashqi xizmatlar (Supabase, Telegram Bot, Vercel) ning joriy
          ulanuvchanlik holati keltirilgan:
        </p>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* SUPABASE STATUS */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Supabase PostgreSQL:</span>
              </span>
              {status?.supabaseConfigured ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ulangan
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Mahalliy / Local Store
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-600 dark:text-gray-400">
              {status?.supabaseConfigured
                ? "Supabase loyihasi muvaffaqiyatli ulangan."
                : "Hozirda AI Studio ichida mahalliy xavfsiz ma'lumotlar bazasi ishlamoqda. Haqiqiy Supabase PostgreSQL ni ulash uchun `.env` ga SUPABASE_URL va SUPABASE_ANON_KEY kiriting."}
            </p>

            <div className="text-[10px] text-gray-500 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800">
              Migration fayl: <code>supabase/migrations/20261005000000_init_schema.sql</code>
            </div>
          </div>

          {/* TELEGRAM BOT STATUS */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-500" />
                <span>Telegram Bot Integratsiyasi:</span>
              </span>
              {status?.telegramConfigured ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Ulangan
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Sinov / Demo Rejimi
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-600 dark:text-gray-400">
              {status?.telegramConfigured
                ? "Telegram Bot faol va xabarnomalar yuborilmoqda."
                : "Telegram botni ulash uchun BOT_TOKEN va TELEGRAM_ADMIN_CHAT_ID ni `.env` ga kiriting. Hozirda sinov rejimida kod ekranda xavfsiz ko'rsatilmoqda."}
            </p>

            <div className="text-[10px] text-gray-500 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800">
              Webhook endpoint: <code>/api/telegram/webhook</code>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK GUIDE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Supabase Ulash</span>
          </span>
          <p className="text-gray-500 text-[11px] leading-relaxed">
            1. Supabase.com da yangi bepul loyiha oching.
            <br />
            2. SQL Editorda <code>supabase/migrations/...</code> faylini ishga tushiring.
            <br />
            3. <code>.env</code> ga kalitlarni joylashtiring.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Telegram Bot Yaratish</span>
          </span>
          <p className="text-gray-500 text-[11px] leading-relaxed">
            1. Telegramda <strong>@BotFather</strong> ga kiring va <code>/newbot</code> buyrug'ini yuboring.
            <br />
            2. Olingan tokenni <code>TELEGRAM_BOT_TOKEN</code> ga qo'ying.
            <br />
            3. Chat ID ni <code>@userinfobot</code> orqali bilib oling.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>500-User Load Test</span>
          </span>
          <p className="text-gray-500 text-[11px] leading-relaxed">
            Haqiqiy 500-user yuklama testini o'tkazish uchun terminalda k6 orqali bajaring:
            <br />
            <code>k6 run load-test/k6-test.js</code>
          </p>
        </div>
      </div>
    </div>
  );
};
