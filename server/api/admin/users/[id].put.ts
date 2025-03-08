import { User } from '~/server/models/User';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Необходима авторизация'
    });
  }

  // Проверяем роль администратора
  if (!session.user.roles?.includes('admin')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  try {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      });
    }

    // Обновляем данные пользователя
    await user.update({
      fullName: body.fullName,
      spiritualName: body.spiritualName,
      email: body.email,
      phone: body.phone,
      city: body.city,
      adminNotes: body.adminNotes
    });

    return { message: 'Пользователь успешно обновлен' };
  } catch (error: any) {
    console.error('Ошибка при обновлении пользователя:', error);
    throw createError({
      statusCode: 500,
      message: error.message || 'Ошибка при обновлении пользователя'
    });
  }
}); 