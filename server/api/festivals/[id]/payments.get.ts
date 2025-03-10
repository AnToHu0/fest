import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { PaymentTransaction } from '~/server/models/PaymentTransaction';
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

    // Получаем ID фестиваля из URL
    const festivalId = Number(event.context.params?.id);
    if (!festivalId || isNaN(festivalId)) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID фестиваля'
      });
    }

    // Получаем все платежи пользователя за указанный фестиваль
    const payments = await PaymentTransaction.findAll({
      where: {
        customerId: session.user.id,
        festivalId: festivalId
      },
      include: [{
        model: User,
        as: 'Registrator',
        attributes: ['id', 'fullName']
      }],
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