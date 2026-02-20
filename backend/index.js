const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path'); // Добавили для путей

const app = express();
const PORT = 5000;

// МИДДЛВЕРЫ
app.use(express.json());
app.use(cors());

// --- РАЗДАЧА ГЕНЕРАТОРА (HTML) ---
// Положите generator.html в папку /public рядом с index.js
app.use(express.static(path.join(__dirname, 'public')));

const SECRET_KEY = 'vash-sekretniy-klyuch-123';
const db = new sqlite3.Database('./database.db');

// --- 1. ЛОГИН ---
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  db.get('SELECT * FROM teachers WHERE login = ?', [login], (err, user) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    if (!user) return res.status(401).json({ error: 'Неверный логин' });
    if (password !== user.password) {
       return res.status(401).json({ error: 'Неверный пароль' });
    }
    const token = jwt.sign({ id: user.id, name: user.name }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name } });
  });
});

// --- 2. ПРОВЕРКА ТОКЕНА ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- 3. ПОЛУЧЕНИЕ ПРЕДМЕТОВ ---
app.get('/my-subjects', authenticateToken, (req, res) => {
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

// --- 4. СОХРАНЕНИЕ ПОСЕЩАЕМОСТИ ---
app.post('/api/attendance', authenticateToken, (req, res) => {
  const { qrData, subjectId } = req.body;
  const teacherId = req.user.id;

  if (!qrData || !subjectId) return res.status(400).json({ error: "Данные не полные" });

  const sql = `INSERT INTO attendance (student_name, subject_id, teacher_id) VALUES (?, ?, ?)`;
  db.run(sql, [qrData, subjectId, teacherId], function(err) {
    if (err) return res.status(500).json({ error: "Ошибка базы данных" });
    res.json({ success: true, id: this.lastID });
  });
});

// --- 5. ИСТОРИЯ ---
app.get('/api/attendance/history', authenticateToken, (req, res) => {
  const teacherId = req.user.id;
  const date = req.query.date;
  if (!date) return res.status(400).json({ error: "Не указана дата" });

  const sql = `
    SELECT a.id, a.student_name, a.created_at, s.title as subject_title
    FROM attendance a
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.teacher_id = ? AND DATE(a.created_at) = ?
    ORDER BY a.created_at DESC
  `;
  db.all(sql, [teacherId, date], (err, rows) => {
    if (err) return res.status(500).json({ error: "Ошибка базы данных" });
    res.json(rows);
  });
});

// ЗАПУСК
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`📱 API: http://localhost:${PORT}/login`);
  console.log(`qr Генератор: http://localhost:${PORT}/generator.html`);
});