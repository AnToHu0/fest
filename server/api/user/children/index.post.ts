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

    // Получение данных из запроса
    const body = await readBody(event);

    // @ts-ignore - Игнорируем ошибку типизации, так как мы знаем, что id существует
    const userId = session.user.id;

    // Проверка, что родитель указан корректно
    if (!body.parentId) {
      body.parentId = userId;
    } else if (body.parentId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'Вы можете добавлять детей только к своему профилю'
      });
    }

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
      parentId: body.parentId,
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