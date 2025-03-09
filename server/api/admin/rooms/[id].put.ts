import { FestRoom } from '~/server/models/FestRoom';
import { defineEventHandler, createError, readBody } from 'h3';
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

    const body = await readBody(event);
    
    // Проверяем наличие обязательных полей
    if (body.building === undefined || body.building === null || 
        body.floor === undefined || body.floor === null || 
        body.number === undefined || body.number === null || 
        body.size === undefined || body.size === null) {
      throw createError({
        statusCode: 400,
        message: 'Не заполнены обязательные поля'
      });
    }
    
    // Преобразуем значения в числа
    const building = Number(body.building);
    const floor = Number(body.floor);
    const number = Number(body.number);
    const size = Number(body.size);
    
    // Проверяем, что значения полей являются корректными числами
    if (isNaN(building) || isNaN(floor) || isNaN(number) || isNaN(size) ||
        building <= 0 || floor <= 0 || number <= 0 || size <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Некорректные значения полей'
      });
    }
    
    // Обновляем комнату
    await room.update({
      building,
      floor,
      number,
      size,
      description: body.description || ''
    });
    
    return {
      success: true,
      room
    };
  } catch (error: any) {
    console.error('Ошибка при обновлении комнаты:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при обновлении комнаты'
    });
  }
}); 