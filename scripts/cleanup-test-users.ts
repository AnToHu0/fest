import { User } from './models/User';
import { UserRole } from './models/UserRole';
import { Op } from 'sequelize';

async function cleanupTestUsers() {
  try {
    // Находим ID всех тестовых пользователей
    const testUsers = await User.findAll({
      where: {
        email: {
          [Op.like]: 'test%@example.com'
        }
      },
      attributes: ['id']
    });

    const userIds = testUsers.map(user => user.id);

    if (userIds.length > 0) {
      // Удаляем роли тестовых пользователей
      await UserRole.destroy({
        where: {
          userId: {
            [Op.in]: userIds
          }
        }
      });

      // Удаляем тестовых пользователей (включая их детей благодаря каскадному удалению)
      const deleted = await User.destroy({
        where: {
          email: {
            [Op.like]: 'test%@example.com'
          }
        }
      });

      console.log(`Удалено ${deleted} тестовых пользователей и их роли`);
    } else {
      console.log('Тестовые пользователи не найдены');
    }
  } catch (error) {
    console.error('Ошибка при удалении тестовых данных:', error);
    process.exit(1);
  }
}

// Запускаем очистку
cleanupTestUsers(); 