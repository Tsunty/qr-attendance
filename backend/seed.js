const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключаемся к БД
const dbPath = path.resolve(__dirname, 'school.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Запуск глобальной генерации данных (Февраль - Май 2026)...');

db.serialize(() => {
  // 1. Создаем таблицы, если их нет (чтобы скрипт работал 100% везде)
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, title TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS teacher_subjects (teacher_id INTEGER, subject_id INTEGER, PRIMARY KEY(teacher_id, subject_id))`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_name TEXT, subject_id INTEGER, teacher_id INTEGER, created_at DATETIME)`);

  // 2. Очищаем старые данные для чистоты эксперимента
  db.run(`DELETE FROM attendance`);
  db.run(`DELETE FROM teacher_subjects`);
  db.run(`DELETE FROM subjects`);
  db.run(`DELETE FROM users`); // ВАЖНО: Это удалит текущих пользователей. Если вы хотите сохранить свой логин, закомментируйте эту строку.

  // 3. Создаем 3-х преподавателей (пароли для демо ставим простые или заглушки)
  const teachers = [
    { id: 1, username: 'admin', password: '123', role: 'teacher' }, // Ваш основной
    { id: 2, username: 'teacher2', password: '123', role: 'teacher' },
    { id: 3, username: 'teacher3', password: '123', role: 'teacher' }
  ];
  const insertUser = db.prepare(`INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)`);
  teachers.forEach(t => insertUser.run(t.id, t.username, t.password, t.role));
  insertUser.finalize();

  // 4. Создаем 6 дисциплин
  const subjects = [
    { id: 1, title: 'Высшая математика' },
    { id: 2, title: 'Физика' },
    { id: 3, title: 'Алгоритмы и структуры данных' },
    { id: 4, title: 'Базы данных' },
    { id: 5, title: 'Компьютерные сети' },
    { id: 6, title: 'Мобильная разработка' }
  ];
  const insertSubject = db.prepare(`INSERT INTO subjects (id, title) VALUES (?, ?)`);
  subjects.forEach(s => insertSubject.run(s.id, s.title));
  insertSubject.finalize();

  // 5. Привязываем предметы к преподавателям
  const teacherSubjects = [
    { tid: 1, sid: 1 }, { tid: 1, sid: 2 }, // Вы (admin) ведете Математику и Физику
    { tid: 2, sid: 3 }, { tid: 2, sid: 4 }, // Второй препод ведет Алгоритмы и БД
    { tid: 3, sid: 5 }, { tid: 3, sid: 6 }  // Третий препод ведет Сети и Мобилку
  ];
  const insertTS = db.prepare(`INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)`);
  teacherSubjects.forEach(ts => insertTS.run(ts.tid, ts.sid));
  insertTS.finalize();

  // 6. Списки студентов (3 большие группы)
  const groups = {
    'Группа-А1': ['Смирнов Алексей', 'Иванова Мария', 'Кузнецов Дмитрий', 'Попова Анна', 'Соколов Илья', 'Лебедева Дарья', 'Козлов Максим', 'Новикова Екатерина', 'Морозов Кирилл', 'Волкова Алина', 'Зайцев Егор', 'Павлова София', 'Степанов Роман', 'Николаева Виктория', 'Орлов Никита'],
    'Группа-Б2': ['Андреев Михаил', 'Макарова Алиса', 'Захаров Артем', 'Ильина Милана', 'Борисов Вадим', 'Романова Полина', 'Григорьев Тимофей', 'Титова Елизавета', 'Филиппов Даниил', 'Яковлева Валерия', 'Медведев Александр', 'Силина Ксения', 'Ширяев Иван', 'Крылова Анастасия'],
    'Группа-В3': ['Тарасов Денис', 'Власова Кристина', 'Белов Матвей', 'Антонова Маргарита', 'Панин Владислав', 'Мухина Татьяна', 'Горбачев Арсений', 'Блинова Вероника', 'Савельев Глеб', 'Рожкова Надежда', 'Данилов Ярослав', 'Уварова Елена', 'Зимин Леонид', 'Жукова Василиса', 'Гусев Константин']
  };

  // 7. Подготавливаем запрос для посещений
  const insertAttendance = db.prepare(`INSERT INTO attendance (student_name, subject_id, teacher_id, created_at) VALUES (?, ?, ?, ?)`);
  let recordsCount = 0;

  // Функция для формата чисел (например: 02 вместо 2)
  const pad = (num) => String(num).padStart(2, '0');

  // --- ГЛАВНЫЙ ЦИКЛ: КАЖДЫЙ ДЕНЬ С 1 ФЕВРАЛЯ ПО 31 МАЯ 2026 ---
  const startDate = new Date(2026, 1, 1); // Месяцы в JS начинаются с 0, поэтому 1 = Февраль
  const endDate = new Date(2026, 4, 31);  // 4 = Май

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0 - Воскресенье, 1 - Понедельник ... 6 - Суббота
    
    // Пропускаем выходные (Субботу и Воскресенье)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Генерируем расписание на текущий день
    // Для разнообразия привязываем пары к дням недели
    const dailyLessons = [];

    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) { // Пн, Ср, Пт
      dailyLessons.push({ t_id: 1, s_id: 1, group: 'Группа-А1', startH: 9, startM: 0 });  // Admin ведет
      dailyLessons.push({ t_id: 2, s_id: 3, group: 'Группа-Б2', startH: 10, startM: 45 }); // Teacher2 ведет
      dailyLessons.push({ t_id: 3, s_id: 5, group: 'Группа-В3', startH: 12, startM: 30 }); // Teacher3 ведет
    } else { // Вт, Чт
      dailyLessons.push({ t_id: 1, s_id: 2, group: 'Группа-Б2', startH: 9, startM: 0 });  // Admin ведет
      dailyLessons.push({ t_id: 2, s_id: 4, group: 'Группа-В3', startH: 10, startM: 45 }); // Teacher2 ведет
      dailyLessons.push({ t_id: 3, s_id: 6, group: 'Группа-А1', startH: 12, startM: 30 }); // Teacher3 ведет
    }

    // Проходим по каждой паре в этот день
    dailyLessons.forEach(lesson => {
      const studentsList = groups[lesson.group];
      
      // Эмулируем, что от 1 до 3 человек случайно заболели/прогуляли
      const presentStudents = studentsList.filter(() => Math.random() > 0.15);

      presentStudents.forEach((student, index) => {
        // Симуляция сканирования QR-кода студентами на входе:
        // Студенты заходят кучно. Кто-то за 5 минут до пары, кто-то опаздывает.
        const timeOffsetMinutes = -5 + Math.floor(Math.random() * 15); // от -5 до +10 минут от звонка
        const timeOffsetSeconds = Math.floor(Math.random() * 60);

        // Рассчитываем точное время отметки
        let hour = lesson.startH;
        let minute = lesson.startM + timeOffsetMinutes;

        if (minute < 0) {
            hour -= 1;
            minute = 60 + minute;
        } else if (minute >= 60) {
            hour += 1;
            minute = minute - 60;
        }

        const timestamp = `${dateStr} ${pad(hour)}:${pad(minute)}:${pad(timeOffsetSeconds)}`;
        const fullNameWithGroup = `${student} ${lesson.group}`;

        insertAttendance.run(fullNameWithGroup, lesson.s_id, lesson.t_id, timestamp);
        recordsCount++;
      });
    });
  }

  insertAttendance.finalize();
  
  console.log(`✅ База успешно инициализирована!`);
  console.log(`👨‍🏫 Создано преподавателей: 3`);
  console.log(`📚 Создано дисциплин: 6`);
  console.log(`📅 Сгенерировано отметок о посещении: ${recordsCount} (с Февраля по Май 2026)`);
});

db.close();