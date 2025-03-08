import { User } from '~/server/models/User';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    });
  }

  try {
    const user = await User.findByPk(session.user.id, {
      include: [
        {
          model: User,
          as: 'children',
          attributes: { exclude: ['password'] }
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    return user.children || [];
  } catch (error: any) {
    console.error('Ошибка при получении списка детей:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении списка детей'
    });
  }
}); 