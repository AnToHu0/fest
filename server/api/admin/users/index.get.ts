import { User } from '~/server/models/User';
import { getServerSession } from '#auth';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '~/server/database';
import type { UserAttributes } from '~/server/models/User';

export default defineEventHandler(async (event) => {
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

  const query = getQuery(event);
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = (query.search as string || '').toLowerCase();
  const sortField = query.sortField as string || 'id';
  const sortOrder = (query.sortOrder as string || 'asc').toUpperCase() as 'ASC' | 'DESC';

  // Проверяем, что поле сортировки допустимо
  const allowedSortFields = ['id', 'fullName', 'email', 'phone', 'city'];
  const finalSortField = allowedSortFields.includes(sortField) ? sortField : 'id';

  try {
    let where: any = {
      [Op.or]: [
        { parentId: null },
        { parentId: '' }
      ]
    };

    // Добавляем условия поиска, если есть
    if (search) {
      where = {
        [Op.and]: [
          {
            [Op.or]: [
              { parentId: null },
              { parentId: '' }
            ]
          },
          {
            [Op.or]: [
              { searchField: { [Op.like]: `%${search}%` } },
              sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), 'LIKE', `%${search}%`),
              { phone: { [Op.like]: `%${search}%` } }
            ]
          }
        ]
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[finalSortField, sortOrder]],
      attributes: { exclude: ['password'] }
    });

    // Получаем количество детей для каждого пользователя
    const usersWithChildrenCount = await Promise.all(
      rows.map(async (user) => {
        const childrenCount = await User.count({
          where: { parentId: user.id }
        });
        return {
          ...user.toJSON(),
          childrenCount
        };
      })
    );

    return {
      users: usersWithChildrenCount,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error: any) {
    console.error('Ошибка при получении списка пользователей:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении списка пользователей'
    });
  }
}); 