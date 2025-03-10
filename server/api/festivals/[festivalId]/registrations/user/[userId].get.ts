import { FestRegistration } from '~/server/models/FestRegistration';
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
    const currentUser = session.user as any;
    const userRoles = currentUser.roles || [];
    if (!userRoles.includes('admin') && !userRoles.includes('accommodation_manager')) {
      return createError({
        statusCode: 403,
        message: 'Недостаточно прав для доступа'
      });
    }

    // Получение параметров из URL
    const festivalId = event.context.params?.festivalId;
    const userId = event.context.params?.userId;

    if (!festivalId || !userId) {
      return createError({
        statusCode: 400,
        message: 'Необходимо указать ID фестиваля и ID пользователя'
      });
    }

    // Поиск регистрации пользователя на фестиваль
    const registration = await FestRegistration.findOne({
      where: {
        festivalId,
        userId
      }
    });

    return { registration };
  } catch (error) {
    console.error('Ошибка при получении регистрации пользователя:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении регистрации пользователя'
    });
  }
}); 