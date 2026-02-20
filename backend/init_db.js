const sqlite3 = require('sqlite3').verbose();

// Создаем (или открываем) файл базы данных
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Ошибка при подключении к БД:', err.message);
  } else {
    console.log('Подключено к базе данных school.db');
  }
});

db.serialize(() => {
  // 1. Таблица ПРЕПОДАВАТЕЛИ (Teachers)
  // В тетради: Id, Login, pass, name
  db.run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, 
      name TEXT NOT NULL
    )
  `);

  // 2. Таблица ПРЕДМЕТЫ (Subjects)
  // В тетради: Id, Sub_title
  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL
    )
  `);

  // 3. Таблица СВЯЗИ (Teacher_Subjects)
  // Это то, что у вас в тетради записано как Sub_Ids [1, 2, 5].
  // В SQL массивы хранить нельзя, поэтому делается таблица связей.
  db.run(`
    CREATE TABLE IF NOT EXISTS teacher_subjects (
      teacher_id INTEGER,
      subject_id INTEGER,
      FOREIGN KEY (teacher_id) REFERENCES teachers (id),
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      PRIMARY KEY (teacher_id, subject_id)
    )
  `);

  // 4. Таблица ПОСЕЩАЕМОСТЬ (Attendance)
  // В тетради: Id, Sub-Id, name (student), date, teach_id
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      subject_id INTEGER,
      teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects (id),
      FOREIGN KEY (teacher_id) REFERENCES teachers (id)
    )
  `);

  console.log('Таблицы успешно созданы.');

  // --- ЗАПОЛНЕНИЕ ТЕСТОВЫМИ ДАННЫМИ (SEED) ---

  // Добавляем предметы
  const subjects = ['Математика', 'Физика', 'Информатика', 'История'];
  const stmtSub = db.prepare("INSERT INTO subjects (title) VALUES (?)");
  subjects.forEach(sub => stmtSub.run(sub));
  stmtSub.finalize();

  // Добавляем учителя
  // Допустим: Логин admin, Пароль 123 (в реальном проекте пароли надо хешировать!)
  const stmtTeach = db.prepare("INSERT INTO teachers (login, password, name) VALUES (?, ?, ?)");
  stmtTeach.run('admin', '123', 'Иван Иванович');
  stmtTeach.finalize();

  // Привязываем предметы к учителю (например, учитель с ID 1 ведет предметы 1, 2 и 3)
  // Это аналог вашего массива [1, 2, 3]
  const stmtLink = db.prepare("INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)");
  stmtLink.run(1, 1); // Учитель 1 ведет Математику
  stmtLink.run(1, 2); // Учитель 1 ведет Физику
  stmtLink.run(1, 3); // Учитель 1 ведет Информатику
  stmtLink.finalize();

  console.log('Тестовые данные добавлены.');
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Соединение с БД закрыто.');
});