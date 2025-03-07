import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Используем абсолютный путь к файлу базы данных
const dbPath: string = 'E:/kvf/fest/server/database.sqlite';
console.log('Абсолютный путь к базе данных:', dbPath);

// Проверяем, существует ли директория
const dbDir: string = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Создана директория для базы данных: ${dbDir}`);
}

const sequelize: Sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false // Отключаем логирование SQL-запросов
});

export default sequelize; 