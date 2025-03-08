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

    // @ts-ignore - Игнорируем ошибку типизации, так как мы знаем, что id существует
    const userId = session.user.id;

    // Получение списка детей пользователя
    const children = await models.User.findAll({
      where: {
        parentId: userId
      },
      attributes: [
        'id', 
        'fullName', 
        'spiritualName', 
        'birthDate', 
        'email', 
        'phone', 
        'city'
      ]
    });

    return children;
  } catch (error: any) {
    console.error('Ошибка при получении списка детей:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении списка детей'
    });
  }
}); 