import { FestPlacement } from '~/server/models/FestPlacement';
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

    // Получение ID размещения из параметров маршрута
    const id = event.context.params?.id;
    if (!id) {
      return createError({
        statusCode: 400,
        message: 'Не указан ID размещения'
      });
    }

    // Проверка существования размещения
    const placement = await FestPlacement.findByPk(id);
    if (!placement) {
      return createError({
        statusCode: 404,
        message: 'Размещение не найдено'
      });
    }

    // Удаление размещения
    await placement.destroy();

    return { success: true, message: 'Размещение успешно удалено' };
  } catch (error) {
    console.error('Ошибка при удалении размещения:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при удалении размещения'
    });
  }
}); 