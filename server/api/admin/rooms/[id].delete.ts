import { FestRoom } from '~/server/models/FestRoom';
import { defineEventHandler, createError } from 'h3';
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

  try {
    const id = event.context.params?.id;
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Не указан ID комнаты'
      });
    }

    // Проверяем существование комнаты
    const room = await FestRoom.findByPk(id);
    if (!room) {
      throw createError({
        statusCode: 404,
        message: 'Комната не найдена'
      });
    }

    // Удаляем комнату
    await room.destroy();
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Ошибка при удалении комнаты:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при удалении комнаты'
    });
  }
}); 