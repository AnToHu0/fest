import { FestDepartment } from '~/server/models/FestDepartment';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
import { FestRegistration } from '~/server/models/FestRegistration';
import { defineEventHandler, createError, getQuery } from 'h3';
import { getServerSession } from '#auth';
import { Op } from 'sequelize';

interface UserWithAttributes {
  id: number;
  fullName: string;
  spiritualName: string | null;
  email: string;
  phone: string | null;
}

interface RegistrationWithUser extends FestRegistration {
  User: UserWithAttributes;
}

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

    // Получаем параметры запроса
    const query = getQuery(event);
    const search = (query.search as string || '').toLowerCase();
    const departmentId = query.departmentId as string;
    const searchDepartmentId = query.searchDepartmentId as string;

    // Получаем текущий активный фестиваль
    const currentFestival = await Festival.findOne({
      where: {
        isActive: true
      }
    });

    if (!currentFestival) {
      throw createError({
        statusCode: 404,
        message: 'Активный фестиваль не найден'
      });
    }

    // Получаем департаменты, где пользователь является администратором
    const userDepartments = await FestDepartment.findAll({
      include: [{
        model: User,
        as: 'Admins',
        where: {
          id: session.user.id
        },
        attributes: [],
        through: { attributes: [] }
      }]
    });

    if (userDepartments.length === 0) {
      return {
        departments: []
      };
    }

    // Если указан конкретный департамент, проверяем права доступа
    if (departmentId) {
      const hasAccess = userDepartments.some(dept => dept.id === parseInt(departmentId));
      if (!hasAccess) {
        throw createError({
          statusCode: 403,
          message: 'Нет доступа к этому департаменту'
        });
      }
    }

    // Получаем пользователей для каждого департамента
    const departmentsWithUsers = await Promise.all(
      userDepartments.map(async (department) => {
        // Если указан конкретный департамент и это не он, пропускаем
        if (departmentId && department.id !== parseInt(departmentId)) {
          return null;
        }

        // Если указан конкретный департамент для поиска и это не он, не применяем поиск
        const shouldApplySearch = !searchDepartmentId || department.id === parseInt(searchDepartmentId);
        const searchCondition = shouldApplySearch && search ? {
          [Op.or]: [
            { searchField: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } }
          ]
        } : undefined;

        // Находим регистрации пользователей в этом департаменте
        const registrations = await FestRegistration.findAll({
          where: {
            festivalId: currentFestival.id
          },
          include: [
            {
              model: User,
              as: 'User',
              where: searchCondition,
              attributes: ['id', 'fullName', 'spiritualName', 'email', 'phone']
            },
            {
              model: FestDepartment,
              as: 'Departments',
              where: {
                id: department.id
              },
              attributes: [],
              through: { attributes: [] }
            }
          ]
        }) as RegistrationWithUser[];

        const users = registrations
          .map(reg => reg.User)
          .filter((user): user is UserWithAttributes => user !== null && user !== undefined);

        return {
          id: department.id,
          title: department.title,
          users: users
        };
      })
    );

    // Фильтруем null значения и возвращаем результат
    return {
      departments: departmentsWithUsers.filter(Boolean)
    };
  } catch (error: any) {
    console.error('Ошибка при получении пользователей департаментов:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении пользователей департаментов'
    });
  }
}); 