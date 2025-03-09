import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { Festival } from '~/server/models/Festival';
import { FestRegistration } from '~/server/models/FestRegistration';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { FestRegistrationDepartment } from '~/server/models/FestRegistrationDepartment';
import { User } from '~/server/models/User';
import sequelize from '~/server/database';

interface ChildRegistration {
  id: number;
  needsSeparateBed?: boolean;
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

  // Проверяем роль пользователя
  if (!session.user.roles?.some(role => ['admin', 'registrar'].includes(role))) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  try {
    const body = await readBody(event);
    const { 
      userId,
      festivalId, 
      arrivalDate, 
      departureDate, 
      hasCar, 
      freeSeatsInCar, 
      hasPet,
      notes, 
      departmentIds, 
      children 
    } = body;

    // Проверяем обязательные поля
    if (!userId || !festivalId || !arrivalDate || !departureDate) {
      throw createError({
        statusCode: 400,
        message: 'Не указаны обязательные поля'
      });
    }

    // Проверяем существование пользователя
    const user = await User.findByPk(userId);
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем существование фестиваля
    const festival = await Festival.findByPk(festivalId);
    if (!festival) {
      throw createError({
        statusCode: 404,
        message: 'Фестиваль не найден'
      });
    }

    // Проверяем, что пользователь еще не зарегистрирован на этот фестиваль
    const existingRegistration = await FestRegistration.findOne({
      where: {
        userId,
        festivalId
      }
    });

    if (existingRegistration) {
      throw createError({
        statusCode: 400,
        message: 'Пользователь уже зарегистрирован на этот фестиваль'
      });
    }

    // Начинаем транзакцию
    const transaction = await sequelize.transaction();

    try {
      // Создаем запись о регистрации
      const registration = await FestRegistration.create({
        userId,
        festivalId,
        arrivalDate,
        departureDate,
        hasCar: hasCar || false,
        freeSeatsInCar: freeSeatsInCar || 0,
        hasPet: hasPet || false,
        notes: notes || '',
        registeredBy: session.user.id
      }, { transaction });

      // Если указаны департаменты, создаем связи
      if (departmentIds && departmentIds.length > 0) {
        const departmentPromises = departmentIds.map((departmentId: number) => 
          FestRegistrationDepartment.create({
            registrationId: registration.id,
            departmentId
          }, { transaction })
        );
        await Promise.all(departmentPromises);
      }

      // Если указаны дети, создаем связи
      if (children && children.length > 0) {
        const childPromises = children.map((child: ChildRegistration) => 
          FestRegistrationChild.create({
            registrationId: registration.id,
            childId: child.id,
            needsSeparateBed: child.needsSeparateBed || false
          }, { transaction })
        );
        await Promise.all(childPromises);
      }

      // Фиксируем транзакцию
      await transaction.commit();

      return {
        success: true,
        message: 'Регистрация успешно создана',
        registration: {
          id: registration.id,
          userId,
          festivalId,
          arrivalDate,
          departureDate,
          hasCar,
          freeSeatsInCar,
          hasPet,
          notes,
          registeredBy: session.user.id
        }
      };
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Ошибка при создании регистрации:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при создании регистрации'
    });
  }
}); 