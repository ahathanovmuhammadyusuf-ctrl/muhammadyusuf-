# 500 FOYDALANUVCHILI YUKLAMA TESTI (LOAD TESTING) QO'LLANMASI

Ushbu papkada platformaning **500 bir vaqtdagi foydalanuvchi (concurrent users)** yuklamasiga bardoshliligini sinash uchun professional **k6** skripti tayyorlangan.

> **Muhim eslatma:** Haqiqiy 500-user load test faqat tashqi terminal yoki serverda (masalan, k6 o'rnatilgan VPS, k6 Cloud yoki mahalliy kuchli kompyuterda) ishga tushirilishi kerak. Soxta (fake) natijalar yozilmaydi, faqat real yuklama orqali o'lchanadi.

---

## 1. k6 ni o'rnatish

### Linux (Ubuntu/Debian):
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D34EE14C
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### MacOS:
```bash
brew install k6
```

### Windows (Chocolatey or Scoop):
```powershell
choco install k6
# yoki
scoop install k6
```

---

## 2. Testni ishga tushirish

### Mahalliy muhitda (Development server):
```bash
k6 run load-test/k6-test.js
```

### Haqiqiy ishlab chiqarish (Production yoki Staging Vercel/Cloud URL):
```bash
k6 run -e BASE_URL=https://sizning-domen.vercel.app load-test/k6-test.js
```

---

## 3. O'lchanadigan metrikalar (KPI)

k6 yakunlanganda quyidagi real metrikalar terminalda chiqadi:

1. **Requests/sec (http_reqs)**: Server sekundiga nechta so'rovni qabul qildi.
2. **Average latency (http_req_duration avg)**: O'rtacha javob vaqti (maqsad: < 250ms).
3. **P95 Latency (http_req_duration p(95))**: 95% so'rovlarning maksimal vaqti (maqsad: < 500ms).
4. **P99 Latency (http_req_duration p(99))**: 99% so'rovlarning maksimal vaqti (maqsad: < 1200ms).
5. **Error rate (http_req_failed)**: Xatolik foizi (maqsad: < 1%).
6. **successful_test_attempts**: Muvaffaqiyatli yakunlangan test urinishlari soni.
7. **failed_test_attempts**: Tarmoq yoki server xatoligi tufayli uzilgan urinishlar.
