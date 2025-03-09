import { FestDepartment } from '~/server/models/FestDepartment';
import { User } from '~/server/models/User';
import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию
    const session = await getServerSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Необходима авторизация'
      });
    }

    // Проверяем роль администратора
    if (!session.user.roles?.includes('admin')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получаем все департаменты с их администраторами
    const departments = await FestDepartment.findAll({
      include: [
        {
          model: User,
          as: 'Admins',
          attributes: ['id', 'fullName', 'spiritualName', 'email'],
          through: { attributes: [] }
        }
      ],
      order: [['title', 'ASC']]
    });

    return departments;
  } catch (error: any) {
    console.error('Ошибка при получении списка департаментов:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении списка департаментов'
    });
  }
}); 