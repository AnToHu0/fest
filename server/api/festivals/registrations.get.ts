import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { FestRegistration } from '~/server/models/FestRegistration';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { FestRegistrationDepartment } from '~/server/models/FestRegistrationDepartment';
import { FestDepartment } from '~/server/models/FestDepartment';
import { Festival } from '~/server/models/Festival';
import { User } from '~/server/models/User';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    });
  }

  // Проверяем роль пользователя
  if (!session.user.roles?.includes('user')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  try {
    // Получаем все регистрации пользователя
    const registrations = await FestRegistration.findAll({
      where: {
        userId: session.user.id
      },
      include: [
        {
          model: Festival,
          as: 'Festival'
        },
        {
          model: FestRegistrationChild,
          as: 'RegistrationChildren',
          include: [
            {
              model: User,
              as: 'Child',
              attributes: ['id', 'fullName', 'birthDate']
            }
          ]
        },
        {
          model: FestDepartment,
          as: 'Departments',
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Преобразуем данные в формат, понятный клиенту
    const formattedRegistrations = registrations.map(registration => {
      return registration.get({ plain: true });
    });

    return {
      success: true,
      registrations: formattedRegistrations
    };
  } catch (error: any) {
    console.error('Ошибка при получении регистраций пользователя:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении регистраций пользователя'
    });
  }
}); 