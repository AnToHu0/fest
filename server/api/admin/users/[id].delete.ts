import { User } from '~/server/models/User';
import { getServerSession } from '#auth';
import sequelize from '~/server/database';

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

    // Проверяем, есть ли у пользователя роль admin
    if (!session.user.roles?.includes('admin')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав для выполнения операции'
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

    // Находим пользователя вместе с его детьми
    const user = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: 'children'
        }
      ]
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Используем транзакцию для удаления пользователя и его детей
    await sequelize.transaction(async (t) => {
      // Если у пользователя есть дети, удаляем их сначала
      if (user.children && user.children.length > 0) {
        for (const child of user.children) {
          await User.destroy({
            where: { id: child.id },
            transaction: t
          });
        }
      }

      // Затем удаляем самого пользователя
      await user.destroy({ transaction: t });
    });

    return {
      success: true,
      message: 'Пользователь и все его дети успешно удалены'
    };

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при удалении пользователя'
    });
  }
}); 