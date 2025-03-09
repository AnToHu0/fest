import { User } from '~/server/models/User';
import { Role } from '~/server/models/Role';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
    const session = await getServerSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Необходима авторизация'
      });
    }

    const userId = parseInt(getRouterParam(event, 'userId'));
    
    // Проверяем роль администратора
    if (!session.user.roles?.includes('admin') && session.user.id !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    const children = await User.findAll({
      where: {
        parentId: userId
      },
      attributes: ['id', 'fullName', 'birthDate']
    });

    return children;
  } catch (error: any) {
    console.error('Ошибка при получении списка детей:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении списка детей'
    });
  }
}); 