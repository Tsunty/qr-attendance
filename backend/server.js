const express = require('express');
const path = require('path');
const app = express();

// Делаем папку public доступной по прямой ссылке
app.use(express.static('public'));

// Теперь файл будет доступен по адресу: http://ваш-ip:порт/generator.html