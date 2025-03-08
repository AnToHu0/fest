import { User } from '~/server/models/User';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
    // Проверяем права доступа
    const session = await getServerSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Не авторизован'
      });
    }

    // Получаем ID пользователя из параметров
    const userId = event.context.params?.id;
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя не указан'
      });
    }

    // Находим пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Удаляем пользователя
    await user.destroy();

    return {
      success: true,
      message: 'Пользователь успешно удален'
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при удалении пользователя'
    });
  }
}); 