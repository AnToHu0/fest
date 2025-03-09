import { User } from '~/server/models/User';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  try {
    const session = await getServerSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Необходима авторизация'
      });
    }

    const children = await User.findAll({
      where: {
        parentId: session.user.id
      },
      attributes: ['id', 'fullName', 'birthDate']
    });

    return children;
  } catch (error: any) {
    console.error('Ошибка при получении списка детей:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при получении списка детей'
    });
  }
}); 