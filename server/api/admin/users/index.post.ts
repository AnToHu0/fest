import { getServerSession } from '#auth';
import bcrypt from 'bcrypt';
import { createUserWithActivation } from '~/server/email/userActivation';

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию и роль администратора
  const session = await getServerSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: 'Требуется авторизация'
    });
  }

  // Проверяем, есть ли у пользователя роль admin
  if (!session.user.roles?.includes('admin')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав для выполнения операции'
    });
  }

  try {
    const body = await readBody(event);

    // Проверяем обязательные поля
    if (!body.fullName || !body.email) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать ФИО и email'
      });
    }

    // Генерируем временный пароль
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Создаем пользователя с отправкой письма для активации
    try {
      const newUser = await createUserWithActivation({
        fullName: body.fullName,
        spiritualName: body.spiritualName || null,
        email: body.email,
        phone: body.phone || null,
        city: body.city || null,
        adminNotes: body.adminNotes || null,
        password: hashedPassword
      });

      // Возвращаем созданного пользователя без пароля
      return {
        id: newUser.id,
        fullName: newUser.fullName,
        spiritualName: newUser.spiritualName,
        email: newUser.email,
        phone: newUser.phone,
        city: newUser.city,
        adminNotes: newUser.adminNotes,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        message: 'Пользователь создан. На указанный email отправлено письмо для активации учетной записи.'
      };
    } catch (error: any) {
      console.error('Ошибка при создании пользователя:', error);
      throw createError({
        statusCode: 400,
        message: error.message
      });
    }
  } catch (error: any) {
    console.error('Ошибка при создании пользователя:', error);
    
    // Если это наша ошибка, пробрасываем ее дальше
    if (error.statusCode) {
      throw error;
    }
    
    // Иначе возвращаем общую ошибку сервера
    throw createError({
      statusCode: 500,
      message: 'Ошибка при создании пользователя'
    });
  }
}); 