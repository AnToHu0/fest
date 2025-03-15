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
    if (!session.user.roles?.includes('admin') && !session.user.roles?.includes('registrar')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получение ID пользователя из параметров запроса
    const userId = getRouterParam(event, 'id');
    if (!userId) {
      throw createError({
        statusCode: 400,
        message: 'ID пользователя не указан'
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

    // Генерация уникального email для ребенка
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueEmail = `child_${timestamp}_${randomString}@example.com`;

    // Создание нового ребенка
    const newChild = await models.User.create({
      fullName: body.fullName,
      spiritualName: body.spiritualName || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      email: uniqueEmail, // Используем уникальный email
      city: body.city || null,
      password: await models.User.hashPassword(Math.random().toString(36).substring(2, 12)),
      parentId: parseInt(userId),
      isActive: true
    });

    // Добавление роли "CHILD" для нового пользователя
    const childRole = await models.Role.findOne({ where: { name: 'CHILD' } });
    if (childRole) {
      await models.UserRole.create({
        userId: newChild.id,
        roleId: childRole.id
      });
    }

    return {
      id: newChild.id,
      message: 'Ребенок успешно добавлен'
    };
  } catch (error: any) {
    console.error('Ошибка при добавлении ребенка:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при добавлении ребенка'
    });
  }
}); 