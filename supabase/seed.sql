-- ====================================================================
-- TESTPLATFORM PRO - SEED DATA FOR DEVELOPMENT & TESTING
-- ====================================================================

-- 1. Insert Teacher Profile
INSERT INTO profiles (id, role, first_name, last_name, phone)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'teacher', 'Dilshod', 'Rahimov', '+998901234567')
ON CONFLICT (phone) DO NOTHING;

-- 2. Insert Groups
INSERT INTO groups (id, teacher_id, name, description)
VALUES 
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Dasturlash Asoslari - 101', 'Frontend va Backend dasturlash bo''yicha boshlang''ich guruh'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Algoritmlar va Mantiq - 202', 'Ma''lumotlar tuzilmasi va algoritmlarni o''rganuvchi guruh'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Tarmoq Xavfsizligi - 303', 'Kiberxavfsizlik va tarmoq protokollari guruhi')
ON CONFLICT DO NOTHING;

-- 3. Insert 10 Students
INSERT INTO profiles (id, role, first_name, last_name, phone)
VALUES 
    ('33333333-3333-3333-3333-333333333301', 'student', 'Aziz', 'Karimov', '+998901112233'),
    ('33333333-3333-3333-3333-333333333302', 'student', 'Malika', 'Yusupova', '+998902223344'),
    ('33333333-3333-3333-3333-333333333303', 'student', 'Jasur', 'Nazarov', '+998903334455'),
    ('33333333-3333-3333-3333-333333333304', 'student', 'Zuhra', 'Ahmedova', '+998904445566'),
    ('33333333-3333-3333-3333-333333333305', 'student', 'Bobur', 'Mirzayev', '+998905556677'),
    ('33333333-3333-3333-3333-333333333306', 'student', 'Nigora', 'Toshmatova', '+998906667788'),
    ('33333333-3333-3333-3333-333333333307', 'student', 'Sardor', 'Bekchanov', '+998907778899'),
    ('33333333-3333-3333-3333-333333333308', 'student', 'Madina', 'Shodiyeva', '+998908889900'),
    ('33333333-3333-3333-3333-333333333309', 'student', 'Farrux', 'Ganiyev', '+998909990011'),
    ('33333333-3333-3333-3333-333333333310', 'student', 'Shahlo', 'Saidova', '+998901239988')
ON CONFLICT (phone) DO NOTHING;

-- 4. Assign Students to Groups
INSERT INTO group_members (group_id, student_id)
VALUES 
    ('22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333301'),
    ('22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333302'),
    ('22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333303'),
    ('22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333304'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333305'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333306'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333307'),
    ('22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333308'),
    ('22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333309'),
    ('22222222-2222-2222-2222-222222222223', '33333333-3333-3333-3333-333333333310')
ON CONFLICT DO NOTHING;

-- 5. Insert Tests
INSERT INTO tests (id, teacher_id, title, description, duration_minutes, max_attempts, passing_percentage, shuffle_questions, shuffle_options, show_correct_answers_after_test, is_active)
VALUES 
    ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'JavaScript va Web Dasturlash Asoslari', 'Frontend dasturchilar uchun asosiy sintaksis va DOM nazariyasi', 30, 2, 60.00, true, true, true, true),
    ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Algoritmik Murakkablik va Ma''lumotlar Tuzilmasi', 'Big-O notatsiyasi, massivlar va bog''langan ro''yxatlar', 40, 1, 70.00, true, true, true, true),
    ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Kiberxavfsizlik va Tarmoq Asoslari', 'TCP/IP, HTTP/HTTPS va shifrlash protokollari bo''yicha test', 25, 2, 65.00, true, true, false, true)
ON CONFLICT DO NOTHING;

-- 6. Attach Tests to Groups
INSERT INTO test_groups (test_id, group_id)
VALUES 
    ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221'),
    ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222'),
    ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222223')
ON CONFLICT DO NOTHING;

-- 7. Insert Questions for Test 1
INSERT INTO questions (id, test_id, type, question_text, points, explanation, order_num)
VALUES 
    ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444441', 'SINGLE_CHOICE', 'JavaScript-da o''zgarmas o''zgaruvchini e''lon qilish uchun qaysi kalit so''z ishlatiladi?', 1, 'const kalit so''zi qayta qiymat berib bo''lmaydigan (immutable reference) o''zgaruvchi yaratadi.', 1),
    ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444441', 'SINGLE_CHOICE', 'JavaScript tili qaysi paradigma asosida ishlaydi?', 1, 'JavaScript bir vaqtning o''zida multiparadigmali, event-driven va prototip asosli tildir.', 2),
    ('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444441', 'TRUE_FALSE', 'JavaScript-da `null === undefined` ifodasi rost (true) qiymat qaytaradi.', 1, 'Noto''g''ri, chunki === qat''iy tenglik turini ham tekshiradi; null va undefined har xil tiplardir.', 3),
    ('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444441', 'SINGLE_CHOICE', 'Quyidagilardan qaysi biri massiv oxiriga yangi element qo''shadi?', 1, 'push() metodi massiv oxiriga yangi element qo''shib, yangi uzunlikni qaytaradi.', 4)
ON CONFLICT DO NOTHING;

-- Options for Question 1
INSERT INTO question_options (id, question_id, option_letter, option_text, is_correct, order_num)
VALUES 
    ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'A', 'var', false, 1),
    ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'B', 'let', false, 2),
    ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555501', 'C', 'const', true, 3),
    ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555501', 'D', 'static', false, 4)
ON CONFLICT DO NOTHING;

-- Options for Question 2
INSERT INTO question_options (id, question_id, option_letter, option_text, is_correct, order_num)
VALUES 
    ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555502', 'A', 'Faqatgina sof funksional', false, 1),
    ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555502', 'B', 'Multiparadigma (OOP, Funksional, Hodisalarga asoslangan)', true, 2),
    ('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555502', 'C', 'Faqatgina protsedurali', false, 3),
    ('66666666-6666-6666-6666-666666666608', '55555555-5555-5555-5555-555555555502', 'D', 'Faqatgina assemblerga yaqin quyi darajali', false, 4)
ON CONFLICT DO NOTHING;

-- Options for Question 3 (True/False)
INSERT INTO question_options (id, question_id, option_letter, option_text, is_correct, order_num)
VALUES 
    ('66666666-6666-6666-6666-666666666609', '55555555-5555-5555-5555-555555555503', 'A', 'To''g''ri', false, 1),
    ('66666666-6666-6666-6666-666666666610', '55555555-5555-5555-5555-555555555503', 'B', 'Noto''g''ri', true, 2)
ON CONFLICT DO NOTHING;

-- Options for Question 4
INSERT INTO question_options (id, question_id, option_letter, option_text, is_correct, order_num)
VALUES 
    ('66666666-6666-6666-6666-666666666611', '55555555-5555-5555-5555-555555555504', 'A', 'shift()', false, 1),
    ('66666666-6666-6666-6666-666666666612', '55555555-5555-5555-5555-555555555504', 'B', 'pop()', false, 2),
    ('66666666-6666-6666-6666-666666666613', '55555555-5555-5555-5555-555555555504', 'C', 'push()', true, 3),
    ('66666666-6666-6666-6666-666666666614', '55555555-5555-5555-5555-555555555504', 'D', 'unshift()', false, 4)
ON CONFLICT DO NOTHING;
