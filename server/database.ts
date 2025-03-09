import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Путь к файлу базы данных SQLite
const dbPath: string = process.env.DATABASE_PATH || 'server/database.sqlite';
console.log('Абсолютный путь к базе данных:', dbPath);

// Определяем режим разработки
const isDevelopment = process.env.NODE_ENV === 'development';

// Создаем директорию для базы данных, если её нет
const dbDir: string = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Создана директория для базы данных: ${dbDir}`);
}

// Инициализируем подключение к базе данных
const sequelize: Sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

/**
 * Инициализирует базу данных и синхронизирует модели.
 * База данных создается с нуля только если файл БД не существует.
 * В режиме разработки (NODE_ENV=development) структура базы обновляется автоматически.
 * В продакшене просто проверяется соответствие структуры.
 */
export async function initDatabase() {
  try {
    // Проверяем соединение с базой данных
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено успешно.');

    try {
      // Импортируем все модели для их регистрации в Sequelize
      console.log('Импортируем модели...');
      const { User } = await import('./models/User');
      const { Role } = await import('./models/Role');
      const { UserRole } = await import('./models/UserRole');
      const { Festival } = await import('./models/Festival');
      const { FestDepartment } = await import('./models/FestDepartment');
      const { FestDepartmentAdmin } = await import('./models/FestDepartmentAdmin');
      const { FestFestivalDepartment } = await import('./models/FestFestivalDepartment');
      const { FestRegistration } = await import('./models/FestRegistration');
      const { FestRegistrationChild } = await import('./models/FestRegistrationChild');
      const { FestRegistrationDepartment } = await import('./models/FestRegistrationDepartment');
      const { FestRoom } = await import('./models/FestRoom');
      const { FestPlacement } = await import('./models/FestPlacement');
      const { PaymentTransaction } = await import('./models/PaymentTransaction');
      
      // Проверяем, существует ли файл базы данных
      const dbExists = fs.existsSync(dbPath);
      
      if (!dbExists) {
        // Если файла базы нет, создаем её с нуля
        // force: true - удаляет существующие таблицы (если они есть) и создает новые
        console.log('Создаем новую базу данных...');
        await sequelize.sync({ force: true });
        console.log('База данных создана и модели синхронизированы.');
        
        // При первом создании базы инициализируем базовые роли
        try {
          console.log('Инициализируем роли...');
          const initRoles = (await import('./utils/initRoles')).default;
          await initRoles();
          console.log('Роли инициализированы.');
        } catch (error) {
          console.error('Ошибка при инициализации ролей:', error);
        }
      } else {
        if (isDevelopment) {
          // В режиме разработки обновляем структуру базы
          console.log('Обновляем структуру базы данных (режим разработки)...');
          await sequelize.sync({ alter: true });
          console.log('Структура базы данных обновлена.');
        } else {
          // В продакшене только проверяем соответствие структуры
          console.log('Проверяем структуру существующей базы данных...');
          await sequelize.sync();
          console.log('Структура базы данных проверена.');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при импорте или синхронизации моделей:', error);
      throw error;
    }
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

export default sequelize; 