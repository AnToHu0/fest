import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { initDatabase } from '~/server/database';

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
  if (!session.user.roles?.includes('admin')) {
    throw createError({
      statusCode: 403,
      message: 'Недостаточно прав'
    });
  }

  try {
    // Инициализируем базу данных
    await initDatabase();
    
    return {
      success: true,
      message: 'База данных успешно инициализирована'
    };
  } catch (error: any) {
    console.error('Ошибка при инициализации базы данных:', error);
    
    // Формируем подробное сообщение об ошибке
    let errorMessage = 'Ошибка при инициализации базы данных';
    if (error.message) {
      errorMessage += ': ' + error.message;
    }
    
    // Если есть стек вызовов, добавляем его
    if (error.stack) {
      console.error('Стек вызовов:', error.stack);
    }
    
    throw createError({
      statusCode: 500,
      message: errorMessage,
      data: {
        error: error.toString(),
        stack: error.stack
      }
    });
  }
}); 