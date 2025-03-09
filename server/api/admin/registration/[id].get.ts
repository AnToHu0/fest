import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { FestRegistration } from '~/server/models/FestRegistration';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { FestRegistrationDepartment } from '~/server/models/FestRegistrationDepartment';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
import { FestDepartment } from '~/server/models/FestDepartment';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    });
  }

  // Проверяем роль администратора или регистратора
  if (!session.user.roles?.includes('admin') && !session.user.roles?.includes('registrar')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  const userId = event.context.params?.id;
  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'Не указан ID пользователя'
    });
  }

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

  // Получаем регистрацию пользователя
  const registration = await FestRegistration.findOne({
    where: {
      userId: userId,
      festivalId: currentFestival.id
    },
    include: [
      {
        model: User,
        as: 'RegisteredChildren',
        through: {
          attributes: ['needsSeparateBed']
        },
        attributes: ['id', 'fullName', 'birthDate']
      },
      {
        model: FestDepartment,
        as: 'Departments',
        through: { attributes: [] },
        attributes: ['id']
      }
    ]
  });

  // Если регистрация не найдена, возвращаем null
  if (!registration) {
    return {
      success: true,
      registration: null
    };
  }

  // Форматируем данные для ответа
  const formattedRegistration = {
    id: registration.id,
    userId: registration.userId,
    festivalId: registration.festivalId,
    arrivalDate: registration.arrivalDate,
    departureDate: registration.departureDate,
    hasCar: registration.hasCar,
    freeSeatsInCar: registration.freeSeatsInCar,
    hasPet: registration.hasPet,
    notes: registration.notes,
    departmentIds: (registration as any).Departments?.map((d: any) => d.id) || [],
    children: (registration as any).RegisteredChildren?.map((child: any) => ({
      id: child.id,
      fullName: child.fullName,
      birthDate: child.birthDate,
      needsSeparateBed: child.FestRegistrationChild.needsSeparateBed
    })) || []
  };

  return {
    success: true,
    registration: formattedRegistration
  };
}); 