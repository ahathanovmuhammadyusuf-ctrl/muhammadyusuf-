# TestPlatform Pro — Professional Online Test Platformasi

Talabalar va o'qituvchilar uchun mo'ljallangan, yuqori xavfsizlikka ega (server-side grading), Telegram orqali kirish (SMS siz), DOCX test importi va Excel eksportiga ega to'liq full-stack online test tizimi.

---

## 📋 Texnologik Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons, Canvas Confetti
- **Backend:** Node.js, Express, Supabase PostgreSQL, SheetJS (XLSX), Mammoth (.docx parser)
- **Monitoring & Security:** Visibility API (Tab switch nazorati), Server-side vaqt hisobi, IndexedDB oflayn keshlash
- **Deploy:** Vercel va Supabase uchun to'liq tayyorlangan arxitektura

---

## 🚀 10 BOSQICHLI PRODUCTIONGA CHIQARISH QO'LLANMASI

### 1. Supabase da yangi loyiha ochish
1. [supabase.com](https://supabase.com) saytiga kiring va o'z hisobingiz bilan tizimga kiring.
2. **New Project** tugmasini bosing, loyiha nomi va kuchli database parolini o'rnating.

### 2. Database Migration ni ishga tushirish
1. Supabase boshqaruv panelida chap menyudan **SQL Editor** bo'limiga o'ting.
2. Ushbu loyihadagi `supabase/migrations/20261005000000_init_schema.sql` fayli tarkibini to'liq nusxalab oling.
3. SQL Editor oynasiga qo'ying va **Run** tugmasini bosing.
4. *(Ixtiyoriy test ma'lumotlari uchun)*: `supabase/seed.sql` faylini ham SQL Editorda ishga tushiring.

### 3. Environment Variables (Muhit o'zgaruvchilari) ni o'rnatish
Supabase **Project Settings -> API** bo'limiga o'ting va quyidagi qiymatlarni oling:
- `Project URL` -> `SUPABASE_URL`
- `anon public` -> `SUPABASE_ANON_KEY`
- `service_role secret` -> `SUPABASE_SERVICE_ROLE_KEY`

### 4. Telegram Bot yaratish
1. Telegramda rasmiy **@BotFather** botiga kiring.
2. `/newbot` buyrug'ini yuboring va botingizga nom hamda username bering (masalan: `MeningTestPlatformBot`).
3. BotFather sizga **HTTP API token** beradi (Format: `1234567890:ABCdefGHI...`).
4. O'z Telegram hisobingiz chat ID sini bilish uchun Telegramda **@userinfobot** ga kiring va o'z `Id` raqamingizni oling.

### 5. Bot tokenni `.env` ga joylashtirish
Loyiha ildizidagi `.env` fayliga quyidagi qatorlarni yozing:
```env
SUPABASE_URL=https://sizning-loyihangiz.supabase.co
SUPABASE_ANON_KEY=sizning_anon_kalitingiz
SUPABASE_SERVICE_ROLE_KEY=sizning_service_role_kalitingiz
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
TELEGRAM_ADMIN_CHAT_ID=123456789
```

### 6. Vercel ga GitHub Repository ni ulash
1. Loyiha kodini o'z shaxsiy **GitHub** hisobingizga yuklang (`git push origin main`).
2. [vercel.com](https://vercel.com) ga kiring va **Add New... -> Project** tugmasini bosing.
3. GitHub repository ni tanlang.

### 7. Vercel da Environment Variables ni kiritish
Vercel loyiha sozlamalarida **Environment Variables** bo'limiga yuqoridagi 5 ta kalitni (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`) kiriting.

### 8. Deploy
**Deploy** tugmasini bosing. Vercel avtomatik ravishda `npm run build` komandasini ishga tushiradi va loyihani bir necha soniyada jonli efirga uzatadi.

### 9. O'z shaxsiy domeningizni ulash
1. Vercel Dashboard -> **Settings -> Domains** bo'limiga kiring.
2. O'zingiz sotib olgan domenni kiriting (masalan: `test.maktab.uz` yoki `exam.edu.uz`).
3. Domen provayderingizda (DNS) Vercel ko'rsatgan `CNAME` yoki `A` yozuvlarini yo'naltiring. SSL sertifikat avtomatik beriladi.

### 10. Production Test
1. Telegram botingizga `/start` yuboring.
2. Saytga talaba sifatida kirib, telefon raqam orqali Telegram kod oling.
3. Test topshiring — natija bir zumda Telegram chatga bot orqali yetib boradi!

---

## 📖 FOYDALANUVCHI QO'LLANMASI (ODDIY TILDA)

### A. Guruh yaratish
1. O'qituvchi sifatida tizimga kiring.
2. Yuqori menyudan **Guruhlar & Talabalar** bo'limiga o'ting.
3. **Yangi Guruh Yaratish** tugmasini bosing, guruh nomini (masalan: *Matematika-101*) yozing va saqlang.

### B. Student qo'shish
1. Guruhlar ro'yxatidan kerakli guruhni tanlang.
2. O'ng tomondagi **O'quvchi qo'shish** tugmasini bosing.
3. Talabaning ismi, familiyasi va telefon raqamini (+998901234567) kiriting.

### C. Test yaratish
1. **Testlar Boshqaruvi** bo'limiga o'ting va **Yangi Test Yaratish** tugmasini bosing.
2. Test nomi, tavsif, vaqt (daqiqa), urinishlar soni va o'tish foizini belgilang.
3. Sozlamalardan: *Savollarni aralashtirish*, *Variantlarni aralashtirish* va *To'g'ri javoblarni ko'rsatish* parametrlarini yoqing.

### D. Word (.docx) orqali test import qilish
1. Test kartasidagi yashil **Word** tugmasini bosing.
2. Tayyorlangan `.docx` faylni yuklang yoki matnni nusxalab qo'ying.
   *Standart format:*
   ```text
   1. Savol matni?
   A) Noto'g'ri variant
   *B) To'g'ri variant (yulduzcha bilan)
   C) Noto'g'ri variant
   D) Noto'g'ri variant
   ```
3. Tizim xatoliklarni tekshiradi. **Preview** oynasida kerakli o'zgarishlarni kiriting va **Testga qo'shish** tugmasini bosing.

### E. Testni guruhga ochish
Test yaratish yoki tahrirlash oynasida ushbu test qaysi guruh(lar)ga mo'ljallanganini belgilang. Tanlangan guruh talabalari saytga kirganda test avtomatik ko'rinadi.

### F. Natijalarni ko'rish
**Natijalar & Excel** bo'limida barcha talabalarning to'plagan bali, foizi, sarflagan vaqti va eng muhimi — **oynadan chiqishlar (tab switch)** soni real vaqtda jadvalda aks etadi.

### G. Excel yuklash
Natijalar jadvali yuqorisidagi **Excelga yuklash (.xlsx)** tugmasini bosing. Tizim filtrlar bo'yicha barcha natijalarni chiroyli formatdagi haqiqiy Excel jadval fayli qilib yuklab beradi.

### H. Natijani o'chirib qayta topshirishga ruxsat berish
Agar talabada internet uzilgan bo'lsa yoki o'qituvchi unga yana bir imkoniyat bermoqchi bo'lsa:
1. Natijalar jadvalidan talaba qatoridagi **Qayta topshirish** tugmasini bosing.
2. Ogohlantirish oynasini tasdiqlang. Talabaning oldingi urinishi o'chiriladi va unga yangi test topshirish imkoniyati ochiladi.

### I. Telegram botni ulash
`.env` fayliga Telegram Bot tokeni va Chat ID sini joylashtiring. Test yakunlanishi bilan o'qituvchiga to'liq hisobot avtomatik Telegramga boradi.

### J. Vercelga deploy qilish
Yuqoridagi 10 bosqichli production qo'llanmaning 6-8-bandlariga amal qiling.

---

## ⚡ 500 FOYDALANUVCHILI YUKLAMA TESTI (LOAD TESTING)

Loyiha ichida `load-test/` papkasida professional **k6** yuklama sinov skripti mavjud:
- **Skript fayli:** `load-test/k6-test.js`
- **Qo'llanma:** `load-test/README.md`
- **Ssenariy:** 500 concurrent foydalanuvchining login qilishi, testni boshlashi, javoblarni yuborishi va server baholashini tekshirish.

Ishga tushirish:
```bash
k6 run load-test/k6-test.js
```
*(Haqiqiy natijalar faqat real terminal/serverda o'tkazilganda olinadi; soxta natija ko'rsatilmaydi).*
