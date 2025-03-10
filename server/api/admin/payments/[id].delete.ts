import { PaymentTransaction } from '~/server/models/PaymentTransaction';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
    const session = await getServerSession(event);
    if (!session) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }

    const user = session.user;
    if (!user.roles?.includes('admin')) {
      throw createError({
        statusCode: 403,
        message: 'Forbidden'
      });
    }

    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Payment ID is required'
      });
    }

    const payment = await PaymentTransaction.findByPk(id);
    if (!payment) {
      throw createError({
        statusCode: 404,
        message: 'Payment not found'
      });
    }

    await payment.destroy();

    return {
      success: true
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Internal Server Error'
    });
  }
}); 