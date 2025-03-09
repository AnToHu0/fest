import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { FestRegistration } from '~/server/models/FestRegistration';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { FestDepartment } from '~/server/models/FestDepartment';
import { FestRegistrationDepartment } from '~/server/models/FestRegistrationDepartment';
import { User } from '~/server/models/User';

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

    // Проверяем роль пользователя
    if (!session.user.roles?.includes('user')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получаем ID фестиваля из параметров запроса
    const festivalId = event.context.params?.id;
    if (!festivalId) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID фестиваля'
      });
    }

    // Получаем регистрацию пользователя на фестиваль
    const registration = await FestRegistration.findOne({
      where: {
        userId: session.user.id,
        festivalId: parseInt(festivalId)
      }
    });

    if (!registration) {
      return {
        success: false,
        message: 'Регистрация не найдена'
      };
    }

    // Получаем детей, связанных с регистрацией
    const registrationChildren = await FestRegistrationChild.findAll({
      where: {
        registrationId: registration.id
      },
      include: [
        {
          model: User,
          as: 'RegisteredChild',
          attributes: ['id', 'fullName', 'birthDate']
        }
      ]
    });

    // Получаем департаменты, выбранные пользователем
    const registrationDepartments = await FestRegistrationDepartment.findAll({
      where: {
        registrationId: registration.id
      }
    });

    // Получаем информацию о департаментах
    const departmentIds = registrationDepartments.map(rd => rd.departmentId);
    const departments = await FestDepartment.findAll({
      where: {
        id: departmentIds
      },
      attributes: ['id', 'title']
    });

    // Форматируем данные о детях
    const children = registrationChildren.map(regChild => {
      const child = regChild.get('RegisteredChild') as User;
      return {
        id: regChild.childId,
        fullName: child?.fullName || 'Неизвестно',
        birthDate: child?.birthDate || null,
        needsSeparateBed: regChild.needsSeparateBed
      };
    });

    // Форматируем данные о регистрации
    const formattedRegistration = {
      id: registration.id,
      arrivalDate: registration.arrivalDate,
      departureDate: registration.departureDate,
      hasCar: registration.hasCar,
      freeSeatsInCar: registration.freeSeatsInCar,
      hasPet: registration.hasPet,
      notes: registration.notes,
      children
    };

    return {
      success: true,
      registration: formattedRegistration,
      departments
    };
  } catch (error: any) {
    console.error('Ошибка при получении информации о регистрации:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении информации о регистрации'
    });
  }
}); 