// backend/index.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Секретный ключ для подписи токенов (в реальном проекте храните в .env!)
const SECRET_KEY = 'vash-sekretniy-klyuch-123';

// Подключение к БД
const db = new sqlite3.Database('./database.db');

// --- 1. МАРШРУТ ЛОГИНА ---
app.post('/login', (req, res) => {
  const { login, password } = req.body;

  // Ищем пользователя по логину
  db.get('SELECT * FROM teachers WHERE login = ?', [login], (err, user) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    if (!user) return res.status(401).json({ error: 'Неверный логин' });

    // ПРОВЕРКА ПАРОЛЯ
    // Важно: в базе пароли должны быть захешированы. 
    // Но так как мы добавляли их вручную как текст ('123'), то сначала сравним как текст.
    // В реальном проде используйте: const isValid = bcrypt.compareSync(password, user.password);
    
    // Для простоты, пока сравниваем напрямую (если вы не хешировали при создании):
    if (password !== user.password) {
       return res.status(401).json({ error: 'Неверный пароль' });
    }

    // ГЕНЕРАЦИЯ ТОКЕНА
    // В токен зашиваем ID учителя и его имя. Токен живет 24 часа.
    const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '24h' });

    res.json({ token, user: { id: user.id, name: user.name } });
  });
});

// --- 2. MIDDLEWARE ДЛЯ ЗАЩИТЫ РОУТОВ ---
// Эту функцию мы вешаем на те запросы, которые требуют входа
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Формат заголовка: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.sendStatus(401); // Нет токена

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // Токен невалиден
    req.user = user; // Сохраняем данные юзера в запрос
    next();
  });
};

// --- 3. ЗАЩИЩЕННЫЙ МАРШРУТ (Пример) ---
// Получить предметы ТОЛЬКО залогиненного учителя
app.get('/my-subjects', authenticateToken, (req, res) => {
  // Берем ID учителя из токена (req.user.id)
  const sql = `
    SELECT s.id, s.title 
    FROM subjects s
    JOIN teacher_subjects ts ON s.id = ts.subject_id
    WHERE ts.teacher_id = ?
  `;
  
  db.all(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- Сохранение посещаемости ---
app.post('/api/attendance', authenticateToken, (req, res) => {
  const { qrData, subjectId } = req.body;
  const teacherId = req.user.id; // Извлекаем из токена

  if (!qrData || !subjectId) {
    return res.status(400).json({ error: "Не все данные переданы" });
  }

  // qrData — это строка вида "Иванов Иван ИС-21"
  const sql = `
    INSERT INTO attendance (student_name, subject_id, teacher_id)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [qrData, subjectId, teacherId], function(err) {
    if (err) {
      console.error("Ошибка сохранения:", err.message);
      return res.status(500).json({ error: "Ошибка базы данных" });
    }
    
    res.json({ 
      success: true, 
      message: "Студент отмечен", 
      id: this.lastID 
    });
  });
});

app.listen(5000, () => {
  console.log('Сервер запущен на порту 5000');
});