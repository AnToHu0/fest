import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { FestRegistration } from '~/server/models/FestRegistration';
import { FestRegistrationChild } from '~/server/models/FestRegistrationChild';
import { FestRegistrationDepartment } from '~/server/models/FestRegistrationDepartment';
import sequelize from '~/server/database';

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
      // Удаляем связи с детьми
      await FestRegistrationChild.destroy({
        where: { registrationId: registration.id },
        transaction
      });

      // Удаляем связи с департаментами
      await FestRegistrationDepartment.destroy({
        where: { registrationId: registration.id },
        transaction
      });

      // Удаляем саму регистрацию
      await registration.destroy({ transaction });

      // Фиксируем транзакцию
      await transaction.commit();

      return {
        success: true,
        message: 'Регистрация успешно удалена'
      };
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Ошибка при удалении регистрации:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при удалении регистрации'
    });
  }
}); 