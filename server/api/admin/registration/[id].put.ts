import { defineEventHandler, createError, readBody } from 'h3';
import { getServerSession } from '#auth';
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
    const registrationId = event.context.params?.id;
    if (!registrationId) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID регистрации'
      });
    }

    // Получаем данные из тела запроса
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

    // Проверяем существование регистрации
    const registration = await FestRegistration.findByPk(registrationId);
    if (!registration) {
      throw createError({
        statusCode: 404,
        message: 'Регистрация не найдена'
      });
    }

    // Начинаем транзакцию
    const transaction = await sequelize.transaction();

    try {
      // Обновляем основные данные регистрации
      await registration.update({
        arrivalDate,
        departureDate,
        hasCar: hasCar || false,
        freeSeatsInCar: freeSeatsInCar || 0,
        hasPet: hasPet || false,
        notes: notes || ''
      }, { transaction });

      // Обновляем связи с департаментами
      await FestRegistrationDepartment.destroy({
        where: { registrationId: registration.id },
        transaction
      });

      if (departmentIds && departmentIds.length > 0) {
        const departmentPromises = departmentIds.map((departmentId: number) => 
          FestRegistrationDepartment.create({
            registrationId: registration.id,
            departmentId
          }, { transaction })
        );
        await Promise.all(departmentPromises);
      }

      // Обновляем связи с детьми
      await FestRegistrationChild.destroy({
        where: { registrationId: registration.id },
        transaction
      });

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

      // Получаем обновленную регистрацию со всеми связями
      const updatedRegistration = await FestRegistration.findByPk(registration.id, {
        include: [
          {
            model: User,
            as: 'RegisteredChildren',
            through: {
              attributes: ['needsSeparateBed']
            },
            attributes: ['id', 'fullName', 'birthDate']
          }
        ]
      });

      return {
        success: true,
        message: 'Регистрация успешно обновлена',
        registration: updatedRegistration
      };
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Ошибка при обновлении регистрации:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при обновлении регистрации'
    });
  }
}); 