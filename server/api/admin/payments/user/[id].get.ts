import { defineEventHandler, createError, getQuery } from 'h3';
import { getServerSession } from '#auth';
import { PaymentTransaction } from '~/server/models/PaymentTransaction';

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
    if (!session.user.roles?.some(role => ['admin', 'registrar'].includes(role))) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получаем ID пользователя из URL
    const userId = Number(event.context.params?.id);
    if (!userId || isNaN(userId)) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID пользователя'
      });
    }

    // Получаем ID фестиваля из query параметров
    const query = getQuery(event);
    const festivalId = Number(query.festivalId);
    if (!festivalId || isNaN(festivalId)) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID фестиваля'
      });
    }

    // Получаем все платежи пользователя за указанный фестиваль
    const payments = await PaymentTransaction.findAll({
      where: {
        customerId: userId,
        festivalId: festivalId
      },
      order: [['date', 'DESC']]
    });

    return {
      success: true,
      payments
    };
  } catch (error: any) {
    console.error('Ошибка при получении платежей:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении платежей'
    });
  }
}); 