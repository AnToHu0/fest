import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
    // Проверка авторизации
    const session = await getServerSession(event);
    if (!session) {
      return createError({
        statusCode: 401,
        message: 'Необходимо авторизоваться'
      });
    }

    // Проверка прав доступа (admin или accommodation_manager)
    const user = session.user as any;
    const userRoles = user.roles || [];
    if (!userRoles.includes('admin') && !userRoles.includes('accommodation_manager')) {
      return createError({
        statusCode: 403,
        message: 'Недостаточно прав для доступа'
      });
    }

    // Получение ID пользователя из параметров маршрута
    const userId = event.context.params?.userId;
    if (!userId) {
      return createError({
        statusCode: 400,
        message: 'Не указан ID пользователя'
      });
    }

    // Получение параметров запроса
    const query = getQuery(event);
    const needsBed = query.needsBed === 'true';

    // Формирование условий фильтрации
    const where: any = {
      userId
    };

    // Если указан фильтр по необходимости кровати
    if (query.needsBed !== undefined) {
      where.needsBed = needsBed;
    }

    // Получение списка детей пользователя
    const children = await FestRegistrationChild.findAll({
      where,
      order: [['id', 'ASC']]
    });

    return { children };
  } catch (error) {
    console.error('Ошибка при получении списка детей:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении списка детей'
    });
  }
}); 