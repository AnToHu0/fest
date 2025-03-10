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

  // Проверяем роль администратора
  if (!session.user.roles?.includes('admin')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  const id = event.context.params?.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Не указан ID пользователя'
    });
  }

  try {
    const user = await User.findByPk(id, {
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

    return user;
  } catch (error: any) {
    console.error('Ошибка при получении данных пользователя:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении данных пользователя'
    });
  }
}); 