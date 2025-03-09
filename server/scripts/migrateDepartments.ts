import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'server/database.sqlite'
});

// Импортируем определение модели
const FestDepartment = sequelize.define('FestDepartment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: ''
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    field: 'public'
  },
  joinText: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'fest_departments',
  timestamps: false
});

function parsePHPArray(content: string): any[] {
  // Удаляем PHP-теги и комментарии
  const cleanContent = content.replace(/^<\?php\s*/, '').replace(/\/\/.*$/gm, '');
  
  // Извлекаем данные массива
  const arrayMatch = cleanContent.match(/array\(([\s\S]*?)\);/);
  if (!arrayMatch) throw new Error('Не удалось найти массив в PHP файле');
  
  const arrayContent = arrayMatch[1];
  
  // Разбиваем на элементы
  const items = arrayContent.split(/\d+\s*=>\s*array\(/);
  
  return items
    .slice(1) // Пропускаем первый пустой элемент
    .map(item => {
      const result: any = {};
      
      // Извлекаем все пары ключ-значение
      const pairs = item.split(/,\s*(?='|$)/).filter(Boolean);
      pairs.forEach(pair => {
        const match = pair.match(/'([^']+)'\s*=>\s*'([^']*)'/);
        if (match) {
          const [, key, value] = match;
          result[key] = value;
        }
      });
      
      return result;
    });
}

async function migrateDepartments() {
  try {
    // Инициализируем подключение к базе данных
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено');

    // Читаем PHP файл
    const phpContent = fs.readFileSync('server/tmp/depts.php', 'utf-8');
    
    // Парсим PHP массив
    const deptArray = parsePHPArray(phpContent);
    
    // Преобразуем данные в формат нашей модели
    const departments = deptArray.map((dept: any) => ({
      id: parseInt(dept.id),
      title: dept.title.replace(/\\\\/g, '\\'), // Корректная обработка экранированных символов
      isPublic: dept.public === '1',
      joinText: '' // Устанавливаем пустой текст по умолчанию
    }));

    // Создаем записи в базе данных
    for (const dept of departments) {
      try {
        // Проверяем существование записи
        const existingDept = await FestDepartment.findByPk(dept.id);
        
        if (existingDept) {
          // Обновляем существующую запись
          await existingDept.update(dept);
          console.log(`Обновлен департамент: ${dept.title}`);
        } else {
          // Создаем новую запись
          await FestDepartment.create(dept);
          console.log(`Создан департамент: ${dept.title}`);
        }
      } catch (error) {
        console.error(`Ошибка при обработке департамента ${dept.title}:`, error);
      }
    }

    console.log('Миграция департаментов завершена успешно');
  } catch (error) {
    console.error('Ошибка при миграции департаментов:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrateDepartments(); 