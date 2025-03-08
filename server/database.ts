import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

const dbPath: string = 'E:/kvf/fest/server/database.sqlite';
console.log('Абсолютный путь к базе данных:', dbPath);

const dbDir: string = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Создана директория для базы данных: ${dbDir}`);
}

const sequelize: Sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

export default sequelize; 