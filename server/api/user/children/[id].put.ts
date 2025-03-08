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

    // Получение ID ребенка из параметров запроса
    const childId = getRouterParam(event, 'id');
    if (!childId) {
      throw createError({
        statusCode: 400,
        message: 'ID ребенка не указан'
      });
    }

    // Получение данных из запроса
    const body = await readBody(event);

    // @ts-ignore - Игнорируем ошибку типизации, так как мы знаем, что id существует
    const userId = session.user.id;

    // Проверка, что ребенок принадлежит текущему пользователю
    const child = await models.User.findByPk(parseInt(childId));

    if (!child) {
      throw createError({
        statusCode: 404,
        message: 'Ребенок не найден'
      });
    }

    if (child.parentId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Вы можете редактировать только своих детей'
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