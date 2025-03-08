import { User } from './models/User';
import { UserRole } from './models/UserRole';
import { Role } from './models/Role';
import { Op } from 'sequelize';
import sequelize from './models/database';

const testUsers = [
  {
    email: 'test1@example.com',
    password: '$2b$10$K.0HwpsoPDGaB/atHp3no.HqImatuQr8sUF/fOKdiF3vVZQ4ERDAK', // password: 'test123'
    fullName: 'Иванов Иван Иванович',
    spiritualName: 'Кришна дас',
    phone: '+7 (999) 111-11-11',
    city: 'Москва',
    birthDate: new Date('1985-03-15'),
    children: [
      {
        fullName: 'Иванов Петр Иванович',
        spiritualName: 'Прабху дас',
        birthDate: new Date('2015-05-15'),
        city: 'Москва'
      },
      {
        fullName: 'Иванова Мария Ивановна',
        spiritualName: 'Радха деви',
        birthDate: new Date('2018-03-20'),
        city: 'Москва'
      }
    ]
  },
  {
    email: 'test2@example.com',
    password: '$2b$10$K.0HwpsoPDGaB/atHp3no.HqImatuQr8sUF/fOKdiF3vVZQ4ERDAK',
    fullName: 'Петров Петр Петрович',
    spiritualName: 'Нитай дас',
    phone: '+7 (999) 222-22-22',
    city: 'Санкт-Петербург',
    birthDate: new Date('1990-07-20'),
    children: [
      {
        fullName: 'Петров Иван Петрович',
        birthDate: new Date('2019-07-10'),
        city: 'Санкт-Петербург'
      }
    ]
  }
];

// Генерируем дополнительных пользователей без детей
const additionalUsers = Array.from({ length: 13 }, (_, i) => {
  // Генерируем случайную дату рождения между 1980 и 2000 годами
  const year = 1980 + Math.floor(Math.random() * 20);
  const month = Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * 28); // используем 28 дней чтобы избежать проблем с февралем
  
  return {
    email: `test${i + 3}@example.com`,
    password: '$2b$10$K.0HwpsoPDGaB/atHp3no.HqImatuQr8sUF/fOKdiF3vVZQ4ERDAK',
    fullName: `Тестов ${i + 3} Тестович`,
    spiritualName: `Тест дас ${i + 3}`,
    phone: `+7 (999) ${String(i + 3).padStart(3, '0')}-33-33`,
    city: i % 2 === 0 ? 'Москва' : 'Санкт-Петербург',
    birthDate: new Date(year, month, day)
  };
});

async function seedTestUsers() {
  try {
    // Синхронизируем модели с базой данных без пересоздания таблиц
    console.log('Синхронизация моделей с базой данных...');
    await sequelize.sync();
    console.log('Синхронизация завершена');

    // Проверяем существование ролей
    console.log('Проверка базовых ролей...');
    let [adminRole, userRole] = await Promise.all([
      Role.findOne({ where: { name: 'admin' } }),
      Role.findOne({ where: { name: 'user' } })
    ]);

    // Создаем роли, если они не существуют
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'admin',
        description: 'Администратор системы'
      });
    }
    if (!userRole) {
      userRole = await Role.create({
        name: 'user',
        description: 'Обычный пользователь'
      });
    }
    console.log('Роли проверены');

    // Очищаем только тестовые данные
    console.log('Очистка предыдущих тестовых данных...');
    const testEmails = ['admin@example.com', ...testUsers.map(u => u.email), ...additionalUsers.map(u => u.email)];
    await User.destroy({
      where: {
        email: {
          [Op.in]: testEmails
        }
      }
    });

    // Создаем пользователей с детьми
    console.log('Создание тестовых пользователей...');
    for (const userData of testUsers) {
      const { children, ...userInfo } = userData;
      const user = await User.create(userInfo);
      
      // Назначаем роль user
      await UserRole.create({
        userId: user.id,
        roleId: userRole.id
      });
      
      // Создаем детей для пользователя
      if (children) {
        for (const childData of children) {
          const child = await User.create({
            ...childData,
            parentId: user.id,
            email: `child${user.id}_${Math.random().toString(36).substring(7)}@example.com`,
            password: userData.password
          });

          // Назначаем роль user детям
          await UserRole.create({
            userId: child.id,
            roleId: userRole.id
          });
        }
      }
    }

    // Создаем дополнительных пользователей
    const createdUsers = await User.bulkCreate(additionalUsers);

    // Назначаем роль user дополнительным пользователям
    await UserRole.bulkCreate(
      createdUsers.map(user => ({
        userId: user.id,
        roleId: userRole.id
      }))
    );

    // Создаем тестового админа
    const admin = await User.create({
      email: 'admin@example.com',
      password: '$2b$10$K.0HwpsoPDGaB/atHp3no.HqImatuQr8sUF/fOKdiF3vVZQ4ERDAK', // password: 'test123'
      fullName: 'Администратор Системы',
      spiritualName: 'Admin Das',
      city: 'Москва',
      birthDate: new Date('1975-01-01')
    });

    await UserRole.create({
      userId: admin.id,
      roleId: adminRole.id
    });

    console.log('Тестовые данные успешно добавлены');
  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
    process.exit(1);
  }
}

// Запускаем заполнение
seedTestUsers(); 