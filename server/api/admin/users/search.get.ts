import { User } from '~/server/models/User';
import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { Op } from 'sequelize';

export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию
    const session = await getServerSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Необходима авторизация'
      });
    }

    // Проверяем роль администратора
    if (!session.user.roles?.includes('admin')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получаем параметры запроса
    const query = getQuery(event);
    const search = (query.q as string || '').toLowerCase();
    const onlyAdults = query.onlyAdults === 'true';
    
    if (!search || search.length < 2) {
      throw createError({
        statusCode: 400,
        message: 'Поисковый запрос должен содержать не менее 2 символов'
      });
    }

    // Базовые условия поиска
    const whereConditions: any = {
      [Op.or]: [
        { searchField: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ]
    };
    
    // Если нужны только взрослые, добавляем условие parentId IS NULL
    if (onlyAdults) {
      whereConditions.parentId = null;
    }

    // Ищем пользователей по имени или email
    const users = await User.findAll({
      where: whereConditions,
      attributes: ['id', 'fullName', 'spiritualName', 'email', 'parentId'],
      limit: 10
    });

    return users;
  } catch (error: any) {
    console.error('Ошибка при поиске пользователей:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при поиске пользователей'
    });
  }
}); 