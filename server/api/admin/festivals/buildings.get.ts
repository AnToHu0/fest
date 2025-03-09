import { FestRoom } from '~/server/models/FestRoom';
import { defineEventHandler, createError } from 'h3';
import { getServerSession } from '#auth';
import { Sequelize } from 'sequelize';

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
    // Получаем уникальные значения корпусов из таблицы комнат
    const buildings = await FestRoom.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('building')), 'building']
      ],
      order: [['building', 'ASC']]
    });
    
    // Преобразуем результат в массив строк
    const buildingsList = buildings.map(item => item.getDataValue('building').toString());
    
    return {
      success: true,
      buildings: buildingsList
    };
  } catch (error: any) {
    console.error('Ошибка при получении списка корпусов:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении списка корпусов'
    });
  }
}); 