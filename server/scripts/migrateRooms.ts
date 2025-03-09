import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'server/database.sqlite'
});

// Импортируем определение модели
const FestRoom = sequelize.define('FestRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  building: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'fest_rooms',
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

async function migrateRooms() {
  try {
    // Инициализируем подключение к базе данных
    await sequelize.authenticate();
    console.log('Соединение с базой данных установлено');

    // Читаем PHP файл
    const phpContent = fs.readFileSync('server/tmp/rooms.php', 'utf-8');
    
    // Парсим PHP массив
    const roomsArray = parsePHPArray(phpContent);
    
    // Преобразуем данные в формат нашей модели
    const rooms = roomsArray.map((room: any) => ({
      id: parseInt(room.id),
      building: parseInt(room.building),
      floor: parseInt(room.floor),
      number: parseInt(room.number),
      size: parseInt(room.size),
      description: room.desc || '' // Переименовываем desc в description
    }));

    // Создаем записи в базе данных
    for (const room of rooms) {
      try {
        // Проверяем существование записи
        const existingRoom = await FestRoom.findByPk(room.id);
        
        if (existingRoom) {
          // Обновляем существующую запись
          await existingRoom.update(room);
          console.log(`Обновлена комната: корпус ${room.building}, этаж ${room.floor}, номер ${room.number}`);
        } else {
          // Создаем новую запись
          await FestRoom.create(room);
          console.log(`Создана комната: корпус ${room.building}, этаж ${room.floor}, номер ${room.number}`);
        }
      } catch (error) {
        console.error(`Ошибка при обработке комнаты ${room.building}-${room.floor}-${room.number}:`, error);
      }
    }

    console.log('Миграция комнат завершена успешно');
  } catch (error) {
    console.error('Ошибка при миграции комнат:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

migrateRooms(); 