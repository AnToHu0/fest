import { PaymentTransaction } from '~/server/models/PaymentTransaction';
import { defineEventHandler, createError, readBody } from 'h3';
import { getServerSession } from '#auth';

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

    // Получаем данные платежа
    const body = await readBody(event);

    // Проверяем обязательные поля
    if (!body.customerId || !body.adminId || !body.amount || !body.festivalId) {
      throw createError({
        statusCode: 400,
        message: 'Не указаны обязательные поля'
      });
    }

    // Создаем платеж
    const payment = await PaymentTransaction.create({
      customerId: body.customerId,
      adminId: body.adminId,
      festivalId: body.festivalId,
      paymentType: body.paymentType,
      paymentDest: body.paymentDest,
      amount: body.amount,
      date: body.date || new Date()
    });

    return {
      success: true,
      payment
    };
  } catch (error: any) {
    console.error('Ошибка при создании платежа:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при создании платежа'
    });
  }
}); 