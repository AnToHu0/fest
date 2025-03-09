import { User } from '~/server/models/User';
import { getServerSession } from '#auth';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '~/server/database';
import type { UserAttributes } from '~/server/models/User';
import { Role } from '~/server/models/Role';
import { Festival } from '~/server/models/Festival';
import { FestRegistration } from '~/server/models/FestRegistration';

interface UserWithParent extends UserAttributes {
  Roles?: Role[];
  parent?: UserAttributes | null;
}

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
  const search = query.search?.toString() || '';
  const sortField = query.sort?.toString() || 'fullName';
  const sortOrder = query.order?.toString() === 'desc' ? 'DESC' : 'ASC';
  const showOnlyRegistered = query.showOnlyRegistered === 'true';

  // Получаем текущий активный фестиваль
  const currentFestival = await Festival.findOne({
    where: {
      isActive: true
    }
  });

  // Получаем список всех регистраций на текущий фестиваль
  const registrations = currentFestival ? await FestRegistration.findAll({
    where: {
      festivalId: currentFestival.id
    },
    attributes: ['userId']
  }) : [];

  const registeredUserIds = new Set(registrations.map(reg => reg.userId));

  const whereClause: any = {
    parentId: null, // Показываем только пользователей без родителей
    ...search
      ? {
        [Op.or]: [
          { searchField: { [Op.like]: `%${search.toLowerCase()}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } }
        ]
      }
      : {}
  };

  if (showOnlyRegistered && currentFestival) {
    whereClause.id = { [Op.in]: Array.from(registeredUserIds) };
  }

  // Сначала получаем общее количество записей
  const totalCount = await User.count({
    where: whereClause,
    distinct: true
  });

  // Затем получаем пользователей
  const users = await User.findAll({
    where: whereClause,
    include: [
      {
        model: Role,
        as: 'Roles',
        through: { attributes: [] }
      }
    ],
    order: [[sortField, sortOrder]],
    limit,
    offset,
    subQuery: false
  }) as unknown as UserWithParent[];

  // Получаем количество детей для каждого пользователя
  const childrenCounts = await User.findAll({
    attributes: [
      'parentId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: {
      parentId: {
        [Op.in]: users.map(u => u.id)
      }
    },
    group: ['parentId']
  });

  // Создаем Map для быстрого доступа к количеству детей
  const childrenCountMap = new Map(
    childrenCounts.map(count => [count.get('parentId'), parseInt(count.get('count') as string)])
  );

  const formattedUsers = users.map(user => ({
    id: user.id,
    fullName: user.fullName,
    spiritualName: user.spiritualName,
    birthDate: user.birthDate,
    email: user.email,
    phone: user.phone,
    city: user.city,
    isActive: user.isActive,
    adminNotes: user.adminNotes,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.Roles?.map(role => role.name) || [],
    isRegistered: registeredUserIds.has(user.id),
    childrenCount: childrenCountMap.get(user.id) || 0
  }));

  return {
    users: formattedUsers,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}); 