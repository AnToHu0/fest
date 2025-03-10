import { User } from '~/server/models/User';
import { FestRegistration } from '~/server/models/FestRegistration';
import { getServerSession } from '#auth';
import { Op } from 'sequelize';

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

    // Получение ID фестиваля из параметров маршрута
    const festivalId = event.context.params?.festivalId;
    if (!festivalId) {
      return createError({
        statusCode: 400,
        message: 'Не указан ID фестиваля'
      });
    }

    // Получение параметров фильтрации
    const query = getQuery(event);
    const search = query.search as string || '';

    // Получение списка зарегистрированных пользователей
    const registrations = await FestRegistration.findAll({
      where: {
        festivalId
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'fullName', 'email', 'phone'],
          where: search ? {
            [Op.or]: [
              { searchField: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        }
      ]
    });

    // Формирование списка пользователей
    const users = registrations.map(reg => (reg as any).User).filter(Boolean);

    return { users };
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    return createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении списка пользователей'
    });
  }
}); 