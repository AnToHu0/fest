import { getServerSession } from '#auth';
import models from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    // Проверка авторизации
    const session = await getServerSession(event);
    if (!session) {
      throw createError({
        statusCode: 401,
        message: 'Необходима авторизация'
      });
    }

    // Проверка роли администратора
    if (!session.user.roles?.includes('admin')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получение ID пользователя и ребенка из параметров запроса
    const userId = getRouterParam(event, 'id');
    const childId = getRouterParam(event, 'childId');
    
    if (!userId || !childId) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя или ребенка не указан'
      });
    }

    // Проверка существования пользователя
    const user = await models.User.findByPk(parseInt(userId));
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Получение данных из запроса
    const body = await readBody(event);

    // Проверка, что ребенок принадлежит указанному пользователю
    const child = await models.User.findByPk(parseInt(childId));

    if (!child) {
      throw createError({
        statusCode: 404,
        message: 'Ребенок не найден'
      });
    }

    if (child.parentId !== parseInt(userId)) {
      throw createError({
        statusCode: 400,
        message: 'Ребенок не принадлежит указанному пользователю'
      });
    }

    // Обновление данных ребенка (без изменения email)
    await child.update({
      fullName: body.fullName,
      spiritualName: body.spiritualName || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      city: body.city || null
    });

    return {
      id: child.id,
      message: 'Данные ребенка успешно обновлены'
    };
  } catch (error: any) {
    console.error('Ошибка при обновлении данных ребенка:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при обновлении данных ребенка'
    });
  }
}); 